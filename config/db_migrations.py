"""
Database migration helpers for Supabase/Postgres deployments.

Repairs known inconsistent migration history (e.g. events.0005 applied before
events.0004) so `migrate` can complete and auth tables stay in sync.
"""

from __future__ import annotations

import io
import logging
from typing import Any

from django.core.management import call_command
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder
from django.utils import timezone

logger = logging.getLogger(__name__)

# events.0005 was deployed to production before 0004 existed, leaving a gap.
EVENTS_REPAIR_FAKES = (
    ('events', '0004_eventimage', '0005_alter_event_banner_image_alter_eventimage_image'),
)

AUTH_COLUMN_HOTFIXES = (
    # (column_name, postgres_ddl)
    ('avatar', "ALTER TABLE accounts_user ADD COLUMN IF NOT EXISTS avatar varchar(100)"),
    (
        'avatar_url',
        "ALTER TABLE accounts_user ADD COLUMN IF NOT EXISTS avatar_url varchar(500) "
        "NOT NULL DEFAULT ''",
    ),
)

MPESA_COLUMN_HOTFIXES = (
    ('mpesa_display_name', "ALTER TABLE accounts_user ADD COLUMN IF NOT EXISTS mpesa_display_name varchar(150) NOT NULL DEFAULT ''"),
    ('mpesa_paybill', "ALTER TABLE accounts_user ADD COLUMN IF NOT EXISTS mpesa_paybill varchar(20) NOT NULL DEFAULT ''"),
    ('mpesa_till', "ALTER TABLE accounts_user ADD COLUMN IF NOT EXISTS mpesa_till varchar(20) NOT NULL DEFAULT ''"),
    ('mpesa_pochi', "ALTER TABLE accounts_user ADD COLUMN IF NOT EXISTS mpesa_pochi varchar(20) NOT NULL DEFAULT ''"),
    ('mpesa_send_money', "ALTER TABLE accounts_user ADD COLUMN IF NOT EXISTS mpesa_send_money varchar(20) NOT NULL DEFAULT ''"),
)

PAYMENT_REQUIRED_TABLES = (
    'payments_paymentorder',
    'payments_organizernotification',
    'payments_attendeentification',
)


def _applied_migrations(app_label: str) -> set[str]:
    return set(
        MigrationRecorder.Migration.objects.filter(app=app_label).values_list('name', flat=True)
    )


def _record_migration(app_label: str, name: str) -> bool:
    """Insert a migration row directly (bypasses Django's dependency validator)."""
    recorder = MigrationRecorder(connection)
    if recorder.migration_qs.filter(app=app_label, name=name).exists():
        return False
    recorder.migration_qs.create(app=app_label, name=name, applied=timezone.now())
    return True


def _table_exists(table_name: str) -> bool:
    with connection.cursor() as cursor:
        if connection.vendor == 'postgresql':
            cursor.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = %s)",
                [table_name],
            )
            return bool(cursor.fetchone()[0])
        if connection.vendor == 'sqlite':
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=%s",
                [table_name],
            )
            return cursor.fetchone() is not None
    return False


def repair_migration_history() -> list[str]:
    """Record missing dependency migrations when a later one is already applied."""
    repairs: list[str] = []
    for app_label, missing_name, later_name in EVENTS_REPAIR_FAKES:
        applied = _applied_migrations(app_label)
        if later_name in applied and missing_name not in applied:
            if _record_migration(app_label, missing_name):
                repairs.append(f'recorded {app_label}.{missing_name}')
            else:
                repairs.append(f'skipped {app_label}.{missing_name} (already present)')

    accounts_applied = _applied_migrations('accounts')
    if (
        _table_exists('accounts_apikey')
        and '0006_apikey_teammember_user_accounts_us_role_1fa9a5_idx_and_more' not in accounts_applied
    ):
        if _record_migration('accounts', '0006_apikey_teammember_user_accounts_us_role_1fa9a5_idx_and_more'):
            repairs.append('recorded accounts.0006 (apikey table already existed)')

    user_columns = set(_auth_schema_status().get('user_columns') or [])
    if {'avatar', 'avatar_url'}.issubset(user_columns):
        if '0008_user_avatar_user_avatar_url' not in accounts_applied:
            if _record_migration('accounts', '0008_user_avatar_user_avatar_url'):
                repairs.append('recorded accounts.0008 (avatar columns already existed)')

    mpesa_columns = {'mpesa_display_name', 'mpesa_paybill', 'mpesa_till', 'mpesa_pochi', 'mpesa_send_money'}
    if mpesa_columns.issubset(user_columns):
        if '0009_user_mpesa_fields' not in accounts_applied:
            if _record_migration('accounts', '0009_user_mpesa_fields'):
                repairs.append('recorded accounts.0009 (mpesa columns already existed)')

    payments_applied = _applied_migrations('payments')
    if _table_exists('payments_paymentorder') and '0004_paymentorder_organizernotification_attendeentification' not in payments_applied:
        if _record_migration('payments', '0004_paymentorder_organizernotification_attendeentification'):
            repairs.append('recorded payments.0004 (payment tables already existed)')

    return repairs


