from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Task


@receiver(post_save, sender=Task)
def update_campaign_progress_on_task_save(sender, instance, **kwargs):
    """
    Updates the campaign progress when a task is saved (created or updated).
    """
    if instance.campaign:
        instance.campaign.update_progress()


@receiver(post_delete, sender=Task)
def update_campaign_progress_on_task_delete(sender, instance, **kwargs):
    """
    Updates the campaign progress when a task is deleted.
    """
    if instance.campaign:
        instance.campaign.update_progress()
