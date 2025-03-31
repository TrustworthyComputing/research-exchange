import urllib
from time import timezone

from rest_framework.response import Response

from .models import Task, Bid
from .permissions import IsOwner, CanUpdateBidOrReadOnly
from .serializers import TaskSerializer, BidSerializer
from allauth.socialaccount.providers.github import views as github_views
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from rest_framework import generics, permissions, status
from django.utils import timezone


class GitHubLogin(SocialLoginView):
    adapter_class = github_views.GitHubOAuth2Adapter
    callback_url = settings.OAUTH_CALLBACK_URL['github']
    client_class = OAuth2Client


class TaskDetail(generics.RetrieveUpdateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'pk'

    def patch(self, request, *args, **kwargs):
        # Retrieve the Task instance based on the primary key (pk)
        task = self.get_object()

        # Check if the task has any associated bids
        if task.bid_set.exists():
            # If there are bids associated with the task, return an error response
            return Response(
                {"error": "This task cannot be updated because there are associated bids."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If no bids are associated, proceed with the update
        serializer = self.get_serializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TaskList(generics.ListCreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        now = timezone.now()
        return Task.objects.filter(end_bid_date__gt=now, cancelled=False).order_by('-created_date')


class UserTaskList(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(created_by=self.request.user).order_by('-created_date')


class TaskBidList(generics.ListAPIView):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bid.objects.filter(task=self.kwargs[self.lookup_field])


class BidList(generics.ListCreateAPIView):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bid.objects.filter(created_by=self.request.user)


class BidDetail(generics.RetrieveUpdateAPIView):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

