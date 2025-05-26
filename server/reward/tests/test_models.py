from django.test import TestCase
from decimal import Decimal

from reward.models import Reward
from core.models import User
from submission.models import Submission  # Import Submission model


class RewardModelTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="reward_user", eth_address="0xRewardUser123"
        )
        # Create a dummy submission for testing the foreign key
        cls.submission = Submission.objects.create(
            user=cls.user,  # Assuming Submission requires a user
            # Add other required fields for Submission if any
        )

    def test_reward_creation(self):
        reward_amount = Decimal("123.45")
        # Use timezone.now() for created_at as it's a DateTimeField with auto_now_add=True
        reward = Reward.objects.create(
            user=self.user, reward=reward_amount, submission=self.submission
        )

        self.assertEqual(reward.user, self.user)
        self.assertEqual(reward.reward, reward_amount)
        self.assertIsNotNone(reward.created_at)  # Check if created_at is set
        self.assertFalse(reward.is_paid)  # Check default value of is_paid
        self.assertEqual(
            reward.submission, self.submission
        )  # Check submission foreign key
        self.assertEqual(
            str(reward), f"Reward of {reward_amount} for {self.user.username}"
        )

    def test_reward_str_method_with_no_user(self):
        reward_amount = Decimal("50.00")
        reward_no_user = Reward.objects.create(
            user=None, reward=reward_amount, submission=self.submission
        )
        self.assertEqual(str(reward_no_user), f"Reward of {reward_amount} for None")

    def test_reward_is_paid_default(self):
        reward = Reward.objects.create(
            user=self.user, reward=Decimal("75.00"), submission=self.submission
        )
        self.assertFalse(reward.is_paid)

    def test_reward_submission_relation(self):
        reward = Reward.objects.create(
            user=self.user, reward=Decimal("99.99"), submission=self.submission
        )
        self.assertEqual(reward.submission, self.submission)
        self.assertIn(reward, self.submission.rewards.all())  # Check related_name
