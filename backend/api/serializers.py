from django.utils import timezone

from api import models
from rest_framework import serializers, exceptions

from api.models import Bid, BidStatus, TaskStatus


class TaskSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    current_bid = serializers.SerializerMethodField()
    total_bids = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    def get_author(self, obj):
        return obj.created_by.username

    def get_current_bid(self, obj):
        start_bid_amount = obj.start_bid_amount
        bids = models.Bid.objects.filter(task=obj.id).order_by('amount')[:1]
        if not bids:
            return start_bid_amount

        return bids[0].amount

    def get_total_bids(self, obj):
        return models.Bid.objects.filter(task=obj.id).count()

    def get_status(self, obj):
        if obj.cancelled:
            return TaskStatus.CANCELLED

        if obj.completed:
            return TaskStatus.COMPLETED

        auction_active = timezone.now() < obj.end_bid_date
        if auction_active:
            return TaskStatus.ACCEPTING_BIDS

        deadline_over = timezone.now() - obj.end_date
        if not deadline_over:
            return TaskStatus.PENDING_COMPLETION

        return TaskStatus.CANCELLED

    def validate(self, data):
        if timezone.now() >= data['end_bid_date']:
            raise exceptions.ValidationError({'end_bid_date': 'Bid end date must be placed in the future.'})

        if data['end_date'] <= data['end_bid_date']:
            raise exceptions.ValidationError({'end_date': 'End date must be after end bid date.'})

        return data

    class Meta:
        model = models.Task
        fields = [
            'id',
            'author',
            'title',
            'description',
            'start_bid_amount',
            'end_bid_date',
            'end_date',
            'current_bid',
            'total_bids',
            'created_date',
            'created_by',
            'completed',
            'status'
        ]
        read_only_fields = [
            'created_date',
            'created_by'
        ]


class BidSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    task_name = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    def get_author(self, obj):
        return obj.created_by.username

    def get_task_name(self, obj):
        return obj.task.title

    def get_status(self, obj):
        if obj.cancelled:
            return BidStatus.CANCELLED
        task_bids = Bid.objects.filter(task=obj.task)
        lowest_bid = min(task_bids, key=lambda bid: bid.amount)
        winning = lowest_bid.id == obj.id
        auction_over = timezone.now() >= obj.task.end_bid_date
        if winning:
            if auction_over:
                return BidStatus.WON
            else:
                return BidStatus.WINNING
        else:
            if auction_over:
                return BidStatus.LOST
            else:
                return BidStatus.LOSING

    def __init__(self, *args, **kwargs):
        # Call parent constructor
        super().__init__(*args, **kwargs)
        if self.instance:
            self.fields['amount'].required = False
            self.fields['cancelled'].required = False
            self.fields['cancel_requested'].required = False

    class Meta:
        model = models.Bid
        fields = [
            'id',
            'task',
            'author',
            'created_date',
            'created_by',
            'task_name',
            'amount',
            'cancelled',
            'cancel_requested',
            'status'
        ]
        read_only_fields = [
            'created_date',
            'created_by'
        ]
