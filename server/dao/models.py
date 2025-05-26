from django.db import models
from django.core.validators import FileExtensionValidator
from submission.models import validate_image_size


class DAO(models.Model):
    NETWORK_CHOICES = [
        (0, "ethereum"),
        (1, "polygon"),
        (2, "optimism"),
        (3, "arbitrum"),
        (4, "base"),
        (5, "solana"),
        (6, "near"),
    ]
    name = models.CharField(max_length=50, db_index=True)
    image = models.ImageField(
        upload_to="dao_images",  # Corrected path relative to MEDIA_ROOT
        validators=[
            FileExtensionValidator(["jpeg", "jpg", "png"]),
            validate_image_size,
        ],
        null=True,
        blank=True,
    )
    description = models.TextField(blank=True, null=True)  # Added description field
    website = models.URLField(blank=True, null=True)
    create_dao = models.BooleanField(blank=True, null=True)
    network = models.PositiveIntegerField(
        choices=NETWORK_CHOICES, null=True, blank=True
    )  # Changed to PositiveIntegerField
    created_by = models.ForeignKey(
        "core.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="daos_created",
    )
    balance = models.DecimalField(max_digits=40, decimal_places=18, null=True)
    social_links = models.JSONField(blank=True, default=dict)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
