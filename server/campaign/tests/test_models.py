from django.test import TestCase
from decimal import Decimal
from django.utils import timezone

from campaign.models import Campaign
from dao.models import DAO
from task.models import Task
from submission.models import Submission
from core.models import User


class CampaignModelTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.dao = DAO.objects.create(name="Test DAO")
        cls.user = User.objects.create_user(
            eth_address="0x1234567890123456789012345678901234567890",
            username="camptestuser",
        )  # User for submissions

    def test_campaign_creation_minimal(self):
        campaign = Campaign.objects.create(
            name="Minimal Campaign",
            description="Minimal campaign description.",
            budget=Decimal("5000.00"),  # Use Decimal
        )
        self.assertEqual(campaign.name, "Minimal Campaign")
        self.assertEqual(campaign.description, "Minimal campaign description.")
        self.assertEqual(campaign.budget, Decimal("5000.00"))  # Compare with Decimal
        self.assertEqual(campaign.status, 1)  # Default status 'Active'
        self.assertIsNone(campaign.dao)
        self.assertEqual(campaign.progress, Decimal("0.0"))  # Check for default 0.0
        self.assertIsNotNone(campaign.created_at)
        self.assertEqual(str(campaign), "Minimal Campaign")

    def test_campaign_creation_full(self):
        now = timezone.now()
        campaign = Campaign.objects.create(
            name="Full Campaign",
            description="Full campaign description.",
            progress=Decimal("25.5"),
            budget=Decimal("10000.00"),  # Use Decimal
            status=2,  # Planning
            dao=self.dao,
        )
        self.assertEqual(campaign.name, "Full Campaign")
        self.assertEqual(campaign.description, "Full campaign description.")
        self.assertEqual(campaign.progress, Decimal("25.5"))
        self.assertEqual(campaign.budget, Decimal("10000.00"))  # Compare with Decimal
        self.assertEqual(campaign.status, 2)
        self.assertEqual(campaign.dao, self.dao)
        self.assertTrue(campaign.created_at >= now)  # Check it's set
        self.assertEqual(str(campaign), "Full Campaign")

    def test_update_progress_no_tasks(self):
        campaign = Campaign.objects.create(
            name="No Tasks Campaign",
            description="Desc",
            budget=Decimal("100.00"),
            dao=self.dao,
        )  # Use Decimal
        campaign.update_progress()
        campaign.refresh_from_db()
        self.assertEqual(campaign.progress, Decimal("0.0"))

    def test_update_progress_tasks_no_submissions(self):
        campaign = Campaign.objects.create(
            name="Tasks No Subs",
            description="D",
            budget=Decimal("100.00"),
            dao=self.dao,
        )  # Use Decimal
        Task.objects.create(
            campaign=campaign, description="T1", type=1, reward=10, quantity=5
        )
        Task.objects.create(
            campaign=campaign, description="T2", type=1, reward=10, quantity=3
        )

        campaign.update_progress()
        campaign.refresh_from_db()
        self.assertEqual(campaign.progress, Decimal("0.0"))

    def test_update_progress_partial_completion(self):
        campaign = Campaign.objects.create(
            name="Partial Comp",
            description="D",
            budget=Decimal("100.00"),
            dao=self.dao,
        )  # Use Decimal
        task1 = Task.objects.create(
            campaign=campaign, description="T1", type=1, reward=10, quantity=5
        )
        task2 = Task.objects.create(
            campaign=campaign, description="T2", type=1, reward=10, quantity=2
        )

        # Submissions for task1 (2 approved out of 5 quantity)
        Submission.objects.create(
            task=task1, user=self.user, link="http://example.com/s1t1", status=2
        )  # Approved
        Submission.objects.create(
            task=task1, user=self.user, link="http://example.com/s2t1", status=2
        )  # Approved
        Submission.objects.create(
            task=task1, user=self.user, link="http://example.com/s3t1", status=1
        )  # Pending

        # Submissions for task2 (1 approved out of 2 quantity)
        Submission.objects.create(
            task=task2, user=self.user, link="http://example.com/s1t2", status=2
        )  # Approved
        Submission.objects.create(
            task=task2, user=self.user, link="http://example.com/s2t2", status=3
        )  # Rejected

        campaign.update_progress()
        campaign.refresh_from_db()
        # Expected: (2 approved for task1 + 1 approved for task2) / (5 quantity task1 + 2 quantity task2) * 100
        # (2+1) / (5+2) = 3 / 7 = 0.42857... * 100 = 42.857...
        # Rounded to 1 decimal place: 42.9
        self.assertEqual(campaign.progress, Decimal("42.9"))

    def test_update_progress_full_completion(self):
        campaign = Campaign.objects.create(
            name="Full Comp",
            description="D",
            budget=Decimal("100.00"),
            dao=self.dao,
        )  # Use Decimal
        task1 = Task.objects.create(
            campaign=campaign, description="T1", type=1, reward=10, quantity=3
        )
        task2 = Task.objects.create(
            campaign=campaign, description="T2", type=1, reward=10, quantity=1
        )

        for _ in range(3):
            Submission.objects.create(
                task=task1, user=self.user, link="http://example.com/s_t1", status=2
            )  # Approved
        Submission.objects.create(
            task=task2, user=self.user, link="http://example.com/s_t2", status=2
        )  # Approved

        campaign.update_progress()
        campaign.refresh_from_db()
        self.assertEqual(campaign.progress, Decimal("100.0"))

    def test_update_progress_over_submission_capped_at_quantity(self):
        campaign = Campaign.objects.create(
            name="Over Sub",
            description="D",
            budget=Decimal("100.00"),
            dao=self.dao,
        )  # Use Decimal
        task1 = Task.objects.create(
            campaign=campaign, description="T1", type=1, reward=10, quantity=2
        )  # Quantity 2

        # 5 approved submissions, but task quantity is 2
        for _ in range(5):
            Submission.objects.create(
                task=task1,
                user=self.user,
                link="http://example.com/s_t1_over",
                status=2,
            )

        campaign.update_progress()
        campaign.refresh_from_db()
        # Expected: (min(5,2) / 2) * 100 = (2/2)*100 = 100.0
        self.assertEqual(campaign.progress, Decimal("100.0"))

    def test_update_progress_mixed_completion_multiple_tasks(self):
        campaign = Campaign.objects.create(
            name="Mixed Comp",
            description="D",
            budget=Decimal("100.00"),
            dao=self.dao,
        )  # Use Decimal
        task1 = Task.objects.create(
            campaign=campaign, description="T1", type=1, reward=10, quantity=4
        )  # Target 4
        task2 = Task.objects.create(
            campaign=campaign, description="T2", type=1, reward=20, quantity=2
        )  # Target 2
        task3 = Task.objects.create(
            campaign=campaign, description="T3", type=1, reward=5, quantity=3
        )  # Target 3 (no approved subs)

        # Task 1: 3 approved out of 4
        for i in range(3):
            Submission.objects.create(
                task=task1, user=self.user, link=f"http://example.com/t1s{i}", status=2
            )

        # Task 2: 2 approved out of 2 (fully complete)
        for i in range(2):
            Submission.objects.create(
                task=task2, user=self.user, link=f"http://example.com/t2s{i}", status=2
            )

        # Task 3: 1 pending, 1 rejected (0 approved)
        Submission.objects.create(
            task=task3, user=self.user, link="http://example.com/t3s_pending", status=1
        )
        Submission.objects.create(
            task=task3, user=self.user, link="http://example.com/t3s_rejected", status=3
        )

        campaign.update_progress()
        campaign.refresh_from_db()
        # Completed tasks quantity:
        # Task 1: min(3 approved, 4 quantity) = 3
        # Task 2: min(2 approved, 2 quantity) = 2
        # Task 3: min(0 approved, 3 quantity) = 0
        # Total completed = 3 + 2 + 0 = 5
        # Total quantity = 4 + 2 + 3 = 9
        # Progress = (5 / 9) * 100 = 55.555...
        # Rounded to 1 decimal place: 55.6
        self.assertEqual(campaign.progress, Decimal("55.6"))

    # Add a test to check the field type after the model change
    # def test_budget_field_is_decimal(self):
    #     # This test assumes the budget field in Campaign model has been changed to DecimalField
    #     campaign = Campaign.objects.create(
    #         name="Field Type Test",
    #         description="Desc",
    #         budget=Decimal("12345.67"),
    #         dao=self.dao,
    #     )
    #     field = Campaign._meta.get_field("budget")
    #     self.assertIsInstance(field, models.DecimalField)
    #     self.assertEqual(
    #         field.max_digits, 40
    #     )  # Assuming max_digits based on DAO balance
    #     self.assertEqual(
    #         field.decimal_places, 18
    #     )  # Assuming decimal_places based on DAO balance
    #     self.assertEqual(campaign.budget, Decimal("12345.67"))
