# Django starts so that shared_task will use this app.
from celery_config import app as celery_app

__all__ = ("celery_app",)
