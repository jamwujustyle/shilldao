#!/bin/sh
# wait-for-migrations.sh

set -e

echo "Waiting for Django migrations to complete..."
until /venv/bin/python -c "import django; django.setup(); from django.db import connection; cursor = connection.cursor(); cursor.execute('SELECT * FROM django_celery_beat_intervalschedule LIMIT 1');" 2>/dev/null; do
  echo "Waiting for django_celery_beat tables to be created..."
  sleep 5
done

echo "Migrations are complete! Starting Celery service..."
exec "$@"