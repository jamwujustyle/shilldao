from rest_framework import serializers
from .models import Campaign
from dao.models import DAO
from django.db.models import Sum
from task.models import Task

# TODO: ADD FILEVALIDATOR TO USER IMAGE TOO


class DAOSimpleSerializer(serializers.ModelSerializer):
    """NESTED SERIALIZER DONT USE FOR VIEWS"""

    class Meta:
        model = DAO
        fields = ["name", "image"]
        read_only_fields = ["name", "image"]


class CampaignOverviewSerializer(serializers.Serializer):
    active_campaigns = serializers.SerializerMethodField()
    completed_campaigns = serializers.SerializerMethodField()
    total_budget = serializers.SerializerMethodField()
    total_tasks = serializers.SerializerMethodField()

    def get_active_campaigns(self, obj):
        return Campaign.objects.filter(status=2).count()

    def get_completed_campaigns(self, obj):
        return Campaign.objects.filter(status=3).count()

    def get_total_budget(self, obj):
        return Campaign.objects.aggregate(total=Sum("budget"))["total"] or 0

    def get_total_tasks(self, obj):
        return Task.objects.filter(status=1).count()


class CampaignSerializer(serializers.ModelSerializer):
    """
    This serializer works tightly with django admin panel to display campaign data. edits are disabled here for the data insertion takes places in django admin panel

    Args:
        serializers (_type_): _description_
    """

    status = serializers.CharField(source="get_status_display", read_only=True)
    total_tasks = serializers.IntegerField(read_only=True)
    dao = DAOSimpleSerializer(read_only=True)
    is_from_favorite_dao = serializers.BooleanField(
        read_only=True, default=False
    )  # Added field

    class Meta:
        model = Campaign

        fields = (
            "id",
            "name",
            "description",
            "progress",
            "status",
            "created_at",
            "total_tasks",
            "dao",
            "budget",
            "is_from_favorite_dao",  # Added field to Meta
        )

        extra_kwargs = {
            "name": {
                "read_only": True,
            },
            "description": {"read_only": True},
            "progress": {"read_only": True, "allow_null": True},
            "status": {
                "default": "Active",
            },
            "created_at": {"read_only": True},
        }


class TaskSimpleSerializer(serializers.ModelSerializer):
    submissions = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "description",
            "type",
            "reward",
            "quantity",
            "deadline",
            "status",
            "created_at",
            "submissions",
        ]

    def get_submissions(self, obj):
        return obj.submissions.count()


class MyCampaignsSerializer(CampaignSerializer):
    tasks = TaskSimpleSerializer(many=True, read_only=True)
    budget = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = CampaignSerializer.Meta.fields + ("tasks",)

    def get_budget(self, obj):
        total_tasks_cost = sum(task.reward * task.quantity for task in obj.tasks.all())
        return obj.budget - total_tasks_cost

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation.pop("is_from_favorite_dao")

        return representation


class CampaignCreateSerializer(serializers.ModelSerializer):
    dao = serializers.PrimaryKeyRelatedField(queryset=DAO.objects.all())

    class Meta:
        model = Campaign
        fields = (
            "name",
            "description",
            "budget",
            "status",
            "dao",
        )

    def validate_dao(self, value):
        # Check if the user creating the campaign is the creator of the DAO
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            if value.created_by != request.user:
                raise serializers.ValidationError(
                    "You can only create campaigns for DAOs you created."
                )
        return value
