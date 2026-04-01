import uuid
from datetime import timedelta

from django.contrib.auth.models import User
from django.core import validators
from django.db import models
from django.utils import timezone


class BidStatus(models.IntegerChoices):
    WINNING = 0
    LOSING = 1
    WON = 2
    LOST = 3
    CANCELLED = 4


class TaskStatus(models.IntegerChoices):
    ACCEPTING_BIDS = 0
    PENDING_COMPLETION = 1
    COMPLETED = 2
    CANCELLED = 3

class Task(models.Model):
    uid = models.IntegerField(unique=True)
    wallet_address = models.CharField(max_length=42)
    title = models.CharField(max_length=100)
    description = models.TextField()
    start_bid_amount = models.IntegerField()
    end_bid_date = models.DateTimeField()
    complete_date = models.DateTimeField()
    created_date = models.DateTimeField(auto_now_add=True)
    finalized = models.BooleanField(default=False)

    def is_editable(self):
        now = timezone.now()
        return not self.finalized and not self.bid_set.exists() and self.end_bid_date > now

    def is_cancellable(self):
        return not self.finalized

    def is_completeable(self):
        now = timezone.now()
        return self.bid_set.filter(cancelled=False).exists() and now >= self.end_bid_date and not self.finalized

    def is_biddable(self):
        """Return True if the task is not finalized and the current time is before the bid end date."""
        now = timezone.now()
        return not self.finalized and self.end_bid_date > now



class Bid(models.Model):
    uid = models.IntegerField()
    wallet_address = models.CharField(max_length=42)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    amount = models.IntegerField(default=0)
    created_date = models.DateTimeField(auto_now_add=True)
    cancel_requested = models.BooleanField(default=False)
    cancelled = models.BooleanField(default=False)

    class Meta:
        unique_together = ('uid', 'task')


class UserWallet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    wallet_address = models.CharField(max_length=42, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class WalletNonce(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    wallet_address = models.CharField(max_length=42, unique=True)
    nonce = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    def expired(self):
        return timezone.now() - self.created_at > timedelta(minutes=5)


class SmartContractProcessor(models.Model):
    contract_address = models.CharField(max_length=42, unique=True)
    latest_block = models.IntegerField(default=0)