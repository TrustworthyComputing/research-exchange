from django.utils import timezone

from api import models
from rest_framework import serializers, exceptions

from api.models import Bid, BidStatus, TaskStatus, Task, UserWallet


class BidSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_uid = serializers.IntegerField(source='task.uid', read_only=True)
    author = serializers.SerializerMethodField()
    is_lowest = serializers.SerializerMethodField()
    is_winner = serializers.SerializerMethodField()
    is_cancellable = serializers.SerializerMethodField()
    is_payable = serializers.SerializerMethodField()

    class Meta:
        model = Bid
        fields = [
            'uid',
            'amount',
            'created_date',
            'cancel_requested',
            'cancelled',
            'task_uid',
            'task_title',
            'is_lowest',
            'is_winner',
            'is_cancellable',
            'is_payable',
            'author'
        ]

    def get_is_lowest(self, obj):
        # Only consider non-cancelled bids for the task
        lowest_bid = obj.task.bid_set.filter(cancelled=False).order_by('amount').first()
        return lowest_bid and lowest_bid.uid == obj.uid

    def get_is_winner(self, obj):
        now = timezone.now()
        return  self.get_is_lowest(obj) and now > obj.task.end_bid_date

    def get_is_cancellable(self, obj):
        return not obj.task.finalized

    def get_is_payable(self, obj):
        return not obj.task.finalized and self.get_is_winner(obj)

    def get_author(self, obj):
        try:
            wallet = UserWallet.objects.get(wallet_address=obj.wallet_address)
            return wallet.user.username
        except UserWallet.DoesNotExist:
            return None


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='uid', read_only=True)
    author = serializers.SerializerMethodField()
    current_bid = serializers.SerializerMethodField()
    total_bids = serializers.SerializerMethodField()
    end_bid_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField(source='complete_date')
    is_editable = serializers.SerializerMethodField()
    is_cancellable = serializers.SerializerMethodField()
    is_completeable = serializers.SerializerMethodField()
    is_biddable = serializers.SerializerMethodField()
    user_bid = serializers.SerializerMethodField()
    finalized = serializers.BooleanField()

    class Meta:
        model = Task
        # Include all relevant fields
        fields = [
            'id',
            'author',
            'title',
            'description',
            'start_bid_amount',
            'current_bid',
            'total_bids',
            'end_bid_date',
            'end_date',
            'is_editable',
            'is_cancellable',
            'is_completeable',
            'is_biddable',
            'user_bid',
            'finalized'
        ]

    def get_author(self, obj):
        try:
            user_wallet = UserWallet.objects.get(wallet_address=obj.wallet_address)
            return user_wallet.user.username
        except UserWallet.DoesNotExist:
            return obj.wallet_address

    def get_current_bid(self, obj):
        # Return the highest bid amount, or 0 if no bids
        highest_bid = obj.bid_set.filter(cancelled=False).order_by('-amount').first()
        return highest_bid.amount if highest_bid else obj.start_bid_amount

    def get_total_bids(self, obj):
        # Count all bids that are not cancelled
        return obj.bid_set.filter(cancelled=False).count()

    def get_is_editable(self, obj):
        if not obj.is_editable():
            return False

        request = self.context.get('request', None)
        if not request or not request.user.is_authenticated:
            return False

        return UserWallet.objects.filter(user=request.user, wallet_address=obj.wallet_address).exists()

    def get_is_biddable(self, obj):
        if not obj.is_biddable():
            return False

        request = self.context.get('request', None)
        if not request or not request.user.is_authenticated:
            return False

        return not UserWallet.objects.filter(user=request.user, wallet_address=obj.wallet_address).exists()

    def get_is_cancellable(self, obj):
        if not obj.is_cancellable():
            return False

        request = self.context.get('request', None)
        if not request or not request.user.is_authenticated:
            return False

        return UserWallet.objects.filter(user=request.user, wallet_address=obj.wallet_address).exists()

    def get_is_completeable(self, obj):
        if not obj.is_completeable():
            return False

        request = self.context.get('request', None)
        if not request or not request.user.is_authenticated:
            return False

        return UserWallet.objects.filter(user=request.user, wallet_address=obj.wallet_address).exists()

    def get_user_bid(self, obj):
        request = self.context.get('request', None)
        if not request:
            return None
        user_wallets = UserWallet.objects.filter(user=request.user).values_list('wallet_address', flat=True)
        bid = obj.bid_set.filter(wallet_address__in=user_wallets, cancelled=False).first()
        return BidSerializer(bid).data if bid else None



class WalletRequestNonceSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=42)


class WalletVerifySignatureSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=42)
    signature = serializers.CharField()
