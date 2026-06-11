"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os


from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()
app = application

# Run migrations on serverless/managed Postgres (Supabase via DATABASE_URL) with repair.
if os.environ.get('VERCEL') or os.environ.get('DATABASE_URL'):
    try:
        from config.db_migrations import run_migrations
        result = run_migrations()
        if result.get('repairs'):
            print('Vercel migration repairs:', result['repairs'])
        if not result.get('success'):
            print('Vercel startup migration failed:', result.get('error'))
    except Exception as e:
        print('Vercel startup migration failed:', e)


