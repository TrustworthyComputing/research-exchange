// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "contracts/1_Owner.sol";

contract App is Owner {

	struct Task {
		uint id;
		address owner;
		uint256 startAmount;
		uint256 depositAmount;
		uint256 bidEndDate;
		bool finalized;
		uint bidCounter;
        Bid minBid;
		mapping(uint => Bid) bids;
	}
	
	struct Bid {
		uint id;
		uint256 amount;
		uint256 date;
        bool cancelled;
		address owner;
	}

    event LogCreateTask(
        uint indexed taskId,
        address indexed owner,
        uint256 startAmount,
        uint256 depositAmount,
        uint bidEndDate
    );

    event LogDepositTask(uint indexed taskId);

	event LogCancelTask(uint indexed taskId);

    event LogCompleteTask(uint indexed taskId);

	event LogPlaceBid(
		uint indexed id,
		uint indexed taskId,
		uint256 amount,
		uint256 date,
		address indexed owner
	);

    event LogCancelBid(uint indexed id);

	mapping (uint => Task) public tasks;
	uint taskCounter;

	function createTask(address taskOwner, uint256 startAmount, uint256 bidEndDate) public isOwner {
		require(block.timestamp > bidEndDate);

		taskCounter++;
        tasks[taskCounter].id = taskCounter;
        Task storage task = tasks[taskCounter];
        task.owner = taskOwner;
        task.startAmount = startAmount;
        task.depositAmount = 0;
        task.bidEndDate = bidEndDate;
        task.bidCounter = 0;
        task.finalized = false;
        emit LogCreateTask(taskCounter, msg.sender, startAmount, startAmount, bidEndDate);
	}

	function depositTask(uint taskId) public payable {
		require(taskId > 0 && taskId <= taskCounter);

		Task storage task = tasks[taskId];
		require(task.owner == msg.sender);
		require(task.startAmount == msg.value);
		require(task.depositAmount == 0);
		require(!task.finalized);

		task.depositAmount = msg.value;
		emit LogDepositTask(taskId);
	}


	function cancelTask(uint taskId) public isOwner {
		require(taskId > 0 && taskId <= taskCounter);
		
		Task storage task = tasks[taskId];
        require(!task.finalized);
        require(task.bidEndDate < block.timestamp);

        for (uint i=1; i <= task.bidCounter; i++) {
            Bid storage bid = task.bids[i];
            if (!bid.cancelled) {
                payable(bid.owner).transfer(bid.amount);
                bid.cancelled = true;
            }
        }

        payable(task.owner).transfer(task.depositAmount);
        task.finalized = true;
        emit LogCancelTask(taskId);
    }

    function completeTask(uint taskId) public isOwner {
        require(taskId > 0 && taskId <= taskCounter);

		Task storage task = tasks[taskId];
        require(!task.finalized);
        require(task.bidEndDate >= block.timestamp);

        if (task.minBid.id != 0) {
            uint256 refund = task.startAmount - task.minBid.amount;
            payable(task.owner).transfer(refund);
            payable(task.minBid.owner).transfer(task.minBid.amount);
        } else {
            payable(task.owner).transfer(task.startAmount);
        }

        task.finalized = true;
        emit LogCompleteTask(taskId);
    }

    function placeBid(uint taskId) public payable {
        require(taskId > 0 && taskId <= taskCounter);

        Task storage task = tasks[taskId];
        require(task.owner != msg.sender);
        require(task.startAmount == task.depositAmount);
        require(task.bidEndDate >= block.timestamp);
        require(!task.finalized);
        require(msg.value <= task.startAmount);

        if (task.bidCounter > 0) {
            require(msg.value < task.minBid.amount);
        }
        
        for (uint i=1; i <= task.bidCounter; i++) {
            Bid storage bid = task.bids[i];
            if (bid.owner == msg.sender && !bid.cancelled) {
                payable(msg.sender).transfer(bid.amount);
                bid.amount = msg.value;
                bid.date = block.timestamp;
                task.minBid = bid;
                emit LogPlaceBid(bid.id, taskId, msg.value, block.timestamp, msg.sender);
                return;
            }
        }

        task.bidCounter++;
        task.bids[task.bidCounter] = Bid(taskCounter, msg.value, block.timestamp, false, msg.sender);
        task.minBid = task.bids[task.bidCounter];
        emit LogPlaceBid(task.bidCounter, taskId, msg.value, block.timestamp, msg.sender);
    }

    function cancelBid(uint taskId, uint bidId) public {
        require(taskId > 0 && taskId <= taskCounter);
        
        Task storage task = tasks[taskId];
        require(task.owner == msg.sender);
        require(task.bidEndDate > block.timestamp);
        require(!task.finalized);

        // Refund the bid owner
        for (uint i=1; i <= task.bidCounter; i++) {
            Bid storage bid = task.bids[i];
            if (bid.id == bidId) {
                require(!bid.cancelled);
                payable(bid.owner).transfer(bid.amount);
                bid.cancelled = true;
                break ;
            }
        }

        // Update task.minBid
        bool updated = false;
        for (uint i=1; i <= task.bidCounter; i++) {
            Bid storage bid = task.bids[i];
            if (!bid.cancelled && bid.amount < task.minBid.amount) {
                task.minBid = bid;
                updated = true;
            }
        }

        // All the bids were cancelled, so no min bid
        if (!updated) {
            task.minBid.id = 0;
            task.minBid.amount = 0;
            task.minBid.date = 0;
            task.minBid.cancelled = false;
            task.minBid.owner = address(0);
        }

        emit LogCancelBid(bidId);
    }
}