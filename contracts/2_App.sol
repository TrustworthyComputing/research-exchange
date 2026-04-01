// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "1_Owner.sol";

contract App is Owner {

	struct Task {
		uint id;
		address owner;
		uint256 startAmount;
		uint256 depositAmount;
		uint256 bidEndDate;
		uint256 completeDate;
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
        string title,
        string description,
        address indexed owner,
        uint256 startAmount,
        uint256 bidEndDate,
        uint256 completeDate
    );

    event LogUpdateTask(
        uint indexed taskId,
        uint256 startAmount,
        uint256 bidEndDate,
        uint256 completeDate
    );

	event LogCancelTask(uint indexed taskId);

    event LogCompleteTask(uint indexed taskId);

	event LogPlaceBid(
		uint indexed id,
		uint indexed taskId,
		uint256 amount,
		uint256 date,
		address indexed owner
	);

    event LogCancelBid(uint taskId, uint indexed id);

	mapping (uint => Task) tasks;
	uint taskCounter;

	constructor() {
    }

	function createTask(string memory title, string memory description, uint256 bidEndDate, uint256 completeDate) public payable {
		require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
		require(block.timestamp < bidEndDate, "Bid end date must be in the future");
		require(completeDate > bidEndDate, "Complete date must be after bid end date");

		taskCounter++;
        tasks[taskCounter].id = taskCounter;
        Task storage task = tasks[taskCounter];
        task.owner = msg.sender;
        task.startAmount = msg.value;
        task.depositAmount = msg.value;
        task.bidEndDate = bidEndDate;
        task.completeDate = completeDate;
        task.bidCounter = 0;
        task.finalized = false;

        emit LogCreateTask(taskCounter, title, description, msg.sender, msg.value, bidEndDate, completeDate);
	}

	function updateTask(uint taskId, uint startAmount, uint256 bidEndDate, uint256 completeDate) public {
	    require(taskId > 0 && taskId <= taskCounter, "Task does not exist");
	    require(block.timestamp < bidEndDate, "Bid end date must be in the future");
	    require(completeDate > bidEndDate, "Complete date must be after bid end date");

	    Task storage task = tasks[taskId];
        require(!task.finalized, "You can not update a finalized task.");
		require(task.owner == msg.sender, "You can not update a task that you do not own.");
        require(task.bidCounter == 0, "You can not update a task with bids.");
        require(startAmount <= task.depositAmount, "Updated amount must be <= initial deposit.");

        task.startAmount = startAmount;
        task.bidEndDate = bidEndDate;
        task.completeDate = completeDate;

        emit LogUpdateTask(taskId, startAmount, bidEndDate, completeDate);
	}

	function cancelTask(uint taskId) public {
		require(taskId > 0 && taskId <= taskCounter, "Task does not exist.");

		Task storage task = tasks[taskId];
        require(!task.finalized, "You can not cancel a finalized task.");
		require(task.owner == msg.sender, "You can not cancel a task that you do not own.");
        require(task.bidCounter == 0, "You can not cancel a task with bids.");

        payable(task.owner).transfer(task.depositAmount);

        task.finalized = true;

        emit LogCancelTask(taskId);
    }

    function completeTask(uint taskId) public payable {
        require(taskId > 0 && taskId <= taskCounter);

		Task storage task = tasks[taskId];
        require(!task.finalized, "The task has already been finalized.");
        require(task.owner == msg.sender, "Only the task owner can mark a task complete.");
        require(block.timestamp >= task.bidEndDate, "You can not complete a task before bidding is over.");

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

    function placeBid(uint taskId, uint bidAmount) public {
        require(taskId > 0 && taskId <= taskCounter);

        Task storage task = tasks[taskId];
        require(task.bidEndDate >= block.timestamp, "You can not place a bid after bid end date.");
        require(!task.finalized, "You can not place a bid on a finalized task.");
        if (task.bidCounter <= 0) {
            require(bidAmount <= task.startAmount, "Your bid must be lower than the start amount.");
        } else {
            require(bidAmount < task.minBid.amount, "Your bid must be lower than the min bid.");
        }

        for (uint i=1; i <= task.bidCounter; i++) {
            Bid storage bid = task.bids[i];
            if (bid.owner == msg.sender) {
                bid.amount = bidAmount;
                bid.date = block.timestamp;
                bid.cancelled = false;
                task.minBid = bid;
                emit LogPlaceBid(bid.id, taskId, bidAmount, block.timestamp, msg.sender);
                return;
            }
        }

        task.bidCounter++;
        task.bids[task.bidCounter] = Bid(taskCounter, bidAmount, block.timestamp, false, msg.sender);
        task.minBid = task.bids[task.bidCounter];

        emit LogPlaceBid(task.bidCounter, taskId, bidAmount, block.timestamp, msg.sender);
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
                break;
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

        emit LogCancelBid(taskId, bidId);
    }
}