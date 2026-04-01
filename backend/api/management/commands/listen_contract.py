from django.core.management.base import BaseCommand
import time
from web3 import Web3

from api.models import SmartContractProcessor, Task, Bid
from datetime import datetime, timezone

contract_address = "0xd05760a5d9ca414252EdAb18A2023b6A12F40dcA"
abi = '[{"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": false, "inputs": [{"indexed": false, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"}], "name": "LogCancelBid", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "LogCancelTask", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "LogCompleteTask", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": false, "internalType": "string", "name": "title", "type": "string"}, {"indexed": false, "internalType": "string", "name": "description", "type": "string"}, {"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "startAmount", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "bidEndDate", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "completeDate", "type": "uint256"}], "name": "LogCreateTask", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"}, {"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "date", "type": "uint256"}, {"indexed": true, "internalType": "address", "name": "owner", "type": "address"}], "name": "LogPlaceBid", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "startAmount", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "bidEndDate", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "completeDate", "type": "uint256"}], "name": "LogUpdateTask", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "oldOwner", "type": "address"}, {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}], "name": "OwnerSet", "type": "event"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "uint256", "name": "bidId", "type": "uint256"}], "name": "cancelBid", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "cancelTask", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}], "name": "changeOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "completeTask", "outputs": [], "stateMutability": "payable", "type": "function"}, {"inputs": [{"internalType": "string", "name": "title", "type": "string"}, {"internalType": "string", "name": "description", "type": "string"}, {"internalType": "uint256", "name": "bidEndDate", "type": "uint256"}, {"internalType": "uint256", "name": "completeDate", "type": "uint256"}], "name": "createTask", "outputs": [], "stateMutability": "payable", "type": "function"}, {"inputs": [], "name": "getOwner", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "uint256", "name": "bidAmount", "type": "uint256"}], "name": "placeBid", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "uint256", "name": "startAmount", "type": "uint256"}, {"internalType": "uint256", "name": "bidEndDate", "type": "uint256"}, {"internalType": "uint256", "name": "completeDate", "type": "uint256"}], "name": "updateTask", "outputs": [], "stateMutability": "nonpayable", "type": "function"}]'
class Command(BaseCommand):
    help = 'Listen for contract events and update database'

    def handle(self, *args, **kwargs):
        Task.objects.all().delete()
        SmartContractProcessor.objects.all().delete()

        self.w3 = Web3(Web3.LegacyWebSocketProvider("ws://127.0.0.1:7545"))
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to Ethereum node")

        self.contract = self.w3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=abi)
        self.process_logs()

        # Create filters for real-time listening
        create_task_filter = self.contract.events.LogCreateTask.create_filter(from_block='latest')
        cancel_task_filter = self.contract.events.LogCancelTask.create_filter(from_block='latest')
        update_task_filter = self.contract.events.LogUpdateTask.create_filter(from_block='latest')
        place_bid_filter = self.contract.events.LogPlaceBid.create_filter(from_block='latest')
        cancel_bid_filter = self.contract.events.LogCancelBid.create_filter(from_block='latest')
        complete_task_filter = self.contract.events.LogCompleteTask.create_filter(from_block='latest')

        self.stdout.write(self.style.SUCCESS("Listening for events..."))
        while True:
            process_create_task_events(create_task_filter.get_new_entries())
            process_cancel_task_events(cancel_task_filter.get_new_entries())
            process_update_task_events(update_task_filter.get_new_entries())
            process_place_bid_events(place_bid_filter.get_new_entries())
            process_cancel_bid_events(cancel_bid_filter.get_new_entries())
            process_complete_task_events(complete_task_filter.get_new_entries())
            time.sleep(5)

    def process_logs(self):
        processor, _ = SmartContractProcessor.objects.get_or_create(contract_address=self.contract.address)
        start_block = processor.latest_block
        end_block = self.w3.eth.block_number
        batch_size = 50
        current = start_block
        while current <= end_block:
            batch_end = min(current + batch_size - 1, end_block)
            create_events = self.contract.events.LogCreateTask.get_logs(from_block=current, to_block=batch_end)
            cancel_events = self.contract.events.LogCancelTask.get_logs(from_block=current, to_block=batch_end)
            update_events = self.contract.events.LogUpdateTask.get_logs(from_block=current, to_block=batch_end)
            create_bid_events = self.contract.events.LogPlaceBid.get_logs(from_block=current, to_block=batch_end)
            cancel_bid_events = self.contract.events.LogCancelBid.get_logs(from_block=current, to_block=batch_end)
            complete_events = self.contract.events.LogCompleteTask.get_logs(from_block=current, to_block=batch_end)

            process_create_task_events(create_events)
            process_cancel_task_events(cancel_events)
            process_update_task_events(update_events)
            process_place_bid_events(create_bid_events)
            process_cancel_bid_events(cancel_bid_events)
            process_complete_task_events(complete_events)

            processor, _ = SmartContractProcessor.objects.get_or_create(contract_address=self.contract.address)
            processor.latest_block = batch_end
            processor.save()

            current = batch_end + 1


def process_create_task_events(events):
    for event in events:
        task = Task.objects.get_or_create(uid=event['args']['taskId'],
                                          title=event['args']['title'],
                                          description=event['args']['description'],
                                          wallet_address=event['args']['owner'].lower(),
                                          start_bid_amount=event['args']['startAmount'],
                                          end_bid_date=datetime.fromtimestamp(event['args']['bidEndDate'],
                                                                              tz=timezone.utc),
                                          complete_date=datetime.fromtimestamp(event['args']['completeDate'],
                                                                               tz=timezone.utc))
        print(f"Synchronized Task: {task}")


def process_cancel_task_events(events):
    for event in events:
        task = Task.objects.get(uid=event['args']['taskId'])
        task.finalized = True
        task.save()
        print(f"Cancelled Task: {task}")


def process_update_task_events(events):
    for event in events:
        task = Task.objects.get(uid=event['args']['taskId'])
        task.status = event['args']['startAmount']
        task.end_bid_date = datetime.fromtimestamp(event['args']['bidEndDate'], tz=timezone.utc)
        task.complete_date = datetime.fromtimestamp(event['args']['completeDate'], tz=timezone.utc)
        task.save()
        print(f"Updated Task: {task}")


def process_place_bid_events(events):
    for event in events:
        task = Task.objects.get(uid=event['args']['taskId'])
        bid, created = Bid.objects.update_or_create(uid=event['args']['id'],
                                           task=task,
                                           defaults={
                                               'wallet_address': event['args']['owner'].lower(),
                                               'amount': event['args']['amount'],
                                               'created_date': datetime.fromtimestamp(event['args']['date'],
                                                                                      tz=timezone.utc)})
        print(f"Placed Bid: {bid}")


def process_cancel_bid_events(events):
    for event in events:
        task = Task.objects.get(uid=event['args']['taskId'])
        bid = Bid.objects.get(uid=event['args']['id'], task=task)
        bid.cancelled = True
        bid.save()
        print(f"Cancelled Bid: {bid}")

def process_complete_task_events(events):
    for event in events:
        task = Task.objects.get(uid=event['args']['taskId'])
        task.finalized = True
        task.save()
        print(f"Completed Task: {task}")