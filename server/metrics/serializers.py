from rest_framework import serializers
from core.models import User
from reward.models import Reward


class DashboardStatisticsSerializer(serializers.Serializer):
    active_shillers = serializers.IntegerField()
    total_campaigns = serializers.IntegerField()
    total_tasks = serializers.IntegerField()

    shill_price_usd = serializers.DecimalField(
        max_digits=20, decimal_places=2, read_only=True
    )

    class Meta:
        extra_kwargs = {
            "active_shillers": {
                "read_only": True,
                "help_text": "Number of active shillers",
            },
            "total_campaigns": {"read_only": True, "help_text": "Number of campaigns"},
            "total_tasks": {
                "read_only": True,
                "help_text": "Number of tasks based on timeframe",
            },
            "shill_price_usd": {
                "read_only": True,
                "help_text": "Current price of SHILL in USD",
            },
        }


class TopShillersSerializer(serializers.ModelSerializer):
    # !: FOR DASHBOARD
    approved_submissions_count = serializers.IntegerField(read_only=True)
    approval_rate = serializers.SerializerMethodField()
    tier = serializers.SerializerMethodField()
    growth = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "approved_submissions_count",
            "image",
            "username",
            "eth_address",
            "tier",
            "approval_rate",
            "growth",
        ]
        read_only_fields = fields

    def get_growth(self, instance):
        return instance.get_progress_to_next_tier_percentage()  # Updated method name

    def get_approval_rate(self, instance):
        if instance.total_submissions_count > 0:
            return round(
                (instance.approved_submissions_count / instance.total_submissions_count)
                * 100,
            )
        return 0.0

    def get_tier(self, instance):
        return instance.get_tier_display()

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if instance.username:
            representation.pop("eth_address", None)
        else:
            representation.pop("username", None)

        return representation


class TopShillersExtendedSerializer(TopShillersSerializer):
    # !: FOR SHILLERS TAB
    role = serializers.CharField(source="get_role_display")
    total_submissions_count = serializers.IntegerField()
    total_rewards = serializers.SerializerMethodField()
    joined_date = serializers.SerializerMethodField()  # Change to SerializerMethodField
    last_approved_task_date = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = TopShillersSerializer.Meta.fields + [
            "is_active",
            "role",
            "joined_date",  # Keep in fields
            "total_submissions_count",
            "total_rewards",
            "last_approved_task_date",
        ]
        read_only_fields = fields

    def get_total_rewards(self, instance):
        return instance.get_total_rewards()

    def get_tier(self, instance):
        return super().get_tier(instance)

    def get_joined_date(self, instance):
        # Format joined_date to show month name and year
        if instance.joined_date:
            return instance.joined_date.strftime("%b %Y")  # e.g., "Oct 2023"
        return None

    def get_last_approved_task_date(self, instance):
        last_approved = (
            instance.submissions.filter(status=2).order_by("-updated_at").first()
        )
        if last_approved:
            return last_approved.updated_at.strftime("%b %d, %Y")
        return None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["eth_address"] = instance.eth_address
        return representation


class CampaignGraphSerializer(serializers.Serializer):
    submissions_count = serializers.IntegerField(read_only=True)
    tasks_count = serializers.IntegerField(read_only=True)
    month = serializers.CharField(read_only=True)

    class Meta:
        fields = ["submissions_count", "task_count", "month"]


class TierDistributionGraphSerializer(serializers.Serializer):
    name = serializers.CharField()
    value = serializers.IntegerField()


class RewardGraphSerializer(serializers.ModelSerializer):
    month = serializers.CharField(read_only=True)

    class Meta:
        model = Reward
        fields = ["id", "reward", "month"]
        read_only_fields = fields
