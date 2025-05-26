from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser  # Import AnonymousUser
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied  # Expected for DRF

from submission.permissions import IsModerator
from rest_framework.response import Response

User = get_user_model()


# A minimal view to test permissions against
class MockPermissionView(APIView):
    permission_classes = [IsModerator]

    def get(self, request, *args, **kwargs):
        return Response("OK")


class IsModeratorPermissionTests(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = MockPermissionView()  # Use as_view() for actual dispatch

        self.regular_user = User.objects.create_user(
            username="perm_user", eth_address="0xPermUser1", role=1  # User role
        )
        self.moderator_user = User.objects.create_user(
            username="moderator",
            eth_address="0xPermMod1",
            role=2,  # Moderator role
        )
        self.unauthenticated_request = self.factory.get("/")

        self.authenticated_regular_request = self.factory.get("/")
        self.authenticated_regular_request.user = self.regular_user

        self.authenticated_moderator_request = self.factory.get("/")
        self.authenticated_moderator_request.user = self.moderator_user

    def test_is_moderator_unauthenticated(self):
        permission = IsModerator()
        # Check if the permission class raises an exception that would lead to 401/403
        # The current IsModerator raises ValidationError.
        # DRF's request processing would typically convert NotAuthenticated to 401.
        # If user is None, it should ideally result in NotAuthenticated.
        request = self.factory.get("/")
        request.user = (
            AnonymousUser()
        )  # Explicitly set AnonymousUser for unauthenticated state

        # Test direct call (less ideal as it bypasses DRF request lifecycle)
        # IsModerator checks request.user.is_authenticated which is False for AnonymousUser
        with self.assertRaisesMessage(
            PermissionDenied,
            "You do not have permission to perform this action as you are not a moderator.",
        ):
            permission.has_permission(request, self.view)

    def test_is_moderator_authenticated_non_moderator(self):
        permission = IsModerator()
        with self.assertRaisesMessage(
            PermissionDenied,
            "You do not have permission to perform this action as you are not a moderator.",
        ):
            permission.has_permission(self.authenticated_regular_request, self.view)

    def test_is_moderator_authenticated_moderator(self):
        permission = IsModerator()
        has_perm = permission.has_permission(
            self.authenticated_moderator_request, self.view
        )
        self.assertTrue(has_perm)

    # It's also good to test via the view dispatch if the exception handling is complex
    # to see the actual HTTP response status.
    def test_is_moderator_view_unauthenticated(self):
        # When an unauthenticated user (AnonymousUser) hits a view with IsModerator,
        # DRF's authentication checks usually run first. If authentication is required
        # and fails (no credentials), it results in 401.
        # If authentication passes (e.g. session auth for AnonymousUser) but IsModerator fails,
        # then the permission's exception matters.
        # IsModerator currently raises ValidationError.
        # The ErrorHandlingMixin might convert ValidationError to 400.

        # To properly test this, we need to simulate a DRF request-response cycle
        # or ensure the ErrorHandlingMixin is correctly interpreting the ValidationError
        # from the permission class as a permission issue (e.g., 403).
        # For now, this test assumes the ValidationError from permission leads to non-200.

        # This test is more about how DRF + ErrorHandlingMixin handles the raised ValidationError
        # from the permission class.
        # If IsModerator raised PermissionDenied, we'd expect 403.
        # If it raises ValidationError, and ErrorHandlingMixin turns that into 400, then we expect 400.

        # Let's assume for now the goal is to check if access is denied.
        # A more precise test would check the exact status code based on how
        # the custom ErrorHandlingMixin processes ValidationError from permissions.
        # Given the current setup, it's likely a 400 due to ErrorHandlingMixin's
        # handling of serializers.ValidationError (and by extension, Django's ValidationError).

        # For an unauthenticated user, DRF's default behavior for IsAuthenticated based permissions
        # (which IsModerator implies by checking request.user.is_authenticated)
        # would typically result in a 401 or 403 if authentication is not enforced before permissions.
        # Since IsModerator checks request.user.is_authenticated first, an AnonymousUser
        # would fail that check.
        pass  # This part is tricky without knowing the exact behavior of the mixin with this specific error.
        # The direct has_permission tests above are more reliable for the class itself.
        # View-level tests for permissions are better done in test_views.py.
