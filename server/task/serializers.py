from rest_framework import serializers
from .models import Task
from campaign.serializers import CampaignSerializer
from campaign.models import Campaign
from django.db import models
from django.utils import timezone
from datetime import datetime


class TaskSerializer(serializers.ModelSerializer):
    campaign = CampaignSerializer()
    type = serializers.CharField(source="get_type_display", read_only=True)
    status = serializers.CharField(source="get_status_display", read_only=True)
    submissions_count = serializers.IntegerField(read_only=True)
    is_from_favorite_dao = serializers.BooleanField(read_only=True, default=False)
    total_rewards = serializers.DecimalField(
        max_digits=32, decimal_places=2, read_only=True
    )

    class Meta:
        model = Task
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Safely access and modify campaign data
        campaign_data = representation.get("campaign")
        if isinstance(campaign_data, dict):
            campaign_data.pop(
                "budget", None
            )  # Remove budget from campaign representation

            # Safely access and modify DAO data within campaign
            dao_data = campaign_data.get("dao")
            if isinstance(dao_data, dict):
                dao_data.pop("name", None)  # Remove name from DAO representation

        return representation


class TaskLiteSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Task
        fields = ("id", "description", "reward", "type")


class TaskCreateSerializer(serializers.ModelSerializer):
    campaign = serializers.PrimaryKeyRelatedField(queryset=Campaign.objects.all())
    deadline = serializers.DateField(
        input_formats=["%Y-%m-%d"], required=False, allow_null=True
    )

    class Meta:
        model = Task
        fields = (
            "description",
            "type",
            "reward",
            "quantity",
            "deadline",
            "campaign",
        )

    def validate_campaign(self, value):
        # Check if the user creating the task is the creator of the DAO associated with the campaign
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            if value.dao.created_by != request.user:
                raise serializers.ValidationError(
                    "You can only create tasks for campaigns belonging to DAOs you created."
                )
        return value

    def validate(self, data):
        reward = data.get("reward")
        campaign = data.get("campaign")
        quantity = data.get("quantity")

        if not all([reward, quantity, campaign]):
            raise serializers.ValidationError(
                "Reward, quantity, and campaign are required"
            )
        if reward <= 0 or quantity <= 0:  # Corrected condition for positive check
            raise serializers.ValidationError(
                "Reward and quantity must be positive numbers."
            )

        # Calculate the total budget already allocated to existing tasks for this campaign
        # Exclude the current task if it's an update operation
        existing_tasks_total_cost = 0
        if self.instance:  # If it's an update operation
            existing_tasks_total_cost = (
                campaign.tasks.exclude(pk=self.instance.pk)
                .aggregate(
                    total_cost=models.Sum(models.F("reward") * models.F("quantity"))
                )
                .get("total_cost")
                or 0
            )
        else:  # If it's a create operation
            existing_tasks_total_cost = (
                campaign.tasks.aggregate(
                    total_cost=models.Sum(models.F("reward") * models.F("quantity"))
                ).get("total_cost")
                or 0
            )

        new_task_total_cost = reward * quantity
        total_allocated_budget = existing_tasks_total_cost + new_task_total_cost

        if total_allocated_budget > campaign.budget:
            raise serializers.ValidationError(
                f"Total reward for all tasks ({total_allocated_budget}) exceeds the campaign budget ({campaign.budget}). Remaining budget: {campaign.budget - existing_tasks_total_cost}"
            )

        return data

    # to_internal_value method removed as model field is now DateField
    # and serializer field is DateField, so direct assignment works.
