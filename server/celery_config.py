import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "app.settings")

# Create the Celery application
app = Celery("app")

# Load settings from Django settings using the namespace 'CELERY'
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()


# Optional: Add some debugging information
@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
