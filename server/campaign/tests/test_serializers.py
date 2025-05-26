from django.test import TestCase
from decimal import Decimal
from django.db.models import Count  # For annotating total_tasks

from campaign.models import Campaign
from campaign.serializers import CampaignSerializer, DAOSimpleSerializer
from dao.models import DAO
from task.models import Task  # Needed to create tasks for total_tasks annotation


class DAOSimpleSerializerTests(TestCase):
    def test_dao_simple_serializer(self):
        dao = DAO.objects.create(name="Test DAO", image="path/to/image.png")
        serializer = DAOSimpleSerializer(instance=dao)
        expected_data = {
            "name": "Test DAO",
            "image": "/media/path/to/image.png",  # Assuming MEDIA_URL is /media/
        }
        # Note: The exact image URL depends on MEDIA_URL settings and how ImageField serializes.
        # For simplicity, we'll check if the image field in data ends with the image name.
        self.assertEqual(serializer.data["name"], expected_data["name"])
        if dao.image:
            self.assertTrue(serializer.data["image"].endswith("path/to/image.png"))
        else:
            self.assertIsNone(serializer.data["image"])


class CampaignSerializerTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.dao = DAO.objects.create(name="Main DAO")
        cls.campaign1 = Campaign.objects.create(
            name="Summer Fest",
            description="Annual summer festival campaign.",
            budget=50000,
            status=1,  # Active
            progress=Decimal("50.5"),
            dao=cls.dao,
        )
        # Create tasks for campaign1 to test total_tasks annotation
        Task.objects.create(
            campaign=cls.campaign1, description="Task A", type=1, reward=10, quantity=1
        )
        Task.objects.create(
            campaign=cls.campaign1, description="Task B", type=1, reward=10, quantity=1
        )

        # Campaign with different status for display testing
        cls.campaign2 = Campaign.objects.create(
            name="Winter Promo",
            description="Winter promotion event.",
            budget=20000,
            status=3,  # Completed
            dao=cls.dao,
        )
        Task.objects.create(
            campaign=cls.campaign2, description="Task C", type=1, reward=10, quantity=1
        )

    def test_campaign_serializer_basic_fields(self):
        # Get campaign with annotated total_tasks
        campaign_with_annotation = Campaign.objects.annotate(
            total_tasks=Count("tasks")
        ).get(id=self.campaign1.id)
        serializer = CampaignSerializer(instance=campaign_with_annotation)
        data = serializer.data

        self.assertEqual(data["id"], self.campaign1.id)
        self.assertEqual(data["name"], "Summer Fest")
        self.assertEqual(data["description"], "Annual summer festival campaign.")
        # Progress is recalculated to 0.0 by signals when tasks are added in setUpTestData,
        # as there are no approved submissions for these tasks initially.
        self.assertEqual(data["progress"], "0.0")
        self.assertIn("created_at", data)  # Check presence and format if needed

    def test_campaign_serializer_status_display(self):
        campaign_active = Campaign.objects.annotate(total_tasks=Count("tasks")).get(
            id=self.campaign1.id
        )  # status=1
        serializer_active = CampaignSerializer(instance=campaign_active)
        self.assertEqual(serializer_active.data["status"], "Active")

        campaign_completed = Campaign.objects.annotate(total_tasks=Count("tasks")).get(
            id=self.campaign2.id
        )  # status=3
        serializer_completed = CampaignSerializer(instance=campaign_completed)
        self.assertEqual(serializer_completed.data["status"], "Completed")

    def test_campaign_serializer_total_tasks(self):
        campaign_with_annotation = Campaign.objects.annotate(
            total_tasks=Count("tasks")
        ).get(id=self.campaign1.id)
        serializer = CampaignSerializer(instance=campaign_with_annotation)
        self.assertEqual(serializer.data["total_tasks"], 2)  # campaign1 has 2 tasks

        campaign2_with_annotation = Campaign.objects.annotate(
            total_tasks=Count("tasks")
        ).get(id=self.campaign2.id)
        serializer2 = CampaignSerializer(instance=campaign2_with_annotation)
        self.assertEqual(serializer2.data["total_tasks"], 1)  # campaign2 has 1 task

    def test_campaign_serializer_nested_dao(self):
        campaign_with_annotation = Campaign.objects.annotate(
            total_tasks=Count("tasks")
        ).get(id=self.campaign1.id)
        serializer = CampaignSerializer(instance=campaign_with_annotation)
        dao_data = serializer.data["dao"]

        self.assertEqual(dao_data["name"], self.dao.name)
        if self.dao.image:
            self.assertTrue(dao_data["image"].endswith(self.dao.image.name))
        else:
            self.assertIsNone(dao_data["image"])

    def test_campaign_serializer_read_only_nature(self):
        """
        Technically, since all relevant fields are read_only or sourced,
        attempting to validate input data for update/create is not meaningful
        for this specific serializer. This test serves as a conceptual check.
        """
        campaign_instance = Campaign.objects.annotate(total_tasks=Count("tasks")).get(
            id=self.campaign1.id
        )
        data_to_update = {
            "name": "New Name (should be ignored)",
            "description": "New Desc (should be ignored)",
            "progress": "75.0",  # Should be ignored
            "status": "Planning",  # Should be ignored
        }
        serializer = CampaignSerializer(
            instance=campaign_instance, data=data_to_update, partial=True
        )

        # is_valid() should be true because read-only fields don't cause validation errors on input
        # if they are not part of the writable fields.
        # However, if a read-only field is provided in input data, DRF typically ignores it.
        self.assertTrue(serializer.is_valid())

        # If we were to call serializer.save(), it shouldn't change the instance based on these inputs.
        # For example, trying to update 'name' (which is read_only=True in extra_kwargs)
        # should not modify the actual campaign name.
        # This is more thoroughly tested at the view level if views allowed writes.
        # Here, we just confirm that providing data for read-only fields doesn't make it invalid.

        # Let's check that validated_data does not contain these read-only fields
        # if they were truly ignored during the binding process.
        # For fields explicitly marked read_only=True in serializer field definition or Meta.read_only_fields
        # they are typically excluded from validated_data.
        self.assertNotIn("name", serializer.validated_data)
        self.assertNotIn("description", serializer.validated_data)
        self.assertNotIn("progress", serializer.validated_data)
        # 'status' is read_only=True due to source="get_status_display" and explicit read_only=True
        self.assertNotIn("status", serializer.validated_data)
        # 'dao' is a nested serializer; its fields are read-only.
        # The 'dao' field itself in CampaignSerializer is not marked read_only in its definition,
        # but its constituent parts are. DRF might handle this by not allowing assignment to 'dao'.
        # For a nested read-only serializer, attempting to write to it usually means the top-level key
        # for the nested data is also not in validated_data if the whole structure is read-only.
        self.assertNotIn("dao", serializer.validated_data)
