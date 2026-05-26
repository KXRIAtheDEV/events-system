Render deployment instructions

1) Connect repository in Render dashboard
   - Create a new Web Service -> Connect GitHub repo -> select this repo
   - Set Root/Working Directory: `backend`
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - Start Command: `gunicorn config.wsgi:application --chdir backend --bind 0.0.0.0:$PORT`

2) Environment variables (set in Render -> Service -> Environment):
   - `DJANGO_SECRET_KEY` : a secure random value
   - `DJANGO_DEBUG` : `False`
   - `DATABASE_URL` : Postgres connection string provisioned by Render Postgres
   - `ALLOWED_HOSTS` : comma-separated domains (e.g. `example.com,api.example.com`)

3) Database
   - Create a Render Postgres managed database and copy the `DATABASE_URL` into service env.

4) Post-deploy commands (run in Render shell or via deploy hooks):
   - `python manage.py migrate`
   - `python manage.py createsuperuser` (or create via admin UI)

5) Notes
   - Ensure the repository `backend/requirements.txt` includes `psycopg2-binary`, `dj-database-url`, `gunicorn`, and `whitenoise` (already added).
   - Locally on Linux, installing `psycopg2-binary` may require system packages (e.g. `libpq-dev`, `build-essential`).
