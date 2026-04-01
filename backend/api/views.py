import urllib
import uuid
from time import timezone

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from .models import Task, Bid, UserWallet, WalletNonce
from .permissions import IsOwner, CanUpdateBidOrReadOnly
from .serializers import TaskSerializer, BidSerializer, WalletRequestNonceSerializer, WalletVerifySignatureSerializer
from allauth.socialaccount.providers.github import views as github_views
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from rest_framework import generics, permissions, status, views
from django.utils import timezone
from eth_account.messages import encode_defunct
from eth_account import Account


class GitHubLogin(SocialLoginView):
    adapter_class = github_views.GitHubOAuth2Adapter
    callback_url = settings.OAUTH_CALLBACK_URL['github']
    client_class = OAuth2Client


class TaskDetail(generics.RetrieveUpdateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'uid'

    def patch(self, request, *args, **kwargs):
        task = self.get_object()
        if not task.is_editable():
            return Response(
                {"error": "This task cannot be updated."},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = {k: v for k, v in request.data.items() if k in ['title', 'description']}
        serializer = self.get_serializer(task, data=data, partial=True)
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
        # Get all wallet addresses linked to a user
        linked_wallets = UserWallet.objects.values_list('wallet_address', flat=True)
        return Task.objects.filter(
            end_bid_date__gt=now,
            finalized=False,
            wallet_address__in=linked_wallets
        ).order_by('-created_date')


class UserTaskList(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        wallet_addresses = UserWallet.objects.filter(user=self.request.user).values_list('wallet_address', flat=True)
        return Task.objects.filter(wallet_address__in=wallet_addresses).order_by('-created_date')


class TaskBidList(generics.ListAPIView):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uid'

    def get_queryset(self):
        task_id = self.kwargs[self.lookup_field]
        return Bid.objects.filter(task__uid=task_id).order_by('-created_date')


class BidList(generics.ListCreateAPIView):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Get all wallet addresses for the current user
        wallet_addresses = UserWallet.objects.filter(user=self.request.user).values_list('wallet_address', flat=True)
        # Return all bids where the wallet_address is one of the user's wallets
        return Bid.objects.filter(wallet_address__in=wallet_addresses).order_by('-created_date')


class BidDetail(generics.RetrieveUpdateAPIView):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]


class RequestNonceView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WalletRequestNonceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        address = serializer.validated_data["address"].lower()

        nonce = uuid.uuid4().hex
        wallet, created = WalletNonce.objects.get_or_create(user=request.user, wallet_address=address,
                                                            defaults={"nonce": uuid.uuid4().hex})
        if not created and wallet.expired():
            wallet.delete()
            wallet = WalletNonce.objects.create(user=request.user, wallet_address=address, nonce=nonce)

        return Response({"nonce": wallet.nonce})


class VerifySignatureView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WalletVerifySignatureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        address = serializer.validated_data["address"].lower()
        signature = serializer.validated_data["signature"]

        # Check if UserWallet already exists
        if UserWallet.objects.filter(user=request.user, wallet_address=address).exists():
            return Response({"success": True, "address": address})

        # Get the wallet nonce
        try:
            wallet_nonce = WalletNonce.objects.get(user=request.user, wallet_address=address)
        except WalletNonce.DoesNotExist:
            return Response(
                {"error": "This wallet nonce is not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Recover the address from signature
        message = encode_defunct(text=wallet_nonce.nonce)
        recovered = Account.recover_message(message, signature=signature)

        # Delete nonce after use
        wallet_nonce.delete()

        if recovered.lower() == address:
            # Create UserWallet if verification succeeds
            UserWallet.objects.get_or_create(user=request.user, wallet_address=address)
            return Response({"success": True, "address": address})

        return Response(
            {"success": False, "error": "Invalid signature"},
            status=status.HTTP_400_BAD_REQUEST
        )


class CancelBidView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, taskid, bidid):
        # Get the bid object
        try:
            bid = Bid.objects.get(uid=bidid, task__uid=taskid)
        except Bid.DoesNotExist:
            return Response(
                {"error": "This bid is not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if the requesting user owns the bid
        user_wallets = UserWallet.objects.filter(user=request.user)
        #*if bid.wallet_address not in user_wallets:
        #    return Response(
        #        {"error": "You do not own this bid."},
        #        status=status.HTTP_403_FORBIDDEN
        #    )

        # Mark the bid as cancelled
        bid.cancel_requested = True
        bid.save()

        serializer = BidSerializer(bid)
        return Response(serializer.data, status=status.HTTP_200_OK)