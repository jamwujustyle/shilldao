from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile

from submission.models import Submission
from submission.serializers import (
    SubmitTaskSerializer,
    SubmissionsHistorySerializer,
    GradeSubmissionSerializer,
    UserSimpleSerializer,
    UserSimpleExtendedSerializer,
)
from task.models import Task
from campaign.models import Campaign
from dao.models import DAO
from core.models import User
from reward.models import Reward


class SubmissionSerializerTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="sub_ser_user", eth_address="0xSubSerUser1", role=1
        )
        cls.moderator = User.objects.create_user(
            username="sub_mod_user", eth_address="0xSubModUser1", role=2
        )
        cls.dao = DAO.objects.create(name="SubSer DAO")
        cls.campaign = Campaign.objects.create(
            name="SubSer Camp", description="C", budget=100, dao=cls.dao
        )

        cls.task_ongoing = Task.objects.create(
            campaign=cls.campaign,
            description="Ongoing Task",
            type=1,
            reward=10,
            quantity=5,
            status=1,
        )
        cls.task_completed = Task.objects.create(
            campaign=cls.campaign,
            description="Completed Task",
            type=1,
            reward=10,
            quantity=2,
            status=2,
        )

        cls.submission_text = Submission.objects.create(
            task=cls.task_ongoing,
            user=cls.user,
            link="http://text.com",
            proof_text="Text proof.",
            proof_type=1,
            status=1,
        )
        cls.submission_image = Submission.objects.create(
            task=cls.task_ongoing,
            user=cls.user,
            link="http://image.com",
            proof_image=SimpleUploadedFile("img.png", b"content", "image/png"),
            proof_type=2,
            status=2,
        )
        cls.submission_video = Submission.objects.create(
            task=cls.task_ongoing,
            user=cls.user,
            link="http://video.com",
            proof_video=SimpleUploadedFile("vid.mp4", b"content_vid", "video/mp4"),
            proof_type=3,
            status=3,
        )

    # --- SubmitTaskSerializer Tests ---
    def test_submit_task_serializer_create_valid(self):
        data = {
            "task": self.task_ongoing.id,
            "link": "http://newsubmit.com",
            "proof_text": "New submission text proof.",
            "proof_type": 1,  # Text
        }
        serializer = SubmitTaskSerializer(
            data=data, context={"request": type("Request", (), {"user": self.user})}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        submission = serializer.save(user=self.user)  # Pass user explicitly as in view
        self.assertEqual(submission.link, "http://newsubmit.com")
        self.assertEqual(submission.user, self.user)
        self.assertEqual(submission.status, 1)  # Default Pending

    def test_submit_task_serializer_create_for_completed_task_fails(self):
        data = {
            "task": self.task_completed.id,  # Task is status 2 (Completed)
            "link": "http://completedtask.com",
            "proof_text": "Trying to submit to completed task.",
            "proof_type": 1,
        }
        serializer = SubmitTaskSerializer(
            data=data, context={"request": type("Request", (), {"user": self.user})}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("task", serializer.errors)  # Error should be on the 'task' field
        self.assertIn(
            "Task is completed, no more submissions allowed.",
            str(serializer.errors["task"]),  # Check message for 'task' field
        )

    def test_submit_task_serializer_missing_all_proof_fields(self):
        data = {
            "task": self.task_ongoing.id,
            "link": "http://newsubmit.com",
            # No proof_text, proof_image, or proof_video
            "proof_type": 1,  # proof_type is provided, but no actual proof content
        }
        serializer = SubmitTaskSerializer(
            data=data, context={"request": type("Request", (), {"user": self.user})}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn(
            "At least one proof field (proof_text, proof_image, or proof_video) is required.",
            str(serializer.errors["non_field_errors"][0]),
        )

    def test_submit_task_serializer_representation_drop_proof(self):
        # Text proof
        serializer_text = SubmitTaskSerializer(instance=self.submission_text)
        data_text = serializer_text.data
        self.assertIn("proof_text", data_text)
        self.assertNotIn("proof_image", data_text)
        self.assertNotIn("proof_video", data_text)
        self.assertEqual(data_text["status"], "Pending")

        # Image proof
        serializer_image = SubmitTaskSerializer(instance=self.submission_image)
        data_image = serializer_image.data
        self.assertNotIn("proof_text", data_image)
        self.assertIn("proof_image", data_image)
        self.assertNotIn("proof_video", data_image)
        self.assertEqual(data_image["status"], "Approved")

    # --- SubmissionsHistorySerializer Tests ---
    def test_submissions_history_serializer_read_only_and_drop_proof(self):
        serializer = SubmissionsHistorySerializer(instance=self.submission_video)
        data = serializer.data
        self.assertEqual(data["status"], "Rejected")  # Display
        self.assertEqual(data["proof_type"], "Video")  # Display
        self.assertNotIn("proof_text", data)
        self.assertNotIn("proof_image", data)
        self.assertIn("proof_video", data)

        # Test read-only nature: is_valid() should be true, but validated_data empty
        # because all fields are read-only in SubmissionsHistorySerializer.
        serializer_write_attempt = SubmissionsHistorySerializer(
            data={"link": "http://newlink.com", "status": 1}
        )
        self.assertTrue(
            serializer_write_attempt.is_valid()
        )  # Passes as read-only fields are ignored
        self.assertEqual(
            serializer_write_attempt.validated_data, {}
        )  # No writable fields to validate

    # --- UserSimpleSerializer & UserSimpleExtendedSerializer Tests ---
    def test_user_simple_serializer(self):
        serializer = UserSimpleSerializer(instance=self.user)
        data = serializer.data
        self.assertEqual(data["username"], self.user.username)
        self.assertEqual(data["tier"], self.user.get_tier_display())
        self.assertIn("image", data)

    def test_user_simple_extended_serializer(self):
        # Mock annotated counts
        self.user.approved_count = 5
        self.user.rejected_count = 2
        serializer = UserSimpleExtendedSerializer(instance=self.user)
        data = serializer.data
        self.assertEqual(data["username"], self.user.username)
        self.assertEqual(data["tier"], self.user.get_tier_display())
        self.assertIn("image", data)
        self.assertEqual(data["approved"], 5)
        self.assertEqual(data["rejected"], 2)
        self.assertEqual(data["eth_address"], self.user.eth_address)

    # --- GradeSubmissionSerializer Tests ---
    def test_grade_submission_serializer_retrieve_representation(self):
        # Mock annotated counts by setting them directly on the submission instance,
        # as this is what the view's annotation would do and what GradeSubmissionSerializer.get_user expects on 'obj'.
        self.submission_text.approved_count = 10
        self.submission_text.rejected_count = 3
        # Ensure the user instance itself does not have these, to avoid confusion if get_user was different
        if hasattr(self.submission_text.user, "approved_count"):
            del self.submission_text.user.approved_count
        if hasattr(self.submission_text.user, "rejected_count"):
            del self.submission_text.user.rejected_count

        serializer = GradeSubmissionSerializer(
            instance=self.submission_text, context={"view_action": "retrieve"}
        )
        data = serializer.data

        self.assertEqual(data["id"], self.submission_text.id)
        self.assertEqual(data["status"], "Pending")  # Display
        self.assertEqual(data["proof_type"], "Text")  # Display
        self.assertEqual(data["campaign"], self.task_ongoing.campaign.name)
        self.assertEqual(data["dao_name"], self.task_ongoing.campaign.dao.name)
        self.assertEqual(data["description"], self.task_ongoing.description)

        # Check user (extended)
        self.assertEqual(data["user"]["username"], self.user.username)
        self.assertEqual(data["user"]["approved"], 10)
        self.assertEqual(data["user"]["rejected"], 3)

        # Check drop_proof
        self.assertIn("proof_text", data)
        self.assertNotIn("proof_image", data)
        self.assertNotIn("proof_video", data)

    def test_grade_submission_serializer_list_representation_user_simple(self):
        # For list view, user should be UserSimpleSerializer (no counts)
        serializer = GradeSubmissionSerializer(
            instance=self.submission_text, context={"view_action": "list"}
        )  # or no view_action
        data = serializer.data
        self.assertEqual(data["user"]["username"], self.user.username)
        self.assertNotIn("approved", data["user"])
        self.assertNotIn("rejected", data["user"])

    def test_grade_submission_serializer_patch_response_representation(self):
        # Simulate a PATCH update
        self.submission_text.status = 2  # Approved
        self.submission_text.feedback = "Well done!"

        serializer = GradeSubmissionSerializer(
            instance=self.submission_text, context={"view_action": "patch"}
        )
        data = serializer.data

        self.assertEqual(
            len(data.keys()), 3
        )  # Only id, status, feedback (after drop_proof)
        self.assertEqual(data["id"], self.submission_text.id)
        self.assertEqual(data["status"], "Approved")  # Display
        self.assertEqual(data["feedback"], "Well done!")
        # Proof fields should be dropped by drop_proof even if they were in the instance
        self.assertNotIn("proof_text", data)

    def test_grade_submission_serializer_update_valid(self):
        data_to_update = {
            "status": 2,
            "feedback": "Updated feedback.",
        }  # status 2 is 'Approved'
        serializer = GradeSubmissionSerializer(
            instance=self.submission_text,
            data=data_to_update,
            partial=True,
            context={"view_action": "patch"},  # Context for to_representation
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_submission = serializer.save()

        self.assertEqual(updated_submission.status, 2)
        self.assertEqual(updated_submission.feedback, "Updated feedback.")

    def test_grade_submission_serializer_update_invalid_status(self):
        data_to_update = {"status": 99}  # Invalid status choice
        serializer = GradeSubmissionSerializer(
            instance=self.submission_text, data=data_to_update, partial=True
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("status", serializer.errors)

    def test_grade_submission_serializer_update_creates_reward_on_approve(self):
        # Ensure no reward exists initially for the pending submission
        self.assertEqual(Reward.objects.count(), 0)

        data_to_update = {
            "status": 2,  # Approve
            "feedback": "Approved, reward should be created.",
        }
        serializer = GradeSubmissionSerializer(
            instance=self.submission_text,  # Use the pending submission
            data=data_to_update,
            partial=True,
            context={"view_action": "patch"},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_submission = serializer.save()

        self.assertEqual(updated_submission.status, 2)
        self.assertEqual(Reward.objects.count(), 1)  # A reward should be created
        reward = Reward.objects.first()
        self.assertEqual(reward.user, self.user)
        self.assertEqual(reward.submission, updated_submission)
        self.assertEqual(
            reward.reward, self.task_ongoing.reward
        )  # Reward should match task reward

    def test_grade_submission_serializer_update_does_not_create_reward_if_already_approved(
        self,
    ):
        # Use the already approved submission
        self.assertEqual(Reward.objects.count(), 0)  # Ensure no rewards initially

        # Manually create a reward for the approved submission to simulate a previous approval
        Reward.objects.create(
            user=self.submission_image.user,
            submission=self.submission_image,
            reward=self.submission_image.task.reward,
        )
        self.assertEqual(Reward.objects.count(), 1)  # One reward exists

        data_to_update = {
            "status": 2,  # Still Approved
            "feedback": "Updating feedback on an already approved submission.",
        }
        serializer = GradeSubmissionSerializer(
            instance=self.submission_image,  # Use the approved submission
            data=data_to_update,
            partial=True,
            context={"view_action": "patch"},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_submission = serializer.save()

        self.assertEqual(updated_submission.status, 2)
        self.assertEqual(Reward.objects.count(), 1)  # No new reward should be created

    def test_grade_submission_serializer_update_does_not_create_reward_on_reject(self):
        self.assertEqual(Reward.objects.count(), 0)  # Ensure no rewards initially

        data_to_update = {
            "status": 3,  # Reject
            "feedback": "Rejected, no reward should be created.",
        }
        serializer = GradeSubmissionSerializer(
            instance=self.submission_text,  # Use the pending submission
            data=data_to_update,
            partial=True,
            context={"view_action": "patch"},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_submission = serializer.save()

        self.assertEqual(updated_submission.status, 3)
        self.assertEqual(Reward.objects.count(), 0)  # No reward should be created

    def test_grade_submission_serializer_update_does_not_create_reward_on_pending(self):
        self.assertEqual(Reward.objects.count(), 0)  # Ensure no rewards initially

        data_to_update = {
            "status": 1,  # Pending
            "feedback": "Pending, no reward should be created.",
        }
        serializer = GradeSubmissionSerializer(
            instance=self.submission_text,  # Use the pending submission
            data=data_to_update,
            partial=True,
            context={"view_action": "patch"},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_submission = serializer.save()

        self.assertEqual(updated_submission.status, 1)
        self.assertEqual(Reward.objects.count(), 0)  # No reward should be created
