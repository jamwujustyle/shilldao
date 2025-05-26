from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied


class IsModerator(BasePermission):
    """
    Allows access only to authenticated users who are moderators.
    """

    message = (
        "You do not have permission to perform this action as you are not a moderator."
    )

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            # For unauthenticated users, DRF's default authentication classes
            # would typically raise NotAuthenticated first.
            # If somehow an unauthenticated user reaches here, deny permission.
            # Or, rely on IsAuthenticated being listed first in view's permission_classes.
            # Raising NotAuthenticated explicitly might be clearer if IsAuthenticated isn't guaranteed.
            # For simplicity, if IsAuthenticated is always used alongside, this check is redundant.
            # However, if IsModerator is used alone, this is important.
            # Let's assume IsAuthenticated is also used, so user is authenticated.
            # If not, the following check will fail safely for AnonymousUser.
            pass  # Fall through to role check, which will fail for AnonymousUser due to hasattr

        if (
            not hasattr(user, "role") or user.role != 2
        ):  # User.ROLE_CHOICES[1][0] is 2 for Moderator
            raise PermissionDenied(self.message)

        return True
