from django.contrib.auth.models import User
from django.core import validators
from django.db import models

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
    title = models.CharField(max_length=100)
    description = models.TextField()
    start_bid_amount = models.IntegerField(validators=[validators.MinValueValidator(0)])
    end_bid_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_date = models.DateTimeField(auto_now_add=True)
    edited_date = models.DateTimeField(auto_now_add=True)
    cancelled = models.BooleanField(default=False)
    completed = models.BooleanField(default=False)


class Bid(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    amount = models.IntegerField(validators=[validators.MinValueValidator(0)], default=0)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_date = models.DateTimeField(auto_now_add=True)
    edited_date = models.DateTimeField(auto_now_add=True)
    cancel_requested = models.BooleanField(default=False)
    cancelled = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=('created_by', 'task'), name='unique_together'),
        ]
