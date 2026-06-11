"""
Database migration helpers for Supabase/Postgres deployments.

Repairs known inconsistent migration history (e.g. events.0005 applied before
events.0004) so `migrate` can complete and auth tables stay in sync.
"""

from __future__ import annotations

import io
from typing import Any

from django.core.management import call_command
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder


# events.0005 was deployed to production before 0004 existed, leaving a gap.
EVENTS_REPAIR_FAKES = (
    ('events', '0004_eventimage', '0005_alter_event_banner_image_alter_eventimage_image'),
)


def _applied_migrations(app_label: str) -> set[str]:
    return set(
        MigrationRecorder.Migration.objects.filter(app=app_label).values_list('name', flat=True)
    )


def repair_migration_history() -> list[str]:
    """Fake-apply missing dependency migrations when a later one is already recorded."""
    repairs: list[str] = []
    for app_label, missing_name, later_name in EVENTS_REPAIR_FAKES:
        applied = _applied_migrations(app_label)
        if later_name in applied and missing_name not in applied:
            call_command('migrate', app_label, missing_name, fake=True, interactive=False)
            repairs.append(f'faked {app_label}.{missing_name}')
    return repairs


def run_migrations() -> dict[str, Any]:
    """Repair history, run migrate, and return a structured result."""
    out = io.StringIO()
    err = io.StringIO()
    repairs: list[str] = []
    success = False
    error_msg = None

    try:
        repairs = repair_migration_history()
        call_command('migrate', interactive=False, stdout=out, stderr=err)
        success = True
    except Exception as exc:
        error_msg = str(exc)

    output = out.getvalue()
    if err.getvalue():
        output = (output + '\n' + err.getvalue()).strip()

    accounts_migrations = sorted(_applied_migrations('accounts'))
    auth_tables = _auth_schema_status()

    return {
        'success': success,
        'repairs': repairs,
        'output': output,
        'error': error_msg,
        'accounts_migrations': accounts_migrations,
        'auth_schema': auth_tables,
    }


def _auth_schema_status() -> dict[str, Any]:
    """Report whether auth-critical tables/columns exist."""
    status: dict[str, Any] = {
        'accounts_user_exists': False,
        'accounts_apitoken_exists': False,
        'user_columns': [],
        'ready': False,
        'error': None,
    }
    try:
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute(
                    "SELECT EXISTS (SELECT FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_name = 'accounts_user')"
                )
                status['accounts_user_exists'] = bool(cursor.fetchone()[0])

                cursor.execute(
                    "SELECT EXISTS (SELECT FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_name = 'accounts_apitoken')"
                )
                status['accounts_apitoken_exists'] = bool(cursor.fetchone()[0])

                if status['accounts_user_exists']:
                    cursor.execute(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = 'public' AND table_name = 'accounts_user' "
                        "ORDER BY ordinal_position"
                    )
                    status['user_columns'] = [row[0] for row in cursor.fetchall()]
            elif connection.vendor == 'sqlite':
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='accounts_user'"
                )
                status['accounts_user_exists'] = cursor.fetchone() is not None
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='accounts_apitoken'"
                )
                status['accounts_apitoken_exists'] = cursor.fetchone() is not None
                if status['accounts_user_exists']:
                    cursor.execute('PRAGMA table_info(accounts_user)')
                    status['user_columns'] = [row[1] for row in cursor.fetchall()]

        required_user_columns = {'email', 'role', 'google_id', 'avatar_url'}
        status['ready'] = (
            status['accounts_user_exists']
            and status['accounts_apitoken_exists']
            and required_user_columns.issubset(set(status['user_columns']))
        )
    except Exception as exc:
        status['error'] = str(exc)
    return status
