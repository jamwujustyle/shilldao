from rest_framework import serializers
from core.models import User
from django.core.validators import RegexValidator
from reward.models import Reward


class UsernameSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        max_length=15,
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z0-9_]+$",
                message="Username can only contain letters, numbers, and underscores.",
            )
        ],
    )

    class Meta:
        model = User
        fields = ["username"]


class UserImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ["image"]

        def validate_image(self, image):
            max_size_mb = 1
            if image.size > max_size_mb * 1024 * 1024:
                raise serializers.ValidationError("Image size must be less than 1 mb")
            return image


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="get_role_display")

    class Meta:
        model = User
        fields = ["username", "image", "role"]
        read_only_fields = ["username", "image", "role"]


class UserRewardsSerializer(serializers.ModelSerializer):
    reward_amount = serializers.DecimalField(
        source="reward", max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Reward
        fields = ["id", "reward_amount", "is_paid", "created_at", "submission"]
        read_only_fields = fields
