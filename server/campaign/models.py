import logging
from django.db import models

logger = logging.getLogger(__name__)


class Campaign(models.Model):
    STATUS_CHOICES = [
        (1, "Active"),
        (2, "Planning"),
        (3, "Completed"),
        (4, "On Hold"),
    ]

    name = models.CharField(max_length=25)
    description = models.TextField()
    progress = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    # TODO: CHANGE TO DECIMAL FIELD
    budget = models.DecimalField(max_digits=32, decimal_places=2)
    status = models.PositiveSmallIntegerField(
        choices=STATUS_CHOICES, default=1, db_index=True
    )
    dao = models.ForeignKey(
        "dao.DAO",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="campaigns",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"{self.name}"  # Changed from self.dao_name to self.name

    def update_progress(self):
        logger.info(f"Updating progress for Campaign ID: {self.id}, Name: {self.name}")
        total_tasks_quantity = 0
        completed_tasks_quantity = 0

        for task in self.tasks.all():
            total_tasks_quantity += task.quantity
            # Assuming Submission model has a status field where 2 means 'Approved'
            approved_submissions_count = task.submissions.filter(status=2).count()
            completed_tasks_quantity += min(approved_submissions_count, task.quantity)

        if total_tasks_quantity > 0:
            progress = (completed_tasks_quantity / total_tasks_quantity) * 100
            self.progress = round(progress, 1)
        else:
            self.progress = 0

        logger.info(
            f"Campaign ID: {self.id} - Calculated Progress: {self.progress}, Current Status: {self.status}"
        )

        if (
            self.progress == 100 and self.status != 3
        ):  # Only change if not already completed
            self.status = 3  # Set status to 'Completed'
            logger.info(f"Campaign ID: {self.id} - Status changed to Completed (3)")

        self.save(update_fields=["progress", "status"])
        logger.info(
            f"Campaign ID: {self.id} - Saved. New Progress: {self.progress}, New Status: {self.status}"
        )
