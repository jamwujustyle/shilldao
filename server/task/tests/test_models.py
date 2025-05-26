from django.test import TestCase
from decimal import Decimal
from django.utils import timezone

from task.models import Task
from campaign.models import Campaign
from dao.models import DAO
from submission.models import Submission  # For signal testing context
from core.models import User  # For Submission.user


class TaskModelTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.dao = DAO.objects.create(name="Test DAO for Task")  # Shortened token
        cls.campaign = Campaign.objects.create(
            name="Test Campaign for Task",
            description="A campaign to hold tasks.",
            budget=1000,
            dao=cls.dao,
        )
        cls.user_for_submission = User.objects.create_user(
            eth_address="0xTaskUser123456789012345678901234567890",
            username="task_test",
        )

    def test_task_creation_minimal(self):
        task = Task.objects.create(
            campaign=self.campaign,
            description="Minimal task description.",
            type=1,  # Discussion
            reward=Decimal("5.00"),
            quantity=10,
        )
        self.assertEqual(task.campaign, self.campaign)
        self.assertEqual(task.description, "Minimal task description.")
        self.assertEqual(task.type, 1)
        self.assertEqual(task.reward, Decimal("5.00"))
        self.assertEqual(task.quantity, 10)
        self.assertEqual(task.status, 1)  # Default status 'Ongoing'
        self.assertIsNone(task.deadline)
        self.assertIsNotNone(task.created_at)
        # Consider adding a __str__ method to Task model for better representation
        # self.assertEqual(str(task), "Minimal task description.")

    def test_task_creation_full(self):
        deadline_time = timezone.now() + timezone.timedelta(days=7)
        task = Task.objects.create(
            campaign=self.campaign,
            description="Full task description.",
            type=2,  # Video
            reward=Decimal("100.00"),
            quantity=1,
            deadline=deadline_time,
            status=1,  # Ongoing
        )
        self.assertEqual(task.description, "Full task description.")
        self.assertEqual(task.type, 2)
        self.assertEqual(task.reward, Decimal("100.00"))
        self.assertEqual(task.quantity, 1)
        self.assertEqual(task.deadline, deadline_time)
        self.assertEqual(task.status, 1)

    # Signal tests: Test the effect of campaign.update_progress() being called
    # These tests indirectly verify the signals are connected and call update_progress.
    # The direct logic of update_progress is tested in campaign.tests.test_models.

    def test_signal_update_campaign_progress_on_task_create(self):
        # Initial campaign progress should be 0 or based on other tasks if any
        self.campaign.update_progress()  # Ensure it's current before adding new task

        # Create a new task that should affect progress if submissions were made
        # For this signal test, we're more focused on update_progress being called.
        # A simple way to see an effect is if the task itself contributes to total_tasks_quantity
        # which would make progress 0 if no completed_tasks_quantity.

        # Let's set up a scenario where adding a task changes the denominator
        # and thus potentially the progress if there were any completed tasks.
        # For simplicity, assume campaign starts at 0 progress.
        self.campaign.progress = Decimal("0.0")  # Reset for clarity
        self.campaign.save()

        Task.objects.create(
            campaign=self.campaign,
            description="Signal Test Task Create",
            type=1,
            reward=10,
            quantity=10,
        )
        # After task creation, campaign.update_progress() is called by the signal.
        # If there are no submissions for any tasks in this campaign, progress remains 0.
        self.campaign.refresh_from_db()
        self.assertEqual(
            self.campaign.progress, Decimal("0.0")
        )  # Still 0 as no submissions

        # To make this test more meaningful for progress change:
        # 1. Create another task with some approved submissions first.
        campaign2 = Campaign.objects.create(
            name="Signal Test Camp 2", description="D", budget=100, dao=self.dao
        )
        task_existing = Task.objects.create(
            campaign=campaign2, description="T Existing", type=1, reward=10, quantity=2
        )
        Submission.objects.create(
            task=task_existing, user=self.user_for_submission, link="l.com", status=2
        )  # 1 approved

        campaign2.update_progress()  # Progress is (1/2)*100 = 50.0
        self.assertEqual(campaign2.progress, Decimal("50.0"))

        # 2. Now add a new task to campaign2. Progress should be re-calculated.
        Task.objects.create(
            campaign=campaign2, description="T New", type=1, reward=10, quantity=3
        )
        # New total quantity = 2 + 3 = 5. Completed = 1. Progress = (1/5)*100 = 20.0
        campaign2.refresh_from_db()
        self.assertEqual(campaign2.progress, Decimal("20.0"))

    def test_signal_update_campaign_progress_on_task_delete(self):
        campaign = Campaign.objects.create(
            name="Signal Test Camp Delete", description="D", budget=100, dao=self.dao
        )
        task1 = Task.objects.create(
            campaign=campaign, description="T1 Del", type=1, reward=10, quantity=2
        )
        task2 = Task.objects.create(
            campaign=campaign, description="T2 Del", type=1, reward=10, quantity=3
        )

        Submission.objects.create(
            task=task1, user=self.user_for_submission, link="l.com/t1d", status=2
        )  # 1 approved for task1

        campaign.update_progress()  # Initial progress: (1 approved / (2+3) total quantity) * 100 = (1/5)*100 = 20.0
        self.assertEqual(campaign.progress, Decimal("20.0"))

        task2.delete()  # Deleting task2, which had quantity 3 and 0 approved submissions.
        # campaign.update_progress() is called by the signal.
        # New total quantity = 2 (from task1). Completed = 1 (from task1).
        # Progress = (1/2)*100 = 50.0
        campaign.refresh_from_db()
        self.assertEqual(campaign.progress, Decimal("50.0"))

    def test_signal_update_campaign_progress_on_task_save_update(self):
        # This signal also fires on task update (save).
        # The current Campaign.update_progress logic depends on task quantities and submissions.
        # Changing a task's own fields (like description) and saving it will trigger
        # campaign.update_progress(), but might not change the progress value if quantities/submissions are unaffected.
        # A change in task.quantity would be more impactful.

        campaign = Campaign.objects.create(
            name="Signal Test Camp Update", description="D", budget=100, dao=self.dao
        )
        task = Task.objects.create(
            campaign=campaign, description="T Upd", type=1, reward=10, quantity=2
        )
        Submission.objects.create(
            task=task, user=self.user_for_submission, link="l.com/upd", status=2
        )  # 1 approved

        campaign.update_progress()  # Initial progress: (1/2)*100 = 50.0
        self.assertEqual(campaign.progress, Decimal("50.0"))

        task.quantity = 4  # Change quantity
        task.save()  # This triggers the post_save signal, calling campaign.update_progress()

        # New total quantity = 4. Completed = 1. Progress = (1/4)*100 = 25.0
        campaign.refresh_from_db()
        self.assertEqual(campaign.progress, Decimal("25.0"))
