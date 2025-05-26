from rest_framework import serializers
from .models import DAO
from campaign.models import Campaign
from .network_validator import validate_network


class CampaignSimpleSerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            "id",
            "name",
            "status",
            "budget",
            "description",
            "created_at",
            "progress",
        ]
        read_only_fields = fields

    def get_created_at(self, obj):
        return obj.created_at.strftime("%B %Y")


class DAOExplorerSerializer(serializers.ModelSerializer):
    campaigns = CampaignSimpleSerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()
    created_by = serializers.CharField(source="created_by.eth_address", read_only=True)

    class Meta:
        model = DAO
        fields = [
            "id",
            "name",
            "image",
            "description",  # Added description
            "website",
            "social_links",  # Keep social_links writable
            "create_dao",
            "created_by",
            "balance",
            "created_at",
            "campaigns",
            "is_favorited",
            "network",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "balance",
            "created_at",
            "campaigns",
            "is_favorited",
            "created_by",
        ]

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if (
            request
            and hasattr(request, "user")
            and request.user
            and request.user.is_authenticated
        ):
            return request.user.favorite_daos.filter(pk=obj.pk).exists()
        return False

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        validate_network(validated_data["network"])
        return super().create(validated_data)

    def validate_social_links(self, value: dict):
        for platform, url in value.items():
            if not url.startswith("http://") and not url.startswith("https://"):
                raise serializers.ValidationError("Invalid URL")
        return value

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get("request")
        if instance.image and hasattr(instance.image, "url"):
            if request:
                representation["image"] = request.build_absolute_uri(instance.image.url)
            else:
                representation["image"] = instance.image.url
        elif "image" in representation and representation["image"] is None:
            representation["image"] = None

        # Ensure social_links is always a dictionary, even if null in DB
        if "social_links" in representation and representation["social_links"] is None:
            representation["social_links"] = {}

        return representation


class MyDAOsSerializer(DAOExplorerSerializer):
    class Meta:
        model = DAO
        fields = DAOExplorerSerializer.Meta.fields

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        representation.pop("is_favorited", None)  # Corrected field name
        return representation


class MyDAOEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = DAO
        fields = ["description", "image", "website", "social_links"]

    def validate_social_links(self, value: dict):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Invalid social_links format.")

        for platform, url in value.items():
            if not isinstance(url, str) or not (
                url.startswith("http://") or url.startswith("https://")
            ):
                raise serializers.ValidationError(f"Invalid URL for {platform}")
        return value

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
