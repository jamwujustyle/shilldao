from django.db import models


class Task(models.Model):
    TASK_TYPES = [
        (1, "Discussion"),
        (2, "Video"),
        (3, "Publication"),
        (4, "Social Post"),
        (5, "Tutorial"),
    ]
    STATUS_CHOICES = [(1, "Ongoing"), (2, "Completed")]
    description = models.TextField()
    campaign = models.ForeignKey(
        "campaign.Campaign", on_delete=models.CASCADE, related_name="tasks"
    )
    type = models.PositiveSmallIntegerField(
        choices=TASK_TYPES, default=TASK_TYPES[0][0], db_index=True
    )
    reward = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    quantity = models.PositiveSmallIntegerField()

    deadline = models.DateField(null=True, blank=True)
    status = models.PositiveSmallIntegerField(
        choices=STATUS_CHOICES, default=1, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
