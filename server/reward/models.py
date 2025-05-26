from django.db import models


class Reward(models.Model):
    reward = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    user = models.ForeignKey(
        "core.User", on_delete=models.SET_NULL, related_name="rewards", null=True
    )

    # !: QUESTION MARK
    is_paid = models.BooleanField(null=True, default=False)
    # !: QUESTION MARK

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    submission = models.ForeignKey(
        "submission.Submission",
        on_delete=models.SET_NULL,
        related_name="rewards",
        null=True,
    )

    def __str__(self):
        user_str = self.user.username if self.user else "None"
        return f"Reward of {self.reward} for {user_str}"

    class Meta:
        indexes = [
            models.Index(
                fields=["created_at", "reward"],
            )
        ]