def apply_auth_column_hotfixes() -> list[str]:
    """Add auth-critical columns when migration history is still out of sync."""
    if connection.vendor != 'postgresql':
        return []

    applied: list[str] = []
    existing = set(_auth_schema_status().get('user_columns') or [])
    try:
        with connection.cursor() as cursor:
            for column_name, ddl in AUTH_COLUMN_HOTFIXES:
                if column_name not in existing:
                    cursor.execute(ddl)
                    applied.append(f'added accounts_user.{column_name}')
    except Exception:
        logger.exception('Auth column hotfix failed')
        raise
    return applied


def apply_mpesa_column_hotfixes() -> list[str]:
    """Add M-Pesa organizer settings columns when migration history is out of sync."""
    if connection.vendor != 'postgresql':
        return []

    applied: list[str] = []
    existing = set(_auth_schema_status().get('user_columns') or [])
    try:
        with connection.cursor() as cursor:
            for column_name, ddl in MPESA_COLUMN_HOTFIXES:
                if column_name not in existing:
                    cursor.execute(ddl)
                    applied.append(f'added accounts_user.{column_name}')
    except Exception:
        logger.exception('M-Pesa column hotfix failed')
        raise
    return applied


def _payment_schema_status() -> dict[str, Any]:
    status: dict[str, Any] = {
        'tables': {},
        'ready': False,
        'error': None,
    }
    try:
        for table_name in PAYMENT_REQUIRED_TABLES:
            status['tables'][table_name] = _table_exists(table_name)
        status['ready'] = all(status['tables'].values())
    except Exception as exc:
        status['error'] = str(exc)
    return status


def ensure_payment_schema() -> list[str]:
    """Run payments/accounts migrations and hotfixes until checkout tables exist."""
    actions: list[str] = []
    if _payment_schema_status().get('ready'):
        return actions

    out = io.StringIO()
    err = io.StringIO()
    try:
        call_command('migrate', 'accounts', interactive=False, stdout=out, stderr=err)
        actions.append('migrate accounts')
        call_command('migrate', 'payments', interactive=False, stdout=out, stderr=err)
        actions.append('migrate payments')
    except Exception:
        logger.exception('Targeted payments migrate failed')
        raise

    mpesa_hotfixes = apply_mpesa_column_hotfixes()
    actions.extend(mpesa_hotfixes)

    extra_repairs = repair_migration_history()
    actions.extend(extra_repairs)

    if not _payment_schema_status().get('ready'):
        call_command('migrate', interactive=False, stdout=out, stderr=err)
        actions.append('migrate all (payment tables still missing)')

    return actions


def run_migrations() -> dict[str, Any]:
    """Repair history, run migrate, hotfix auth columns, and return a structured result."""
    out = io.StringIO()
    err = io.StringIO()
    repairs: list[str] = []
    hotfixes: list[str] = []
    success = False
    error_msg = None

    payment_actions: list[str] = []
    try:
        repairs = repair_migration_history()
        call_command('migrate', interactive=False, stdout=out, stderr=err)
        hotfixes = apply_auth_column_hotfixes()
        hotfixes.extend(apply_mpesa_column_hotfixes())
        payment_actions = ensure_payment_schema()
        success = _auth_schema_status().get('ready') and _payment_schema_status().get('ready')
        if not success:
            error_msg = 'Schema incomplete after migrate'
    except Exception as exc:
        error_msg = str(exc)
        # Recover from partially-applied migrations (e.g. avatar column added via hotfix).
        extra_repairs = repair_migration_history()
        repairs.extend(extra_repairs)
        try:
            call_command('migrate', interactive=False, stdout=out, stderr=err)
            hotfixes = apply_auth_column_hotfixes()
            hotfixes.extend(apply_mpesa_column_hotfixes())
            payment_actions = ensure_payment_schema()
            success = _auth_schema_status().get('ready') and _payment_schema_status().get('ready')
            error_msg = None if success else 'Schema incomplete after migrate retry'
        except Exception as retry_exc:
            error_msg = str(retry_exc)
            try:
                hotfixes = apply_auth_column_hotfixes()
                hotfixes.extend(apply_mpesa_column_hotfixes())
                payment_actions = ensure_payment_schema()
                success = _auth_schema_status().get('ready') and _payment_schema_status().get('ready')
                if success:
                    error_msg = None
            except Exception as hotfix_exc:
                logger.exception('Schema hotfix after migrate failure also failed')
                error_msg = str(hotfix_exc)

    output = out.getvalue()
    if err.getvalue():
        output = (output + '\n' + err.getvalue()).strip()

    accounts_migrations = sorted(_applied_migrations('accounts'))
    payments_migrations = sorted(_applied_migrations('payments'))
    auth_tables = _auth_schema_status()
    payment_tables = _payment_schema_status()

    return {
        'success': success,
        'repairs': repairs,
        'hotfixes': hotfixes,
        'payment_actions': payment_actions,
        'output': output,
        'error': error_msg,
        'accounts_migrations': accounts_migrations,
        'payments_migrations': payments_migrations,
        'auth_schema': auth_tables,
        'payment_schema': payment_tables,
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
