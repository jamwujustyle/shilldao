from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from decimal import Decimal
from django.utils import timezone
import datetime

from core.models import User
from campaign.models import Campaign
from task.models import Task
from submission.models import Submission
from reward.models import Reward
from dao.models import DAO

from unittest.mock import patch  # For mocking timezone.now()


class MetricsViewTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.dao = DAO.objects.create(name="Metrics DAO")

        fixed_setup_time = timezone.make_aware(
            datetime.datetime(2023, 10, 26, 12, 0, 0)
        )

        # Users - joined_date is not auto_now_add, so direct assignment works
        cls.user1 = User.objects.create_user(
            username="metricuser1",
            eth_address="0xMUser1",
            role=1,
            tier=1,
            joined_date=fixed_setup_time - datetime.timedelta(days=40),
        )
        cls.user2 = User.objects.create_user(
            username="metricuser2",
            eth_address="0xMUser2",
            role=1,
            tier=2,
            joined_date=fixed_setup_time - datetime.timedelta(days=10),
        )
        cls.user3_inactive = User.objects.create_user(
            username="metricuser3",
            eth_address="0xMUser3",
            role=1,
            tier=1,
            is_active=False,
            joined_date=fixed_setup_time - datetime.timedelta(days=5),
        )
        cls.user4_no_subs = User.objects.create_user(
            username="metricuser4",
            eth_address="0xMUser4",
            role=1,
            tier=1,
            joined_date=fixed_setup_time - datetime.timedelta(days=2),
        )

        # Campaigns - created_at is auto_now_add
        campaign_data = [
            {
                "name": "Old Campaign",
                "status": 3,
                "created_at_val": fixed_setup_time - datetime.timedelta(days=60),
            },
            {
                "name": "MonthOld Campaign",
                "status": 1,
                "created_at_val": fixed_setup_time - datetime.timedelta(days=25),
            },
            {
                "name": "WeekOld Campaign",
                "status": 1,
                "created_at_val": fixed_setup_time - datetime.timedelta(days=5),
            },
            {
                "name": "Recent Campaign",
                "status": 1,
                "created_at_val": fixed_setup_time - datetime.timedelta(hours=12),
            },
            {
                "name": "Recent Completed Campaign",
                "status": 3,
                "created_at_val": fixed_setup_time - datetime.timedelta(hours=10),
            },
        ]
        cls.campaign_objects = {}
        for i, c_data in enumerate(campaign_data):
            camp = Campaign.objects.create(
                name=c_data["name"],
                description="D",
                budget=100,
                dao=cls.dao,
                status=c_data["status"],
            )
            Campaign.objects.filter(pk=camp.pk).update(
                created_at=c_data["created_at_val"]
            )
            camp.refresh_from_db()  # Ensure the instance has the updated created_at
            cls.campaign_objects[c_data["name"]] = camp

        cls.camp_past_far = cls.campaign_objects["Old Campaign"]
        cls.camp_past_month = cls.campaign_objects["MonthOld Campaign"]
        cls.camp_past_week = cls.campaign_objects["WeekOld Campaign"]
        cls.camp_recent = cls.campaign_objects["Recent Campaign"]
        cls.camp_completed_recent = cls.campaign_objects["Recent Completed Campaign"]

        # Tasks - created_at is auto_now_add
        task_data = [
            {
                "campaign": cls.camp_past_month,
                "description": "T1",
                "created_at_val": fixed_setup_time - datetime.timedelta(days=24),
            },
            {
                "campaign": cls.camp_past_week,
                "description": "T2",
                "created_at_val": fixed_setup_time - datetime.timedelta(days=4),
            },
            {
                "campaign": cls.camp_recent,
                "description": "T3",
                "created_at_val": fixed_setup_time - datetime.timedelta(hours=11),
            },
            {
                "campaign": cls.camp_recent,
                "description": "T4",
                "status": 2,
                "created_at_val": fixed_setup_time - datetime.timedelta(hours=10),
            },
        ]
        cls.task_objects = {}
        for i, t_data in enumerate(task_data):
            task = Task.objects.create(
                campaign=t_data["campaign"],
                description=t_data["description"],
                type=1,
                reward=1,
                quantity=10,
                status=t_data.get("status", 1),
            )
            Task.objects.filter(pk=task.pk).update(created_at=t_data["created_at_val"])
            task.refresh_from_db()
            cls.task_objects[t_data["description"]] = task

        cls.task_cpm_t1 = cls.task_objects["T1"]
        cls.task_cpw_t1 = cls.task_objects["T2"]
        cls.task_cr_t1 = cls.task_objects["T3"]
        cls.task_cr_t2_completed = cls.task_objects["T4"]

        # Submissions - created_at is auto_now_add
        submission_data = [
            {
                "task": cls.task_cpm_t1,
                "user": cls.user1,
                "status": 2,
                "created_at_val": fixed_setup_time - datetime.timedelta(days=20),
            },
            {
                "task": cls.task_cpw_t1,
                "user": cls.user1,
                "status": 2,
                "created_at_val": fixed_setup_time - datetime.timedelta(days=3),
            },
            {
                "task": cls.task_cr_t1,
                "user": cls.user1,
                "status": 1,
                "created_at_val": fixed_setup_time - datetime.timedelta(hours=5),
            },
            {
                "task": cls.task_cr_t1,
                "user": cls.user2,
                "status": 2,
                "created_at_val": fixed_setup_time - datetime.timedelta(hours=6),
            },
            {
                "task": cls.task_cpw_t1,
                "user": cls.user2,
                "status": 3,
                "created_at_val": fixed_setup_time - datetime.timedelta(days=2),
            },
        ]
        for i, s_data in enumerate(submission_data):
            sub = Submission.objects.create(
                task=s_data["task"],
                user=s_data["user"],
                link=f"l{i}.com",
                proof_text="p",
                proof_type=1,
                status=s_data["status"],
            )
            Submission.objects.filter(pk=sub.pk).update(
                created_at=s_data["created_at_val"]
            )
            # No need to refresh_from_db for submissions if not directly used by name later in tests

        # Rewards - created_at is auto_now_add
        Reward.objects.create(
            user=cls.user1,
            reward=Decimal("10.00"),
            created_at=timezone.make_aware(datetime.datetime(2023, 10, 10)),
        )
        Reward.objects.create(
            user=cls.user2,
            reward=Decimal("20.00"),
            created_at=timezone.make_aware(datetime.datetime(2023, 10, 20)),
        )

    # --- DashboardStatisticsView Tests ---
    @patch("django.utils.timezone.now")
    def run_dashboard_stats_test(
        self,
        timeframe_param,
        expected_active_shillers,
        expected_campaigns,
        expected_tasks,
        mock_now,
    ):
        # Consistent "now" for timeframe calculations
        fixed_now = timezone.make_aware(
            datetime.datetime(2023, 10, 26, 12, 0, 0)
        )  # Example fixed date
        mock_now.return_value = fixed_now

        url = reverse("statistics-overview")
        response = self.client.get(url, {"timeframe": timeframe_param})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(
            data["active_shillers"],
            expected_active_shillers,
            f"Active shillers mismatch for {timeframe_param}",
        )
        self.assertEqual(
            data["total_campaigns"],
            expected_campaigns,
            f"Total campaigns mismatch for {timeframe_param}",
        )
        self.assertEqual(
            data["total_tasks"],
            expected_tasks,
            f"Total tasks mismatch for {timeframe_param}",
        )

    # Note: Expected values for DashboardStatisticsView tests need careful calculation based on setUpTestData and mocked 'now'.
    # These are placeholders and will likely need adjustment.
    def test_dashboard_statistics_daily(self):

        self.run_dashboard_stats_test("daily", 2, 1, 1)

    def test_dashboard_statistics_weekly(self):

        self.run_dashboard_stats_test("weekly", 2, 2, 2)

    def test_dashboard_statistics_monthly(self):

        self.run_dashboard_stats_test("monthly", 2, 3, 3)

    def test_dashboard_statistics_all_time(self):

        self.run_dashboard_stats_test("all", 3, 3, 3)

    # --- TopShillersView & TopShillersExtendedView Tests ---
    def test_top_shillers_view(self):
        url = reverse("top-shillers")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) <= 10)
        # user1: 2 approved. user2: 1 approved.
        # Expected order: user1, user2
        if len(response.data) > 0:
            self.assertEqual(
                response.data[0]["id"], self.user1.id
            )  # user1 has 2 approved
        if len(response.data) > 1:
            self.assertEqual(
                response.data[1]["id"], self.user2.id
            )  # user2 has 1 approved
        for item in response.data:
            self.assertNotIn(
                "total_submissions_count", item
            )  # Not in TopShillersSerializer

    def test_top_shillers_extended_view(self):
        url = reverse("top-shillers-extended")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) <= 10)
        if len(response.data) > 0:
            self.assertEqual(response.data[0]["id"], self.user1.id)
            self.assertIn("total_submissions_count", response.data[0])
            self.assertIn("is_active", response.data[0])
            self.assertIn("role", response.data[0])
            self.assertIn("joined_date", response.data[0])

    # --- Graph View Tests ---
    def test_campaign_graph_view(self):
        url = reverse("campaigns-graph")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Test structure - e.g., list of dicts with 'name', 'tasks', 'submissions'
        # Actual values depend on how TruncMonth groups the setUpTestData
        self.assertIsInstance(response.data, list)
        if response.data:
            item = response.data[0]
            self.assertIn("name", item)  # Month abbreviation
            self.assertIn("tasks", item)
            self.assertIn("submissions", item)

    def test_reward_graph_view(self):
        url = reverse("rewards")  # Name is "rewards"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["rewards"], 30.00)

    def test_tier_distribution_graph_view(self):
        url = reverse("tier-graph")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

        bronze_data = next(
            (item for item in response.data if item["name"] == "Bronze"), None
        )
        silver_data = next(
            (item for item in response.data if item["name"] == "Silver"), None
        )

        self.assertIsNotNone(bronze_data)
        self.assertEqual(bronze_data["value"], 3)
        self.assertIsNotNone(silver_data)
        self.assertEqual(silver_data["value"], 1)
