from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from decimal import Decimal

from submission.models import Submission
from task.models import Task
from campaign.models import Campaign
from dao.models import DAO
from core.models import User


class SubmissionViewTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user1 = User.objects.create_user(
            username="testuser1", eth_address="0xTestUser1", role=1
        )
        cls.user2 = User.objects.create_user(
            username="testuser2", eth_address="0xTestUser2", role=1
        )
        cls.moderator_user = User.objects.create_user(
            username="moduser", eth_address="0xModUser1", role=2
        )

        cls.dao = DAO.objects.create(
            name="Test DAO SubView",
        )  # Shortened token
        cls.campaign = Campaign.objects.create(
            name="Test Camp SubView", description="D", budget=100, dao=cls.dao
        )

        cls.task1 = Task.objects.create(
            campaign=cls.campaign,
            description="Task 1 SV",
            type=1,
            reward=10,
            quantity=2,
            status=1,
        )
        cls.task2_completed = Task.objects.create(
            campaign=cls.campaign,
            description="Task 2 Completed SV",
            type=1,
            reward=10,
            quantity=1,
            status=2,
        )

        # Submissions for user1
        cls.sub1_user1_pending = Submission.objects.create(
            task=cls.task1,
            user=cls.user1,
            link="http://u1s1.com",
            proof_text="U1S1 Proof",
            proof_type=1,
            status=1,
        )
        cls.sub2_user1_approved = Submission.objects.create(
            task=cls.task1,
            user=cls.user1,
            link="http://u1s2.com",
            proof_text="U1S2 Proof",
            proof_type=1,
            status=2,
        )

        # Submission for user2
        cls.sub1_user2_rejected = Submission.objects.create(
            task=cls.task1,
            user=cls.user2,
            link="http://u2s1.com",
            proof_text="U2S1 Proof",
            proof_type=1,
            status=3,
        )

    # --- SubmitTaskView Tests ---
    def test_submit_task_authenticated_success(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("submit-task")
        data = {
            "task": self.task1.id,
            "link": "http://newsubmission.example.com",  # Changed to a valid-looking URL
            "proof_text": "My new proof for task 1.",
            "proof_type": 1,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Submission.objects.count(), 4)  # 3 from setup + 1 new
        new_submission = Submission.objects.get(id=response.data["id"])
        self.assertEqual(new_submission.user, self.user1)
        self.assertEqual(new_submission.task, self.task1)

    def test_submit_task_updates_task_status_to_completed(self):

        fresh_task = Task.objects.create(
            campaign=self.campaign,
            description="Fresh Task",
            type=1,
            reward=5,
            quantity=1,
            status=1,
        )
        self.client.force_authenticate(user=self.user1)
        url = reverse("submit-task")
        data = {
            "task": fresh_task.id,
            "link": "http://fresh.com",
            "proof_text": "P",
            "proof_type": 1,
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        fresh_task.refresh_from_db()
        self.assertEqual(fresh_task.status, 2)  # Should be completed

    def test_submit_task_to_completed_task_fails(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("submit-task")
        data = {
            "task": self.task2_completed.id,
            "link": "http://fail.com",
            "proof_text": "F",
            "proof_type": 1,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Task is completed", str(response.data))

    def test_submit_task_unauthenticated(self):
        url = reverse("submit-task")
        data = {
            "task": self.task1.id,
            "link": "http://unauth.com",
            "proof_text": "U",
            "proof_type": 1,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_submit_task_authenticated_with_image_proof(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("submit-task")

        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image
        import io

        def generate_test_image_file():
            image = Image.new("RGB", (10, 10), color="white")
            byte_stream = io.BytesIO()
            image.save(byte_stream, format="PNG")
            byte_stream.seek(0)
            return SimpleUploadedFile(
                "test.png", byte_stream.read(), content_type="image/png"
            )

        image_file = generate_test_image_file()
        data = {
            "task": self.task1.id,
            "proof_image": image_file,
            "proof_type": 2,  # Image
            "link": "http://localhost:8000/api/docs/#/tasks/tasks_list",
        }
        response = self.client.post(
            url, data, format="multipart"
        )  # Use multipart for file uploads
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Submission.objects.count(), 4)  # 3 from setup + 1 new
        new_submission = Submission.objects.latest(
            "created_at"
        )  # Get the most recently created submission
        self.assertEqual(new_submission.user, self.user1)
        self.assertEqual(new_submission.task, self.task1)
        self.assertIsNotNone(new_submission.proof_image)

    def test_submit_task_authenticated_with_video_proof(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("submit-task")
        video_file = SimpleUploadedFile(
            "test_video.mp4", b"file_content_vid", content_type="video/mp4"
        )
        data = {
            "task": self.task1.id,
            "proof_video": video_file,
            "proof_type": 3,  # Video
            "link": "http://localhost:8000/api/docs/#/tasks/tasks_list",
        }
        response = self.client.post(
            url, data, format="multipart"
        )  # Use multipart for file uploads
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Submission.objects.count(), 4)  # 3 from setup + 1 new
        new_submission = Submission.objects.latest(
            "created_at"
        )  # Get the most recently created submission
        self.assertEqual(new_submission.user, self.user1)
        self.assertEqual(new_submission.task, self.task1)
        self.assertIsNotNone(new_submission.proof_video)
        self.assertIn(
            "test_video", new_submission.proof_video.name
        )  # Check file name is saved

    def test_submit_task_updates_task_status_to_completed_multiple_users(self):
        # Create a fresh task with quantity 2
        fresh_task_multi = Task.objects.create(
            campaign=self.campaign,
            description="Fresh Task Multi",
            type=1,
            reward=5,
            quantity=2,
            status=1,
        )
        url = reverse("submit-task")

        # User 1 submits
        self.client.force_authenticate(user=self.user1)
        data1 = {
            "task": fresh_task_multi.id,
            "link": "http://user1submit.com",
            "proof_text": "U1",
            "proof_type": 1,
        }
        response1 = self.client.post(url, data1, format="json")
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        fresh_task_multi.refresh_from_db()
        self.assertEqual(fresh_task_multi.status, 1)  # Still ongoing

        # User 2 submits
        self.client.force_authenticate(user=self.user2)
        data2 = {
            "task": fresh_task_multi.id,
            "link": "http://user2submit.com",
            "proof_text": "U2",
            "proof_type": 1,
        }
        response2 = self.client.post(url, data2, format="json")
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        fresh_task_multi.refresh_from_db()
        self.assertEqual(fresh_task_multi.status, 2)  # Should be completed now

    # --- SubmissionsHistoryView Tests ---
    def test_submissions_history_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("submissions-history")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertEqual(len(results), 2)  # user1 has 2 submissions
        submission_ids = {s["id"] for s in results}
        self.assertIn(self.sub1_user1_pending.id, submission_ids)
        self.assertIn(self.sub2_user1_approved.id, submission_ids)

    def test_submissions_history_filter_by_status(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("submissions-history")
        response = self.client.get(url, {"status": 1})  # Pending
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.sub1_user1_pending.id)

    def test_submissions_history_unauthenticated(self):
        url = reverse("submissions-history")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_submissions_history_authenticated_other_user_fails(self):
        self.client.force_authenticate(user=self.user2)  # Authenticate as user2
        url = reverse("submissions-history")
        response = self.client.get(url)
        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )  # History view allows authenticated users
        results = response.data.get("results", [])
        self.assertEqual(len(results), 1)  # user2 has 1 submission
        submission_ids = {s["id"] for s in results}
        self.assertIn(self.sub1_user2_rejected.id, submission_ids)
        self.assertNotIn(
            self.sub1_user1_pending.id, submission_ids
        )  # Should not see user1's submissions

    # --- SubmissionsOverviewView Tests ---
    def test_submissions_overview_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("submissions-overview")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pendingSubmissions"], 1)
        self.assertEqual(response.data["approvedSubmissions"], 1)
        self.assertEqual(response.data["rejectedSubmissions"], 0)

    def test_submissions_overview_unauthenticated(self):
        url = reverse("submissions-overview")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- GradeSubmissionsListView Tests ---
    def test_grade_submissions_list_as_moderator(self):
        self.client.force_authenticate(user=self.moderator_user)
        url = reverse("submissions-moderation")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertEqual(len(results), 3)  # All submissions

    def test_grade_submissions_list_as_non_moderator(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("submissions-moderation")
        response = self.client.get(url)
        # Expecting 403 Forbidden because IsModerator now raises PermissionDenied
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # ErrorHandlingMixin formats this as {"error": "permission denied: <message>"}
        self.assertIn("error", response.data)
        self.assertIn(
            "permission denied: You do not have permission to perform this action as you are not a moderator.",
            str(response.data["error"]),
        )

    # --- GradeSubmissionView Tests ---
    def test_grade_submission_retrieve_as_moderator(self):
        self.client.force_authenticate(user=self.moderator_user)
        url = reverse("grade-submission", kwargs={"pk": self.sub1_user1_pending.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.sub1_user1_pending.id)
        self.assertIn("user", response.data)
        self.assertIn(
            "approved", response.data["user"]
        )  # Serialized field name is 'approved'

    def test_grade_submission_retrieve_as_non_moderator(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("grade-submission", kwargs={"pk": self.sub1_user1_pending.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)
        self.assertIn(
            "permission denied: You do not have permission to perform this action as you are not a moderator.",
            str(response.data["error"]),
        )

    def test_grade_submission_retrieve_other_user_as_regular_user_fails(self):
        self.client.force_authenticate(user=self.user2)  # Authenticate as user2
        url = reverse(
            "grade-submission", kwargs={"pk": self.sub1_user1_pending.id}
        )  # Attempt to retrieve user1's submission
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)
        self.assertIn(
            "permission denied: You do not have permission to perform this action as you are not a moderator.",
            str(response.data["error"]),
        )

    def test_grade_submission_patch_other_user_as_regular_user_fails(self):
        self.client.force_authenticate(user=self.user2)  # Authenticate as user2
        url = reverse(
            "grade-submission", kwargs={"pk": self.sub1_user1_pending.id}
        )  # Attempt to patch user1's submission
        data = {"status": 2, "feedback": "Attempt to grade other user's submission."}
        response = self.client.patch(url, data, format="json")
        # The view enforces IsModerator, which returns a custom error format.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)
        self.assertIn(
            "permission denied: You do not have permission to perform this action as you are not a moderator.",
            str(response.data["error"]),
        )

    def test_grade_submission_patch_as_moderator_approve(self):
        self.client.force_authenticate(user=self.moderator_user)
        url = reverse("grade-submission", kwargs={"pk": self.sub1_user1_pending.id})
        data = {"status": 2, "feedback": "Approved by moderator."}  # Approve
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.sub1_user1_pending.refresh_from_db()
        self.assertEqual(self.sub1_user1_pending.status, 2)
        self.assertEqual(self.sub1_user1_pending.feedback, "Approved by moderator.")
        # Check response structure (only id, status, feedback)
        self.assertEqual(len(response.data.keys()), 3)
        self.assertEqual(response.data["status"], "Approved")

        # Test campaign progress update (signal)
        # task1 quantity 2. Initially 1 approved (sub2_user1_approved).
        # After approving sub1_user1_pending, task1 has 2 approved submissions.
        # task2_completed quantity 1 (0 approved).
        # Total completed = 2, Total quantity = 2+1=3. Progress = (2/3)*100 = 66.7
        self.campaign.refresh_from_db()
        self.assertAlmostEqual(self.campaign.progress, Decimal("66.7"), places=1)

    def test_grade_submission_patch_as_moderator_reject(self):
        self.client.force_authenticate(user=self.moderator_user)
        url = reverse(
            "grade-submission", kwargs={"pk": self.sub1_user2_rejected.id}
        )  # Use the rejected submission
        data = {"status": 3, "feedback": "Still rejected."}  # Reject
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.sub1_user2_rejected.refresh_from_db()
        self.assertEqual(self.sub1_user2_rejected.status, 3)
        self.assertEqual(self.sub1_user2_rejected.feedback, "Still rejected.")
        # Check response structure
        self.assertEqual(len(response.data.keys()), 3)
        self.assertEqual(response.data["status"], "Rejected")

        # Campaign progress should not change as this submission was already rejected
        self.campaign.refresh_from_db()
        # Initial state: task1 (1 approved), task2_completed (0 approved). Total completed = 1, Total quantity = 3. Progress = (1/3)*100 = 33.3
        # After rejecting an already rejected submission, progress remains 33.3
        self.assertAlmostEqual(self.campaign.progress, Decimal("33.3"), places=1)

    def test_grade_submission_patch_as_moderator_change_from_approved_to_pending(self):
        # Use sub2_user1_approved which is initially approved
        self.client.force_authenticate(user=self.moderator_user)
        url = reverse("grade-submission", kwargs={"pk": self.sub2_user1_approved.id})
        data = {"status": 1, "feedback": "Needs revision."}  # Change to Pending
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.sub2_user1_approved.refresh_from_db()
        self.assertEqual(self.sub2_user1_approved.status, 1)
        self.assertEqual(self.sub2_user1_approved.feedback, "Needs revision.")
        # Check response structure
        self.assertEqual(len(response.data.keys()), 3)
        self.assertEqual(response.data["status"], "Pending")

        self.campaign.refresh_from_db()
        self.assertAlmostEqual(self.campaign.progress, Decimal("0.0"), places=1)

    def test_grade_submission_patch_as_non_moderator(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("grade-submission", kwargs={"pk": self.sub1_user1_pending.id})
        data = {"status": 2, "feedback": "Attempt by non-mod."}
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)
        self.assertIn(
            "permission denied: You do not have permission to perform this action as you are not a moderator.",
            str(response.data["error"]),
        )
