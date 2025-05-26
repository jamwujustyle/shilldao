from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import FileExtensionValidator
from django.db.models import Sum


class UserManager(BaseUserManager):
    def create_user(
        self,
        username: str = None,
        eth_address: str = None,
        password: str = None,
        **extra_fields
    ) -> "User":
        # Validate that either username or eth_address is provided
        if not eth_address and not username:
            raise ValueError("Either username or eth_address must be provided")

        extra_fields.setdefault("is_active", True)

        user = self.model(username=username, eth_address=eth_address, **extra_fields)

        # Explicitly handle password
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()  # This will set a value that can't be verified

        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        username: str = None,
        password: str = None,
        eth_address: str = None,
        **extra_fields
    ) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(
            username=username,
            eth_address=eth_address,
            password=password,
            **extra_fields
        )


class User(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = [
        (1, "User"),
        (2, "Moderator"),
    ]
    TIER_CHOICES = [
        (1, "Bronze"),
        (2, "Silver"),
        (3, "Gold"),
        (4, "Platinum"),
        (5, "Diamond"),
    ]

    username = models.CharField(max_length=13, unique=True, blank=True, null=True)
    eth_address = models.CharField(max_length=42, unique=True)  # ! add validator
    image = models.ImageField(
        upload_to="profile_pics",  # Corrected path relative to MEDIA_ROOT
        blank=True,
        null=True,
        validators=[FileExtensionValidator(["jpeg", "jpg", "png"])],
    )

    is_superuser = models.BooleanField(default=False)  # Add is_superuser field
    is_staff = models.BooleanField(default=False)  # Add is_staff field
    is_active = models.BooleanField(default=True)
    joined_date = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    role = models.IntegerField(choices=ROLE_CHOICES, default=1)
    tier = models.PositiveSmallIntegerField(choices=TIER_CHOICES, default=1)
    favorite_daos = models.ManyToManyField(
        "dao.DAO", related_name="favorited_by_users", blank=True
    )

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def save(self, *args, **kwargs):
        if self.username:
            self.username = self.username.lower()
        # Calculate tier only if the instance is already saved (has a pk)
        # or if it's being updated. For new instances, tier will be default.
        if self.pk:  # Only calculate for existing users being updated
            self.tier = self.determine_actual_tier_id()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.username if self.username else self.eth_address

    def determine_actual_tier_id(self) -> int:
        """Determines the user's current tier ID based on submissions."""
        try:
            # Use .all() to ensure the QuerySet is evaluated if submissions is a reverse manager
            submissions_qs = self.submissions.all()
            approved_submissions_count = sum(
                1 for s in submissions_qs if s.status == 2
            )  # Approved status is 2
            total_submissions_count = len(submissions_qs)
        except AttributeError:
            # This might happen if 'submissions' related_name is not set up or accessible
            # Or if self is a new instance not yet saved (though self.pk check should prevent this)
            return 1  # Default to Bronze

        if total_submissions_count == 0:
            return 1  # Bronze if no submissions

        approval_rate = approved_submissions_count / total_submissions_count

        # Tier logic (ID mapping: 1:Bronze, 2:Silver, 3:Gold, 4:Platinum, 5:Diamond)
        if approved_submissions_count >= 100 and approval_rate >= 0.90:
            return 5  # Diamond
        elif approved_submissions_count >= 70 and approval_rate >= 0.85:
            return 4  # Platinum
        elif approved_submissions_count >= 40 and approval_rate >= 0.75:
            return 3  # Gold
        elif approved_submissions_count >= 20 and approval_rate >= 0.60:
            return 2  # Silver
        else:
            return 1  # Bronze

    def get_progress_to_next_tier_percentage(self) -> int:
        """Calculates percentage progress toward the next tier."""
        try:
            submissions_qs = self.submissions.all()
            approved = sum(1 for s in submissions_qs if s.status == 2)
            total = len(submissions_qs)
        except AttributeError:
            return 0  # Default to 0% progress if submissions cannot be accessed

        current_tier_id = (
            self.tier
        )  # Assumes self.tier is already correctly set by determine_actual_tier_id()

        if current_tier_id == 5:  # Diamond
            return 100  # Already at max tier

        # Define thresholds for next tier
        # (approved_req_next, rate_req_next, approved_req_current_for_calc, rate_req_current_for_calc)
        # The _for_calc values are the denominators for percentage calculation
        tier_thresholds = {
            1: (
                20,
                0.60,
                20,
                0.60,
            ),  # Bronze aiming for Silver (current is Bronze, calc based on Silver req)
            2: (40, 0.75, 40, 0.75),  # Silver aiming for Gold
            3: (70, 0.85, 70, 0.85),  # Gold aiming for Platinum
            4: (100, 0.90, 100, 0.90),  # Platinum aiming for Diamond
        }

        if (
            total == 0
        ):  # No submissions yet, progress is towards the first actual tier (Silver)
            if current_tier_id == 1:  # Bronze
                # Denominators for Silver
                approved_req_calc = tier_thresholds[1][2]
                rate_req_calc = tier_thresholds[1][3]
                approved_progress = (
                    min(100, (approved / approved_req_calc) * 100)
                    if approved_req_calc > 0
                    else 0
                )
                # rate_progress is 0 because approval_rate is undefined or 0
                return int(
                    approved_progress
                )  # Only approved count matters if no submissions yet for rate
            return 0  # Should not happen if tier is > 1 and total is 0, but defensive

        approval_rate = approved / total

        next_tier_criteria = tier_thresholds.get(current_tier_id)
        if (
            not next_tier_criteria
        ):  # Should not happen if current_tier_id is valid (1-4)
            return 0

        _, _, approved_req_calc, rate_req_calc = next_tier_criteria

        approved_progress = (
            min(100, (approved / approved_req_calc) * 100)
            if approved_req_calc > 0
            else 0
        )
        rate_progress = (
            min(100, (approval_rate / rate_req_calc) * 100) if rate_req_calc > 0 else 0
        )

        # Progress is the minimum of the two criteria unless one is already met for next tier
        # This logic might need refinement based on how "progress" should feel.
        # If user meets approved count for next tier but not rate, progress might be based on rate.
        # For simplicity, let's take the lower of the two progresses towards the *next tier's requirements*.
        return int(min(approved_progress, rate_progress))

    def get_total_rewards(self) -> float:
        """Calculates the total rewards earned by the user."""
        total_rewards_aggregate = self.rewards.aggregate(total=Sum("reward"))
        return (
            total_rewards_aggregate["total"]
            if total_rewards_aggregate["total"] is not None
            else 0.0
        )
