from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from decimal import Decimal
from django.db.models import Sum

from campaign.models import Campaign
from dao.models import DAO
from task.models import Task
from core.models import User


class CampaignViewTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.dao1 = DAO.objects.create(name="DAO Alpha")
        cls.dao2 = DAO.objects.create(name="DAO Beta", image="path/to/beta.png")

        cls.campaign1 = Campaign.objects.create(
            name="Spring Initiative",
            description="Campaign for spring.",
            budget=1000,
            status=1,  # Active
            dao=cls.dao1,
            progress=Decimal("10.0"),
        )
        Task.objects.create(
            campaign=cls.campaign1, description="SIT1", type=1, reward=5, quantity=2
        )
        Task.objects.create(
            campaign=cls.campaign1, description="SIT2", type=1, reward=5, quantity=3
        )

        cls.campaign2 = Campaign.objects.create(
            name="Summer Drive",
            description="Campaign for summer.",
            budget=2000,
            status=2,  # Planning
            dao=cls.dao2,
            progress=Decimal("0.0"),
        )
        Task.objects.create(
            campaign=cls.campaign2, description="SDT1", type=1, reward=10, quantity=5
        )

        cls.campaign3 = Campaign.objects.create(
            name="Autumn Push",
            description="Campaign for autumn.",
            budget=Decimal("1500.00"),
            status=3,  # Completed
            dao=cls.dao1,
        )

        cls.user = User.objects.create_user(
            username="campviewuser", eth_address="0xCampViewUser1"
        )
        cls.favorite_dao_user = User.objects.create_user(
            username="favdaouser", eth_address="0xFavDaoUser1"
        )
        cls.favorite_dao_user.favorite_daos.add(cls.dao1)  # Favorite DAO Alpha

        cls.list_url = reverse("campaign-list")

    def test_list_campaigns_unauthenticated(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data["count"], 3)

    def test_list_campaigns_data_structure_and_content(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = sorted(response.data["results"], key=lambda x: x["id"])

        # Data for campaign1 (Spring Initiative)
        campaign1_data = next(
            (c for c in response_data if c["id"] == self.campaign1.id), None
        )
        self.assertIsNotNone(campaign1_data)
        self.assertEqual(campaign1_data["name"], "Spring Initiative")
        self.assertEqual(campaign1_data["description"], "Campaign for spring.")
        self.assertEqual(campaign1_data["budget"], "1000.00")
        self.assertEqual(campaign1_data["status"], "Active")
        self.assertEqual(campaign1_data["progress"], "0.0")
        self.assertEqual(campaign1_data["total_tasks"], 2)
        self.assertIsNotNone(campaign1_data["created_at"])
        self.assertEqual(campaign1_data["dao"]["name"], self.dao1.name)
        self.assertIsNone(campaign1_data["dao"]["image"])

        # Data for campaign2 (Summer Drive)
        campaign2_data = next(
            (c for c in response_data if c["id"] == self.campaign2.id), None
        )
        self.assertIsNotNone(campaign2_data)
        self.assertEqual(campaign2_data["name"], "Summer Drive")
        self.assertEqual(campaign2_data["status"], "Planning")
        self.assertEqual(campaign2_data["total_tasks"], 1)
        self.assertEqual(campaign2_data["dao"]["name"], self.dao2.name)
        if self.dao2.image:
            self.assertTrue(
                campaign2_data["dao"]["image"].endswith(self.dao2.image.name)
            )
        else:
            self.assertIsNone(campaign2_data["dao"]["image"])

        # Data for campaign3 (Autumn Push - no tasks)
        campaign3_data = next(
            (c for c in response_data if c["id"] == self.campaign3.id), None
        )
        self.assertIsNotNone(campaign3_data)
        self.assertEqual(campaign3_data["name"], "Autumn Push")
        self.assertEqual(campaign3_data["status"], "Completed")
        self.assertEqual(campaign3_data["total_tasks"], 0)
        self.assertEqual(campaign3_data["dao"]["name"], self.dao1.name)

    def test_list_campaigns_authenticated_favorite_dao_annotation(self):
        self.client.force_authenticate(user=self.favorite_dao_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = sorted(response.data["results"], key=lambda x: x["id"])

        # Campaign 1 is from a favorite DAO
        campaign1_data = next(
            (c for c in response_data if c["id"] == self.campaign1.id), None
        )
        self.assertIsNotNone(campaign1_data)
        self.assertIn("is_from_favorite_dao", campaign1_data)
        self.assertTrue(campaign1_data["is_from_favorite_dao"])

        # Campaign 2 is not from a favorite DAO
        campaign2_data = next(
            (c for c in response_data if c["id"] == self.campaign2.id), None
        )
        self.assertIsNotNone(campaign2_data)
        self.assertIn("is_from_favorite_dao", campaign2_data)
        self.assertFalse(campaign2_data["is_from_favorite_dao"])

        # Campaign 3 is from a favorite DAO
        campaign3_data = next(
            (c for c in response_data if c["id"] == self.campaign3.id), None
        )
        self.assertIsNotNone(campaign3_data)
        self.assertIn("is_from_favorite_dao", campaign3_data)
        self.assertTrue(campaign3_data["is_from_favorite_dao"])

    def test_list_campaigns_unauthenticated_favorite_dao_annotation(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = sorted(response.data["results"], key=lambda x: x["id"])

        # is_from_favorite_dao should be False for all when unauthenticated
        for campaign_data in response_data:
            self.assertIn("is_from_favorite_dao", campaign_data)
            self.assertFalse(campaign_data["is_from_favorite_dao"])

    def test_campaign_view_does_not_support_post(self):
        data = {"name": "New Campaign", "description": "Test", "budget": 100}
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_campaign_view_does_not_support_put(self):
        data = {"name": "Updated Campaign"}
        response = self.client.put(
            f"{self.list_url}{self.campaign1.id}/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response_list_put = self.client.put(self.list_url, data, format="json")
        self.assertEqual(
            response_list_put.status_code, status.HTTP_405_METHOD_NOT_ALLOWED
        )


class CampaignOverviewViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.dao1 = DAO.objects.create(name="DAO Alpha")
        cls.dao2 = DAO.objects.create(name="DAO Beta")

        # Create campaigns with different statuses and budgets
        cls.campaign_active1 = Campaign.objects.create(
            name="Active Campaign 1",
            description="Active 1",
            budget=1000,
            status=2,  # Active
            dao=cls.dao1,
        )
        cls.campaign_active2 = Campaign.objects.create(
            name="Active Campaign 2",
            description="Active 2",
            budget=2000,
            status=2,  # Active
            dao=cls.dao2,
        )
        cls.campaign_completed1 = Campaign.objects.create(
            name="Completed Campaign 1",
            description="Completed 1",
            budget=1500,
            status=3,  # Completed
            dao=cls.dao1,
        )
        cls.campaign_planning1 = Campaign.objects.create(
            name="Planning Campaign 1",
            description="Planning 1",
            budget=500,
            status=1,  # Planning
            dao=cls.dao2,
        )

        # Create tasks with different statuses
        cls.task_active1 = Task.objects.create(
            campaign=cls.campaign_active1,
            description="Task Active 1",
            type=1,
            reward=10,
            quantity=5,
            status=1,  # Active
        )
        cls.task_active2 = Task.objects.create(
            campaign=cls.campaign_active1,
            description="Task Active 2",
            type=1,
            reward=10,
            quantity=5,
            status=1,  # Active
        )
        cls.task_completed1 = Task.objects.create(
            campaign=cls.campaign_completed1,
            description="Task Completed 1",
            type=1,
            reward=10,
            quantity=5,
            status=3,  # Completed
        )
        cls.task_planning1 = Task.objects.create(
            campaign=cls.campaign_planning1,
            description="Task Planning 1",
            type=1,
            reward=10,
            quantity=5,
            status=1,  # Active (Tasks in planning campaigns can still be active)
        )

        cls.overview_url = reverse("campaigns-overview")  # Corrected URL name

    def test_get_campaign_overview_statistics(self):
        response = self.client.get(self.overview_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_active_campaigns = Campaign.objects.filter(status=2).count()
        expected_completed_campaigns = Campaign.objects.filter(status=3).count()
        expected_total_budget = (
            Campaign.objects.aggregate(total=Sum("budget"))["total"] or 0
        )
        expected_total_tasks = Task.objects.filter(status=1).count()

        self.assertEqual(response.data["active_campaigns"], expected_active_campaigns)
        self.assertEqual(
            response.data["completed_campaigns"], expected_completed_campaigns
        )
        self.assertEqual(Decimal(response.data["total_budget"]), expected_total_budget)
        self.assertEqual(response.data["total_tasks"], expected_total_tasks)
