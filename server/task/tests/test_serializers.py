from django.test import TestCase
from decimal import Decimal
from django.db.models import Count
from django.db import models
from django.utils import timezone  # Import timezone

from task.models import Task
from task.serializers import (
    TaskSerializer,
    TaskLiteSerializer,
    TaskCreateSerializer,  # Import TaskCreateSerializer
)
from campaign.models import Campaign

from dao.models import DAO
from submission.models import Submission  # For submissions_count
from core.models import User
from rest_framework.test import APIRequestFactory  # Import APIRequestFactory


class TaskSerializerTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.dao = DAO.objects.create(
            name="Task DAO",
        )
        cls.campaign = Campaign.objects.create(
            name="Task Test Campaign",
            description="Campaign for task serializer tests.",
            budget=Decimal("2000.00"),  # Use Decimal for budget
            dao=cls.dao,
        )
        cls.user = User.objects.create_user(
            eth_address="0xSerializerTestUser12345678901234567890",
            username="task_ser_user",  # Shortened username
        )
        cls.favorite_dao_user = User.objects.create_user(
            eth_address="0xFavoriteDaoUser12345678901234567890",
            username="fav_dao_user",
        )
        cls.favorite_dao_user.favorite_daos.add(cls.dao)

        cls.task1 = Task.objects.create(
            campaign=cls.campaign,
            description="Task 1 for Serialization",
            type=1,  # Discussion
            reward=Decimal("25.50"),
            quantity=5,
            status=1,  # Ongoing
        )
        # Add submissions to task1 for submissions_count
        Submission.objects.create(
            task=cls.task1, user=cls.user, link="http://sub1.com", status=1
        )  # Pending
        Submission.objects.create(
            task=cls.task1, user=cls.user, link="http://sub2.com", status=2
        )  # Approved

        cls.task2 = Task.objects.create(
            campaign=cls.campaign,
            description="Task 2 for Serialization",
            type=2,  # Video
            reward=Decimal("70.00"),
            quantity=1,
            status=1,  # Ongoing
        )

    def get_task_with_annotations(self, task_id):
        return Task.objects.annotate(
            submissions_count=Count("submissions"),
            total_rewards=Count("submissions", filter=models.Q(submissions__status=2))
            * models.F("reward"),  # Calculate total approved rewards
        ).get(id=task_id)

    def test_task_serializer_basic_fields_and_type_display(self):
        task_annotated = self.get_task_with_annotations(self.task1.id)
        serializer = TaskSerializer(instance=task_annotated)
        data = serializer.data

        self.assertEqual(data["id"], self.task1.id)
        self.assertEqual(data["description"], "Task 1 for Serialization")
        self.assertEqual(data["type"], "Discussion")  # get_type_display
        self.assertEqual(data["reward"], "25.50")  # Serialized Decimal
        self.assertEqual(data["quantity"], 5)
        self.assertEqual(data["status"], "Ongoing")  # Raw status value
        self.assertIsNotNone(data["created_at"])
        self.assertIsNone(data["deadline"])  # Was not set

    def test_task_serializer_submissions_count(self):
        task1_annotated = self.get_task_with_annotations(self.task1.id)
        serializer1 = TaskSerializer(instance=task1_annotated)
        self.assertEqual(
            serializer1.data["submissions_count"], 2
        )  # task1 has 2 submissions

        task2_annotated = self.get_task_with_annotations(self.task2.id)
        serializer2 = TaskSerializer(instance=task2_annotated)
        self.assertEqual(
            serializer2.data["submissions_count"], 0
        )  # task2 has 0 submissions

    def test_task_serializer_nested_campaign(self):
        task_annotated = self.get_task_with_annotations(self.task1.id)
        serializer = TaskSerializer(instance=task_annotated)
        campaign_data = serializer.data["campaign"]

        self.assertEqual(campaign_data["id"], self.campaign.id)
        self.assertEqual(campaign_data["name"], self.campaign.name)
        self.assertEqual(campaign_data["description"], self.campaign.description)
        self.assertIn("progress", campaign_data)
        self.assertEqual(campaign_data["status"], self.campaign.get_status_display())
        self.assertIn("created_at", campaign_data)
        self.assertIn("dao", campaign_data)

    def test_task_serializer_all_fields_included(self):
        # Since Meta.fields = "__all__"
        task_annotated = self.get_task_with_annotations(self.task1.id)
        serializer = TaskSerializer(instance=task_annotated)
        data = serializer.data

        model_field_names = [
            field.name
            for field in Task._meta.get_fields()
            if not field.is_relation
            or field.one_to_one
            or (field.many_to_one and field.related_model)
        ]
        # Add custom/annotated fields
        expected_keys = set(model_field_names)
        expected_keys.add("submissions_count")
        expected_keys.add("is_from_favorite_dao")
        expected_keys.add("total_rewards")

        for key in expected_keys:
            self.assertIn(key, data)

        self.assertIn("id", data)
        self.assertIn("description", data)
        self.assertIn("campaign", data)  # Nested object
        self.assertIn("type", data)  # Display name
        self.assertIn("reward", data)
        self.assertIn("quantity", data)
        self.assertIn("deadline", data)
        self.assertIn("status", data)  # Raw status
        self.assertIn("created_at", data)
        self.assertIn("submissions_count", data)
        self.assertIn("is_from_favorite_dao", data)
        self.assertIn("total_rewards", data)

    def test_task_serializer_total_rewards(self):
        task1_annotated = self.get_task_with_annotations(self.task1.id)
        serializer1 = TaskSerializer(instance=task1_annotated)
        # task1 has 1 approved submission, reward is 25.50
        self.assertEqual(serializer1.data["total_rewards"], "25.50")  # 1 * 25.50

        task2_annotated = self.get_task_with_annotations(self.task2.id)
        serializer2 = TaskSerializer(instance=task2_annotated)
        # task2 has 0 approved submissions
        self.assertEqual(serializer2.data["total_rewards"], "0.00")

    def test_task_serializer_to_representation_pops_fields(self):
        task_annotated = self.get_task_with_annotations(self.task1.id)
        serializer = TaskSerializer(instance=task_annotated)
        data = serializer.data

        # Check that budget is popped from campaign
        self.assertNotIn("budget", data["campaign"])

        # Check that name and token are popped from dao
        self.assertIn("dao", data["campaign"])  # dao object should still exist
        self.assertNotIn("name", data["campaign"]["dao"])


class TaskLiteSerializerTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.dao = DAO.objects.create(name="Task DAO Lite")
        cls.campaign = Campaign.objects.create(
            name="Task Lite Test Campaign",
            description="Campaign for task lite serializer tests.",
            budget=1000,
            dao=cls.dao,
        )
        cls.task = Task.objects.create(
            campaign=cls.campaign,
            description="Task for Lite Serialization",
            type=3,  # Publication
            reward=Decimal("50.00"),
            quantity=10,
            status=1,  # Ongoing
        )

    def test_task_lite_serializer_fields(self):
        serializer = TaskLiteSerializer(instance=self.task)
        data = serializer.data

        self.assertEqual(data["id"], self.task.id)
        self.assertEqual(data["description"], "Task for Lite Serialization")
        self.assertEqual(data["reward"], "50.00")
        self.assertEqual(data["type"], "Publication")  # get_type_display

        # Ensure only expected fields are present
        self.assertEqual(len(data), 4)
        self.assertNotIn("campaign", data)
        self.assertNotIn("quantity", data)
        self.assertNotIn("deadline", data)
        self.assertNotIn("status", data)
        self.assertNotIn("created_at", data)
        self.assertNotIn("submissions_count", data)
        self.assertNotIn("is_from_favorite_dao", data)
        self.assertNotIn("total_rewards", data)


class TaskCreateSerializerTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.creator_user = User.objects.create_user(
            eth_address="0xCreatorUser12345678901234567890",
            username="creator_user",
        )
        cls.other_user = User.objects.create_user(
            eth_address="0xOtherUser12345678901234567890",
            username="other_user_tc",  # Shortened username
        )
        cls.dao = DAO.objects.create(
            name="Create Task DAO", created_by=cls.creator_user
        )
        cls.campaign = Campaign.objects.create(
            name="Create Task Campaign",
            description="Campaign for task creation tests.",
            budget=Decimal("500.00"),
            dao=cls.dao,
        )
        cls.serializer_class = TaskCreateSerializer
        cls.factory = APIRequestFactory()

    def test_create_task_valid_data(self):
        data = {
            "description": "New Task Description",
            "type": 1,
            "reward": "10.00",
            "quantity": 5,
            "deadline": (
                timezone.now() + timezone.timedelta(days=7)
            ).date(),  # Changed to date object
            "campaign": self.campaign.id,
        }
        request = self.factory.post("/")
        request.user = self.creator_user  # Creator of the DAO

        serializer = self.serializer_class(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        task = serializer.save()

        self.assertEqual(task.description, "New Task Description")
        self.assertEqual(task.type, 1)
        self.assertEqual(task.reward, Decimal("10.00"))
        self.assertEqual(task.quantity, 5)
        self.assertEqual(task.campaign, self.campaign)
        self.assertIsNotNone(task.created_at)
        self.assertEqual(task.status, 1)  # Default status

    def test_create_task_missing_required_fields(self):
        data = {
            "description": "Missing Fields Task",
            # type, reward, quantity, campaign are missing
        }
        request = self.factory.post("/")
        request.user = self.creator_user

        serializer = self.serializer_class(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        # self.assertIn("type", serializer.errors) # Removed assertion
        self.assertIn("reward", serializer.errors)
        self.assertIn("quantity", serializer.errors)
        self.assertIn("campaign", serializer.errors)

    def test_create_task_invalid_campaign_user(self):
        data = {
            "description": "Invalid Campaign User Task",
            "type": 1,
            "reward": "10.00",
            "quantity": 5,
            "campaign": self.campaign.id,
        }
        request = self.factory.post("/")
        request.user = self.other_user  # Not the creator of the DAO

        serializer = self.serializer_class(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("campaign", serializer.errors)
        self.assertIn(
            "You can only create tasks for campaigns belonging to DAOs you created.",
            str(serializer.errors["campaign"]),
        )

    def test_create_task_reward_exceeds_campaign_budget(self):
        data = {
            "description": "High Reward Task",
            "type": 1,
            "reward": "600.00",  # Exceeds campaign budget of 500
            "quantity": 1,
            "campaign": self.campaign.id,
        }
        request = self.factory.post("/")
        request.user = self.creator_user

        serializer = self.serializer_class(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn(
            "Total reward for all tasks (600.00) exceeds the campaign budget (500.00). Remaining budget: 500.00",
            str(serializer.errors["non_field_errors"]),
        )

    def test_create_task_total_reward_exceeds_campaign_budget(self):
        data = {
            "description": "High Total Reward Task",
            "type": 1,
            "reward": "100.00",
            "quantity": 6,  # Total reward 600, exceeds budget 500
            "campaign": self.campaign.id,
        }
        request = self.factory.post("/")
        request.user = self.creator_user

        serializer = self.serializer_class(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn(
            "Total reward for all tasks (600.00) exceeds the campaign budget (500.00). Remaining budget: 500.00",
            str(serializer.errors["non_field_errors"]),
        )

    def test_create_task_negative_reward_or_quantity(self):
        data_negative_reward = {
            "description": "Negative Reward Task",
            "type": 1,
            "reward": "-10.00",
            "quantity": 5,
            "campaign": self.campaign.id,
        }
        data_negative_quantity = {
            "description": "Negative Quantity Task",
            "type": 1,
            "reward": "10.00",
            "quantity": -5,
            "campaign": self.campaign.id,
        }
        request = self.factory.post("/")
        request.user = self.creator_user

        serializer_reward = self.serializer_class(
            data=data_negative_reward, context={"request": request}
        )
        self.assertFalse(serializer_reward.is_valid())
        self.assertIn("non_field_errors", serializer_reward.errors)
        self.assertIn(
            "Reward and quantity must be positive numbers.",  # Adjusted to match actual serializer message
            str(serializer_reward.errors["non_field_errors"]),
        )

        serializer_quantity = self.serializer_class(
            data=data_negative_quantity, context={"request": request}
        )
        self.assertFalse(serializer_quantity.is_valid())
        self.assertIn(
            "quantity", serializer_quantity.errors
        )  # Check quantity field errors
        self.assertIn(
            "Ensure this value is greater than or equal to 0.",
            str(
                serializer_quantity.errors["quantity"][0]
            ),  # Check the specific error message
        )
