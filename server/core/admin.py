from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from campaign.models import Campaign
from task.models import Task
from dao.models import DAO


class UserAdmin(BaseUserAdmin):
    ordering = ["id"]
    list_display = ["id", "username", "eth_address"]
    read_only_fields = ["last_login"]
    search_fields = ["eth_address", "username"]

    fieldsets = (
        (
            "identity",
            {
                "classes": ("wide",),
                "fields": ("eth_address", "nickname", "email", "image"),
            },
        ),
        (
            "status",
            {
                "classes": ("wide",),
                "fields": ("status", "role", "is_active"),
            },
        ),
    )

    def list_submissions(self, obj):
        return obj.submissions.count()

    list_submissions.short_description = "Submissions"


class CampaignAdmin(admin.ModelAdmin):
    ordering = ["-created_at"]
    list_display = [
        "name",
        "description",
        "progress",
        "get_status_display",
        "get_dao_name",
        "created_at",
    ]

    # search_fields = []

    fieldsets = (
        (
            "General Information",
            {
                "fields": ("name", "description", "dao", "status"),
                "classes": ("wide", "extrapretty"),  # Optional classes for styling
            },
        ),
        (
            "Progress",
            {
                "fields": ("progress",),
                "classes": ("wide",),
            },
        ),
        # You can add more sections as needed, like DAO image or other fields.
    )

    def get_dao_name(self, obj):
        return obj.dao.name

    get_dao_name.short_description = "DAO"


class TaskAdmin(admin.ModelAdmin):
    list_display = [
        "get_campaign_name",  # Custom method to display the campaign name or dao_name
        "type",  # Show the task type
        "reward",  # Show the reward associated with the task
    ]

    search_fields = [
        "campaign__dao__name",  # Allow searching by dao_name of the related campaign
        "type",
    ]
    list_filter = ["type", "campaign"]  # Allow filtering by type and campaign
    ordering = ["-id"]  # Order by ID, descending

    # Optional: Specify fieldsets for form layout in the admin panel
    fieldsets = (
        (
            "General Information",
            {
                "fields": ("campaign", "type", "reward"),
                "classes": ("wide", "extrapretty"),
            },
        ),
    )

    # Custom method to display the dao_name of the related campaign
    def get_campaign_name(self, obj):
        return obj.campaign.dao.name  # Return the dao_name of the related campaign

    get_campaign_name.admin_order_field = (
        "campaign__dao__name"  # Allows sorting by dao_name
    )
    get_campaign_name.short_description = (
        "Campaign Name"  # Set custom title for the column in the admin panel
    )


class DAOAdmin(admin.ModelAdmin):
    list_display = ["name", "website", "created_at"]
    search_fields = ["name"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "General Info",
            {
                "fields": ("name", "website", "create_dao"),
                "classes": ("wide",),
            },
        ),
        (
            "Media & Social",
            {
                "fields": ("image", "social_links"),
                "classes": ("wide",),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )


admin.site.register(DAO, DAOAdmin)
admin.site.register(User, UserAdmin)
admin.site.register(Campaign, CampaignAdmin)
admin.site.register(Task, TaskAdmin)
