from django.urls import reverse
from rest_framework import status
from rest_framework.test import (
    APITestCase,
)  # Import APIRequestFactory
from decimal import Decimal
from django.utils import timezone  # Import timezone
import datetime

from task.models import Task
from campaign.models import Campaign
from dao.models import DAO
from submission.models import Submission  # For submissions_count context
from core.models import User  # For submissions


class TaskViewTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.dao = DAO.objects.create(name="TaskView DAO")
        cls.campaign1 = Campaign.objects.create(
            name="TV Camp 1",
            description="C1",
            budget=Decimal("1000.00"),
            dao=cls.dao,  # Use Decimal for budget
        )
        cls.campaign2 = Campaign.objects.create(
            name="TV Camp 2",
            description="C2",
            budget=Decimal("2000.00"),
            dao=cls.dao,  # Use Decimal for budget
        )

        cls.user = User.objects.create_user(
            eth_address="0xTaskViewUser1234567890123456789012345",
            username="task_view",
        )
        cls.favorite_dao_user = User.objects.create_user(
            eth_address="0xFavoriteDaoUserView12345678901234567890",
            username="fav_dao_view",
        )
        cls.favorite_dao_user.favorite_daos.add(cls.dao)

        # Ongoing tasks (status=1)
        cls.task1_c1_ongoing = Task.objects.create(
            campaign=cls.campaign1,
            description="T1C1 Ongoing",
            type=1,
            reward=Decimal("10.00"),  # Use Decimal for reward
            quantity=5,
            status=1,
        )
        Submission.objects.create(
            task=cls.task1_c1_ongoing, user=cls.user, link="s1.com", status=2
        )  # 1 approved
        Submission.objects.create(
            task=cls.task1_c1_ongoing, user=cls.user, link="s2.com", status=1
        )  # 1 pending

        cls.task2_c1_ongoing = Task.objects.create(
            campaign=cls.campaign1,
            description="T2C1 Ongoing",
            type=2,
            reward=Decimal("20.00"),  # Use Decimal for reward
            quantity=3,
            status=1,
        )
        # No submissions for task2_c1_ongoing

        cls.task4_c2_ongoing = Task.objects.create(  # Add a task in campaign 2
            campaign=cls.campaign2,
            description="T4C2 Ongoing",
            type=1,
            reward=Decimal("50.00"),
            quantity=1,
            status=1,
        )
        Submission.objects.create(
            task=cls.task4_c2_ongoing, user=cls.user, link="s5.com", status=2
        )  # 1 approved

        # Completed task (status=2) - should not appear in the list by default
        cls.task3_c2_completed = Task.objects.create(
            campaign=cls.campaign2,
            description="T3C2 Completed",
            type=1,
            reward=Decimal("30.00"),  # Use Decimal for reward
            quantity=2,
            status=2,
        )
        Submission.objects.create(
            task=cls.task3_c2_completed, user=cls.user, link="s3.com", status=2
        )
        Submission.objects.create(
            task=cls.task3_c2_completed, user=cls.user, link="s4.com", status=2
        )

        cls.list_url = reverse("tasks-list")
        cls.create_url = reverse("task-create")  # Add create URL

    def test_list_tasks_unauthenticated_allowed(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_tasks_shows_only_ongoing(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Assuming TenResultsSetPagination default page size is 10
        # response.data will be a dict like {'count': X, 'next': Y, 'previous': Z, 'results': [...]}
        results = response.data.get(
            "results", []
        )  # Adjust if not paginated or different structure

        self.assertEqual(
            len(results), 3
        )  # task1_c1_ongoing, task2_c1_ongoing, task4_c2_ongoing
        task_ids_in_response = {task["id"] for task in results}
        self.assertIn(self.task1_c1_ongoing.id, task_ids_in_response)
        self.assertIn(self.task2_c1_ongoing.id, task_ids_in_response)
        self.assertIn(self.task4_c2_ongoing.id, task_ids_in_response)
        self.assertNotIn(self.task3_c2_completed.id, task_ids_in_response)

    def test_list_tasks_data_structure_and_content(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])

        # Find task1_c1_ongoing data
        task1_data = next(
            (t for t in results if t["id"] == self.task1_c1_ongoing.id), None
        )
        self.assertIsNotNone(task1_data)

        self.assertEqual(task1_data["description"], "T1C1 Ongoing")
        self.assertEqual(task1_data["type"], "Discussion")  # Display name
        self.assertEqual(task1_data["reward"], "10.00")
        self.assertEqual(task1_data["quantity"], 5)
        self.assertEqual(task1_data["status"], "Ongoing")  # Ongoing
        self.assertEqual(task1_data["submissions_count"], 2)  # 1 approved, 1 pending
        # The view calculates total_rewards for ALL tasks, not per task in the list.
        # The assertion for total_rewards on individual task data is incorrect and has been removed.

        # Check nested campaign data
        self.assertEqual(task1_data["campaign"]["id"], self.campaign1.id)
        self.assertEqual(task1_data["campaign"]["name"], self.campaign1.name)
        self.assertNotIn("budget", task1_data["campaign"])  # Check budget is popped
        self.assertIn("dao", task1_data["campaign"])
        self.assertNotIn(
            "name", task1_data["campaign"]["dao"]
        )  # Check dao name is popped

    def test_list_tasks_filter_by_campaign(self):
        response = self.client.get(self.list_url, {"campaign": self.campaign1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])

        self.assertEqual(len(results), 2)  # Only tasks from campaign1
        task_ids_in_response = {task["id"] for task in results}
        self.assertIn(self.task1_c1_ongoing.id, task_ids_in_response)
        self.assertIn(self.task2_c1_ongoing.id, task_ids_in_response)
        self.assertNotIn(self.task4_c2_ongoing.id, task_ids_in_response)
        self.assertNotIn(self.task3_c2_completed.id, task_ids_in_response)

    def test_list_tasks_is_from_favorite_dao_authenticated(self):
        self.client.force_authenticate(user=self.favorite_dao_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])

        # All ongoing tasks are from the favorited DAO in this setup
        for task_data in results:
            self.assertIn("is_from_favorite_dao", task_data)
            self.assertTrue(task_data["is_from_favorite_dao"])

    def test_list_tasks_is_from_favorite_dao_unauthenticated(self):
        # No user authenticated, is_from_favorite_dao should not be present or be False
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])

        for task_data in results:
            self.assertIn(
                "is_from_favorite_dao", task_data
            )  # Field is added for unauthenticated users as False
            self.assertFalse(task_data["is_from_favorite_dao"])

    def test_list_tasks_completed_tasks_count_in_response(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # completed_tasks_count is added to the top level of the paginated response
        self.assertIn("completed_tasks_count", response.data)
        self.assertEqual(
            response.data["completed_tasks_count"], 1
        )  # task3_c2_completed

    def test_list_tasks_average_reward_in_response(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertIn("average_reward", response.data)
        # Ongoing tasks: task1 (10), task2 (20), task4 (50). Avg = (10+20+50)/3 = 80/3 = 26.66...
        self.assertAlmostEqual(
            response.data["average_reward"], Decimal("26.67"), places=2
        )

    def test_list_tasks_total_rewards_in_response(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertIn("total_rewards", response.data)
        # Total rewards for ongoing tasks (reward * quantity):
        # task1_c1_ongoing (10*5=50), task2_c1_ongoing (20*3=60), task4_c2_ongoing (50*1=50).
        # Total = 50 + 60 + 50 = 160
        self.assertEqual(
            response.data["total_rewards"], Decimal("160.00")
        )  # Compare Decimal to Decimal

    def test_task_view_pagination(self):
        # Create more than 10 ongoing tasks to test pagination
        for i in range(12):  # Create 12 more tasks
            Task.objects.create(
                campaign=self.campaign2,
                description=f"Page Task {i}",
                type=1,
                reward=1,
                quantity=1,
                status=1,
            )

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIsNone(response.data["previous"])  # First page
        self.assertEqual(len(response.data["results"]), 10)  # TenResultsSetPagination
        self.assertEqual(response.data["count"], 3 + 12)  # 3 original ongoing + 12 new

        # Test fetching the second page
        next_page_url = response.data["next"]
        self.assertIsNotNone(next_page_url)
        response_page2 = self.client.get(next_page_url)
        self.assertEqual(response_page2.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response_page2.data["results"]),
            (3 + 12) % 10 if (3 + 12) % 10 != 0 else 10,
        )  # Remaining tasks
        self.assertIsNotNone(response_page2.data["previous"])

    def test_task_view_does_not_support_post(self):
        data = {
            "description": "New Task via API",
            "campaign": self.campaign1.id,
            "type": 1,
            "reward": 5,
            "quantity": 1,
        }
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # Add similar tests for PUT, PATCH, DELETE if necessary to confirm 405


class TaskCreateViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.creator_user = User.objects.create_user(
            eth_address="0xCreatorUserView12345678901234567890",
            username="creator_view",
        )
        cls.other_user = User.objects.create_user(
            eth_address="0xOtherUserView12345678901234567890",
            username="other_view",
        )
        cls.dao = DAO.objects.create(
            name="Create Task DAO View", created_by=cls.creator_user
        )
        cls.campaign = Campaign.objects.create(
            name="Create Task Campaign View",
            description="Campaign for task creation view tests.",
            budget=Decimal("500.00"),
            dao=cls.dao,
        )
        cls.create_url = reverse("task-create")

    def test_create_task_authenticated_success(self):
        self.client.force_authenticate(user=self.creator_user)
        data = {
            "description": "New Task View Description",
            "type": 1,
            "reward": "10.00",
            "quantity": 5,
            "deadline": (
                timezone.now() + datetime.timedelta(days=7)
            ).date(),  # Changed to date object
            "campaign": self.campaign.id,
        }
        response = self.client.post(self.create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)  # 1 new task created
        # Fetch the created task by description and campaign as id is not returned in the response
        new_task = Task.objects.get(
            description="New Task View Description", campaign=self.campaign
        )
        self.assertEqual(new_task.description, "New Task View Description")
        self.assertEqual(new_task.campaign, self.campaign)

    def test_create_task_unauthenticated(self):
        data = {
            "description": "Unauthenticated Task",
            "type": 1,
            "reward": "10.00",
            "quantity": 5,
            "campaign": self.campaign.id,
        }
        response = self.client.post(self.create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_task_invalid_campaign_user(self):
        self.client.force_authenticate(user=self.other_user)  # Not the creator
        data = {
            "description": "Invalid User Task",
            "type": 1,
            "reward": "10.00",
            "quantity": 5,
            "campaign": self.campaign.id,
        }
        response = self.client.post(self.create_url, data, format="json")
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST
        )  # Serializer validation
        self.assertIn("campaign", response.data)
        self.assertIn(
            "You can only create tasks for campaigns belonging to DAOs you created.",
            str(response.data["campaign"]),
        )

    def test_create_task_serializer_validation_errors_handled(self):
        self.client.force_authenticate(user=self.creator_user)
        data = {
            "description": "Invalid Data Task",
            "type": 1,
            "reward": "600.00",  # Exceeds budget
            "quantity": 1,
            "campaign": self.campaign.id,
        }
        response = self.client.post(self.create_url, data, format="json")
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST
        )  # Serializer validation
        self.assertIn("non_field_errors", response.data)
        self.assertIn(
            "Total reward for all tasks (600.00) exceeds the campaign budget (500.00). Remaining budget: 500.00",
            str(response.data["non_field_errors"]),
        )
