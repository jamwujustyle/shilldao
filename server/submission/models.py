from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError


def validate_image_size(value):
    max_size = 2 * 1024 * 1024
    if value.size > max_size:
        raise ValidationError("File size can't be greater than 2 MB")


def validate_video_size(value):
    max_size = 50 * 1024 * 1024
    if value.size > max_size:
        raise ValidationError("File size can't be greater than 50 MB")


class Submission(models.Model):
    TYPE_CHOICES = [(1, "Text"), (2, "Image"), (3, "Video")]
    STATUS_CHOICES = [(1, "Pending"), (2, "Approved"), (3, "Rejected")]
    MULTIPLIER_CHOICES = [(i, f"x{i}") for i in range(1, 6)]

    # FKs
    task = models.ForeignKey(
        "task.Task", on_delete=models.SET_NULL, related_name="submissions", null=True
    )
    user = models.ForeignKey(
        "core.User", on_delete=models.SET_NULL, related_name="submissions", null=True
    )
    # submission fields
    link = models.URLField(blank=False, db_index=True)
    proof_text = models.TextField(blank=True, null=True)
    proof_image = models.ImageField(
        upload_to="proof_images/",
        validators=[
            FileExtensionValidator(["jpg", "jpeg", "png"]),
            validate_image_size,
        ],
        blank=True,
        null=True,
    )
    proof_video = models.FileField(
        upload_to="proof_videos/",
        validators=[FileExtensionValidator(["mp4", "avi", "mov"]), validate_video_size],
        blank=True,
        null=True,
    )
    proof_type = models.PositiveSmallIntegerField(
        choices=TYPE_CHOICES, null=True, blank=True
    )
    # MODERATOR FIELDS
    status = models.PositiveSmallIntegerField(
        choices=STATUS_CHOICES, default=1, db_index=True
    )
    # multiplier = models.PositiveSmallIntegerField(
    # choices=MULTIPLIER_CHOICES, null=True, blank=True
    # )
    feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if not any([self.proof_text, self.proof_image, self.proof_video]):
            raise ValidationError("At least one proof field is required")

    def __str__(self):
        return f"Submission for Task {self.task.id} at {self.created_at}"
