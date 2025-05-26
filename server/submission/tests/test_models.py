from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal

from submission.models import Submission, validate_image_size, validate_video_size
from task.models import Task
from campaign.models import Campaign
from dao.models import DAO
from core.models import User
from django.core.files.uploadedfile import SimpleUploadedFile  # For image/video tests


# Mock file for size validation tests
class MockUploadedFile:
    def __init__(self, name, size):
        self.name = name
        self.size = size


class SubmissionModelTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="submission_us", eth_address="0xSubUser1"
        )
        cls.dao = DAO.objects.create(name="Sub DAO")
        cls.campaign = Campaign.objects.create(
            name="Sub Camp", description="C", budget=100, dao=cls.dao
        )
        cls.task = Task.objects.create(
            campaign=cls.campaign, description="Sub Task", type=1, reward=10, quantity=1
        )

    def test_submission_creation_minimal_with_link_and_text_proof(self):
        submission = Submission.objects.create(
            task=self.task,
            user=self.user,
            link="http://example.com/submission",
            proof_text="This is my text proof.",
        )
        self.assertEqual(submission.task, self.task)
        self.assertEqual(submission.user, self.user)
        self.assertEqual(submission.link, "http://example.com/submission")
        self.assertEqual(submission.proof_text, "This is my text proof.")
        self.assertEqual(submission.status, 1)  # Default Pending
        self.assertIsNotNone(submission.created_at)
        self.assertEqual(
            str(submission),
            f"Submission for Task {self.task.id} at {submission.created_at}",
        )

    def test_submission_clean_method_no_proof(self):
        submission = Submission(
            task=self.task, user=self.user, link="http://example.com/no_proof"
        )
        with self.assertRaisesRegex(
            ValidationError, "At least one proof field is required"
        ):
            submission.clean()

    def test_submission_clean_method_with_image_proof(self):
        # Using SimpleUploadedFile for a valid image field assignment
        image = SimpleUploadedFile(
            "test_image.png", b"file_content", content_type="image/png"
        )
        submission = Submission(
            task=self.task,
            user=self.user,
            link="http://example.com/image_proof",
            proof_image=image,
        )
        try:
            submission.clean()  # Should not raise ValidationError
        except ValidationError:
            self.fail("clean() raised ValidationError unexpectedly for image proof.")

    def test_validate_image_size_valid(self):
        # 1MB = 1 * 1024 * 1024 bytes
        valid_file = MockUploadedFile("valid.jpg", 1 * 1024 * 1024)
        try:
            validate_image_size(valid_file)
        except ValidationError:
            self.fail("validate_image_size raised ValidationError for valid size.")

    def test_validate_image_size_invalid(self):
        invalid_file = MockUploadedFile("invalid.jpg", 2 * 1024 * 1024 + 1)
        with self.assertRaisesRegex(
            ValidationError, "File size can't be greater than 2 MB"
        ):
            validate_image_size(invalid_file)

    def test_validate_video_size_valid(self):
        # 10MB = 10 * 1024 * 1024 bytes
        valid_file = MockUploadedFile("valid.mp4", 10 * 1024 * 1024)
        try:
            validate_video_size(valid_file)
        except ValidationError:
            self.fail("validate_video_size raised ValidationError for valid size.")

    def test_validate_video_size_invalid(self):
        invalid_file = MockUploadedFile("invalid.mp4", 50 * 1024 * 1024 + 1)
        with self.assertRaisesRegex(
            ValidationError, "File size can't be greater than 50 MB"
        ):
            validate_video_size(invalid_file)

    # Signal tests for update_campaign_progress_on_submission_save
    def test_signal_campaign_progress_on_new_approved_submission(self):
        self.campaign.progress = Decimal("0.0")  # Ensure clean start
        self.campaign.save()

        Submission.objects.create(
            task=self.task,
            user=self.user,
            link="http://approved.com",
            status=2,  # Approved
        )
        # Signal should call campaign.update_progress()
        # Task quantity is 1, 1 approved submission. Progress = (1/1)*100 = 100.0
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.progress, Decimal("100.0"))

    def test_signal_campaign_progress_on_new_pending_submission(self):
        self.campaign.progress = Decimal("0.0")
        self.campaign.save()

        Submission.objects.create(
            task=self.task,
            user=self.user,
            link="http://pending.com",
            status=1,  # Pending
        )
        # Signal calls update_progress. 0 approved submissions. Progress = (0/1)*100 = 0.0
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.progress, Decimal("0.0"))

    def test_signal_campaign_progress_on_submission_status_change_to_approved(self):
        submission = Submission.objects.create(
            task=self.task,
            user=self.user,
            link="http://change.com",
            status=1,  # Initially Pending
        )
        self.campaign.update_progress()  # Progress = 0.0
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.progress, Decimal("0.0"))

        submission.status = 2  # Change to Approved
        submission.save()  # Signal should fire and update progress

        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.progress, Decimal("100.0"))

    def test_signal_campaign_progress_on_submission_status_change_from_approved_to_pending(
        self,
    ):
        submission = Submission.objects.create(
            task=self.task,
            user=self.user,
            link="http://changeback.com",
            status=2,  # Initially Approved
        )
        self.campaign.update_progress()  # Progress = 100.0
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.progress, Decimal("100.0"))

        submission.status = 1  # Change to Pending
        submission.save()  # Signal should fire and update progress

        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.progress, Decimal("0.0"))  # 0 approved

    def test_signal_campaign_progress_no_status_change(self):
        submission = Submission.objects.create(
            task=self.task,
            user=self.user,
            link="http://nochange.com",
            status=2,  # Approved
        )
        self.campaign.update_progress()  # Progress = 100.0
        initial_progress = self.campaign.progress

        # To properly test this, we'd ideally mock campaign.update_progress and assert it wasn't called.
        # For now, we'll check if progress value remains the same, assuming no other changes.
        submission.feedback = "Great work!"  # Update a non-status field
        submission.save()

        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.progress, initial_progress)  # Should not change
