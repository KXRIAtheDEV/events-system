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

# Run migrations if on Vercel so the /tmp/db.sqlite3 gets initialized
if os.environ.get('VERCEL'):
    try:
        from django.core.management import call_command
        call_command('migrate', interactive=False)
    except Exception as e:
        print("Vercel startup migration failed:", e)


