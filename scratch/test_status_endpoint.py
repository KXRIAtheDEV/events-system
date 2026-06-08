import os
import sys
import django
import json

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from events.views import api_db_status, api_run_migrations

rf = RequestFactory()

print("Testing api_db_status view...")
req = rf.get('/api/events/db-status/')
resp = api_db_status(req)
print("Response status code:", resp.status_code)
print("Response content:", json.loads(resp.content.decode('utf-8')))

print("\nTesting api_run_migrations view...")
req_mig = rf.get('/api/events/run-migrations/')
resp_mig = api_run_migrations(req_mig)
print("Response status code:", resp_mig.status_code)
print("Response content:", json.loads(resp_mig.content.decode('utf-8')))
