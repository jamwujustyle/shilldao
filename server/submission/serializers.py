from .models import Submission
from rest_framework import serializers
from task.serializers import TaskLiteSerializer  # Added import
from core.models import User
from reward.models import Reward
from django.db import transaction


def drop_proof(representation, instance):
    match instance.proof_type:
        case 1:
            representation.pop("proof_image", None)
            representation.pop("proof_video", None)
        case 2:
            representation.pop("proof_text", None)
            representation.pop("proof_video", None)
        case 3:
            representation.pop("proof_text", None)
            representation.pop("proof_image", None)
    return representation


class SubmitTaskSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "task",
            "user",
            "link",
            "proof_text",
            "proof_image",
            "proof_video",
            "proof_type",
            "status",
            "created_at",
        ]
        read_only_fields = ["status", "user", "created_at"]

    def validate(self, attrs):
        task = attrs.get("task")
        if (
            task and task.status == 2
        ):  # Task.STATUS_CHOICES: (1, "Ongoing"), (2, "Completed")
            raise serializers.ValidationError(
                {
                    "task": "Task is completed, no more submissions allowed."
                }  # Field-specific error
            )

        proof_text = attrs.get("proof_text")
        proof_image = attrs.get("proof_image")
        proof_video = attrs.get("proof_video")
        if not any([proof_text, proof_image, proof_video]):
            raise serializers.ValidationError(
                {
                    "non_field_errors": "At least one proof field (proof_text, proof_image, or proof_video) is required."
                }
            )

        return attrs

    def create(self, validated_data):
        # The task status check is now in validate(), so it's already handled.
        return super().create(validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation = drop_proof(representation, instance)
        return representation


class SubmissionsHistorySerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="get_status_display", read_only=True)
    proof_type = serializers.CharField(source="get_proof_type_display", read_only=True)
    task = TaskLiteSerializer(read_only=True)  # Use TaskLiteSerializer

    class Meta:
        model = Submission
        # fields = "__all__" # Replaced with specific fields to ensure task is handled by TaskLiteSerializer
        fields = [
            "id",
            "user",
            "link",
            "proof_text",
            "proof_image",
            "proof_video",
            "proof_type",
            "status",
            "feedback",
            "created_at",
            "updated_at",
            "task",  # This will now use TaskLiteSerializer
        ]
        read_only_fields = fields  # Make all fields read-only for history

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation = drop_proof(representation, instance)
        # Multiplier logic removed as the field is commented out in the model
        return representation


# !: MODERATION SERIALIZERS


class UserSimpleSerializer(serializers.ModelSerializer):
    tier = serializers.CharField(source="get_tier_display", read_only=True)

    class Meta:
        model = User
        fields = ["username", "tier", "image"]
        read_only_fields = ["username", "tier", "image"]


class UserSimpleExtendedSerializer(UserSimpleSerializer):
    approved = serializers.IntegerField(source="approved_count")
    rejected = serializers.IntegerField(source="rejected_count")

    class Meta:
        model = User
        fields = UserSimpleSerializer.Meta.fields + [
            "approved",
            "rejected",
            "eth_address",
        ]


class GradeSubmissionSerializer(serializers.ModelSerializer):
    campaign = serializers.CharField(source="task.campaign.name", read_only=True)
    dao_name = serializers.CharField(source="task.campaign.dao.name", read_only=True)
    description = serializers.CharField(
        source="task.description", read_only=True
    )  # Usually description of task is not changed during grading
    user = serializers.SerializerMethodField()
    # status field for GET will be handled by to_representation
    # For PATCH, we need to accept an integer for status
    status = serializers.ChoiceField(choices=Submission.STATUS_CHOICES, required=False)
    approved_submissions = serializers.IntegerField(read_only=True)
    pending_submissions = serializers.IntegerField(read_only=True)
    rejected_submissions = serializers.IntegerField(read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "status",
            "user",
            "link",
            "proof_image",
            "proof_text",
            "proof_video",
            "proof_type",
            "feedback",
            "created_at",
            # related model field
            "campaign",
            "description",
            "dao_name",
            "approved_submissions",
            "pending_submissions",
            "rejected_submissions",
        ]

    def get_user(self, obj):
        # Pass context to nested serializers to enable full URL generation for ImageField
        context = self.context
        if self.context.get("view_action") == "retrieve":
            user = obj.user
            user.approved_count = getattr(obj, "approved_count", 0)
            user.rejected_count = getattr(obj, "rejected_count", 0)
            return UserSimpleExtendedSerializer(obj.user, context=context).data
        else:
            return UserSimpleSerializer(obj.user, context=context).data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["status"] = instance.get_status_display()
        representation["proof_type"] = instance.get_proof_type_display()
        if self.context.get("view_action") == "patch":
            fields_to_keep = {"id", "status", "feedback"}

            all_keys = list(representation.keys())
            for key in all_keys:
                if key not in fields_to_keep:
                    representation.pop(key, None)

        representation = drop_proof(representation, instance)

        return representation

    def update(self, instance, validated_data):

        with transaction.atomic():
            old_status = instance.status
            instance = super().update(instance, validated_data)
            new_status = instance.status
            if (
                new_status == 2
                and old_status != 2
                and not Reward.objects.filter(submission=instance).exists()
            ):
                task_reward = instance.task.reward
                Reward.objects.get_or_create(
                    user=instance.user,
                    submission=instance,
                    defaults={"reward": task_reward},
                )
        return instance
