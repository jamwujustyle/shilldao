from django.test import TestCase
from decimal import Decimal
from django.utils import timezone
import datetime

from core.models import User
from reward.models import Reward
from metrics.serializers import (
    DashboardStatisticsSerializer,
    TopShillersSerializer,
    TopShillersExtendedSerializer,
    CampaignGraphSerializer,
    RewardGraphSerializer,
    TierDistributionGraphSerializer,
)


class MetricsSerializerTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user1 = User.objects.create_user(
            username="shiller1", eth_address="0xShiller1", role=1, tier=1
        )  # Bronze
        cls.user2 = User.objects.create_user(
            username="shiller2",
            eth_address="0xShiller2",
            role=1,
            tier=2,
            image="path/to/shiller2.png",
        )  # Silver
        cls.user3 = User.objects.create_user(
            eth_address="0xShiller3", role=1, tier=1
        )  # No username

        # For TopShillersSerializer - simulate annotated fields
        cls.user1.approved_submissions_count = 10
        cls.user1.total_submissions_count = 20
        # User.calculate_tier_progress() will be called by get_growth, assumes submissions exist for calculation

        cls.user2.approved_submissions_count = 50
        cls.user2.total_submissions_count = 60

        # For TopShillersExtendedSerializer
        cls.user1.is_active = True
        cls.user1.joined_date = timezone.now() - datetime.timedelta(days=30)

        cls.reward1 = Reward.objects.create(
            user=cls.user1,
            reward=Decimal("100.00"),
            created_at=timezone.make_aware(datetime.datetime(2023, 1, 15)),
        )
        cls.reward2 = Reward.objects.create(
            user=cls.user2,
            reward=Decimal("200.50"),
            created_at=timezone.make_aware(datetime.datetime(2023, 2, 10)),
        )

    def test_dashboard_statistics_serializer(self):
        data = {
            "active_shillers": 15,
            "total_campaigns": 5,
            "total_tasks": 25,
            "average_approval_rate": 75.5,
        }
        serializer = DashboardStatisticsSerializer(data)  # Pass as positional/instance
        # self.assertTrue(serializer.is_valid(), serializer.errors) # Not needed
        self.assertEqual(serializer.data["active_shillers"], 15)
        self.assertEqual(serializer.data["total_campaigns"], 5)
        self.assertEqual(serializer.data["total_tasks"], 25)

    def test_top_shillers_serializer(self):
        # Simulate queryset with annotated fields for User1
        # In a real scenario, the view provides these annotations.
        # Here, we've set them directly on the instance in setUpTestData.

        serializer = TopShillersSerializer(instance=self.user1)
        data = serializer.data

        self.assertEqual(data["id"], self.user1.id)
        self.assertEqual(data["approved_submissions_count"], 10)
        self.assertEqual(data["username"], "shiller1")
        self.assertNotIn("eth_address", data)  # Popped because username exists
        self.assertEqual(data["tier"], "Bronze")  # From get_tier_display()
        self.assertEqual(data["approval_rate"], 50.0)  # (10/20)*100
        # self.assertEqual(data['growth'], self.user1.calculate_tier_progress()) # Test this if submissions are set up for user1

        # Test with user3 (no username)
        self.user3.approved_submissions_count = 5
        self.user3.total_submissions_count = 10
        serializer_user3 = TopShillersSerializer(instance=self.user3)
        data_user3 = serializer_user3.data
        self.assertNotIn("username", data_user3)
        self.assertEqual(data_user3["eth_address"], "0xShiller3")

    def test_top_shillers_extended_serializer(self):
        # user1 already has extended attributes set in setUpTestData
        self.user1.total_submissions_count = (
            20  # Ensure this is set for extended serializer
        )

        serializer = TopShillersExtendedSerializer(instance=self.user1)
        data = serializer.data

        self.assertEqual(data["id"], self.user1.id)
        self.assertEqual(data["approved_submissions_count"], 10)
        self.assertEqual(data["username"], "shiller1")
        self.assertEqual(data["eth_address"], "0xShiller1")  # Always included
        self.assertEqual(data["tier"], "Bronze")
        self.assertEqual(data["approval_rate"], 50.0)
        self.assertEqual(data["is_active"], True)
        self.assertEqual(data["role"], "User")  # get_role_display
        self.assertIsNotNone(data["joined_date"])
        self.assertEqual(data["total_submissions_count"], 20)

    def test_campaign_graph_serializer(self):
        data_dict = {"submissions_count": 100, "tasks_count": 20, "month": "Jan"}
        # For read-only serializers.Serializer, pass data as first arg or instance=
        serializer = CampaignGraphSerializer(data_dict)
        # No need to call is_valid() when serializing an object/dict like this.
        self.assertEqual(serializer.data["submissions_count"], 100)
        self.assertEqual(serializer.data["tasks_count"], 20)
        self.assertEqual(serializer.data["month"], "Jan")

    def test_tier_distribution_graph_serializer(self):
        data = {"name": "Bronze", "value": 50}
        serializer = TierDistributionGraphSerializer(
            data
        )  # Pass as positional/instance
        # self.assertTrue(serializer.is_valid(), serializer.errors) # Not needed
        self.assertEqual(serializer.data["name"], "Bronze")
        self.assertEqual(serializer.data["value"], 50)

    def test_reward_graph_serializer(self):
        serializer = RewardGraphSerializer(instance=self.reward1)
        data = serializer.data
        self.assertEqual(data["id"], self.reward1.id)
        self.assertEqual(data["reward"], "100.00")
