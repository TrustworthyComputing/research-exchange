from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user

    def has_permission(self, request, view):
        return super().has_permission(request, view)


class CanUpdateBidOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow task authors or bid authors of a bid to edit it.
    """

    def has_object_permission(self, request, view, obj):
        return (request.method in permissions.SAFE_METHODS
                or obj.task.created_by == request.user
                or obj.created_by == request.user)
