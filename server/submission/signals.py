from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Submission


@receiver(post_save, sender=Submission)
def update_campaign_progress_on_submission_save(sender, instance, created, **kwargs):
    """
    Updates the campaign progress when a submission is saved.
    """
    if instance.task and instance.task.campaign:

        instance.task.campaign.update_progress()


@receiver(post_save, sender=Submission)
def update_user_tier_on_submission_approval(
    sender, instance, created, update_fields, **kwargs
):
    if not created and instance.status == 2:  # Check if the new status is 'Approved'
        user = instance.user
        if user:
            user.save()
