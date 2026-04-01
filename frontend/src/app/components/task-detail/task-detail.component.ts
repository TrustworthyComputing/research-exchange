import {Component, OnInit} from '@angular/core';
import {TaskService} from "../../services/task.service";
import {CreateTask, CurrencyCode, RequestEditTask, Task, TaskStatus} from "../../models/task";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {catchError, Subscription} from "rxjs";
import {UserService} from "../../services/user.service";
import {AuthService} from "../../services/auth.service";
import {DatePipe, JsonPipe, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {BidService} from "../../services/bid.service";
import {AlertModule} from "ngx-bootstrap/alert";
import {Bid, BidStatus} from "../../models/bid";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BsDatepickerModule} from "ngx-bootstrap/datepicker";
import {User} from "../../models/user";
import {ContractService} from "../../services/contract.service";

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    NgIf,
    JsonPipe,
    AlertModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    RouterLink,
    BsDatepickerModule,
    NgForOf,
    DatePipe,
    FormsModule
  ],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent implements OnInit {

  editTaskInformationForm = new FormGroup({
    title: new FormControl(''),
    description: new FormControl(''),
  });

  editTaskDetailsForm = new FormGroup({
    start_bid_amount: new FormControl(0),
    bid_end_date: new FormControl(new Date()),
    complete_date: new FormControl(new Date()),
  });

  user?: User;
  loggedIn: boolean = false;
  loggedInSubscription?: Subscription;
  taskId: string = '';
  task?: Task;
  bids?: Bid[];
  successAlert?: string;
  errorAlert?: any;
  successEditInformation: boolean = false;
  successEditDetails: boolean = false;
  detailsErrors?: any
  errors: { [key: string]: string[] } = {}
  manageBidErrors: string[] = []
  changeBidErrors: string[] = []
  successCancel: boolean = false;
  successPlace: boolean = false;

  offer_bid_amount?: number;

  constructor(private contractService: ContractService, private route: ActivatedRoute, private router: Router, private taskService: TaskService,
              private authService: AuthService, private userService: UserService, private bidService: BidService) {
  }

  ngOnInit(): void {
    this.loggedInSubscription = this.authService.getLoggedIn().subscribe(loggedIn => {
      this.loggedIn = loggedIn;
    });

    this.userService.get().subscribe(user => {
      this.user = user;
    })

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.taskId = id;
      this.taskService.get(id).pipe(catchError(err => {
        if (err.status === 404) {
          this.router.navigate(['404']);
        }
        return []
      })).subscribe(task => {
        this.task = task
        this.setEditTaskInformationForm(task)
        this.setEditTaskDetails(task)
        this.bidService.getForTask(task.id).subscribe(bids => {
          this.bids = bids;
        })
      });
      return
    }

    this.router.navigate(['404']);
  }

  private setEditTaskInformationForm(task: Task) {
    this.editTaskInformationForm.patchValue({
      title: task.title,
      description: task.description,
    })
  }

  private setEditTaskDetails(task: Task) {
    this.editTaskDetailsForm.patchValue({
      start_bid_amount: task.start_bid_amount,
      bid_end_date: new Date(task.end_bid_date),
      complete_date: new Date(task.end_date)
    })
  }

  getTaskStatus(): TaskStatus {
    if (this.task && this.task.status) {
      return this.task.status;
    }

    return TaskStatus.CANCELLED
  }

  onEditTaskInformation() {
    if (!this.editTaskInformationForm.value.title || !this.editTaskInformationForm.value.description) {
      return
    }

    let task: RequestEditTask = {
      title: this.editTaskInformationForm.value.title,
      description: this.editTaskInformationForm.value.description,
    }

    this.taskService.editInformation(this.taskId, task).subscribe({
      next: (task) => {
        this.task = task
        this.successEditInformation = true;
      },
    });
  }

  onCancelEditTaskInformation() {
    this.successEditInformation = false;
    this.errors = {}
    if (this.task) {
      this.setEditTaskInformationForm(this.task);
    }
  }

  onEditTaskDetails() {
    if (!this.task
      || !this.editTaskDetailsForm.value.start_bid_amount
      || !this.editTaskDetailsForm.value.bid_end_date
      || !this.editTaskDetailsForm.value.complete_date) {
      return
    }

    let taskId = this.task.id
    let start_bid_amount = this.editTaskDetailsForm.value.start_bid_amount
    let bid_end_date = this.editTaskDetailsForm.value.bid_end_date
    let complete_date = this.editTaskDetailsForm.value.complete_date
    this.contractService.updateTask(
      taskId,
      start_bid_amount,
      bid_end_date,
      complete_date)
      .then(result => {
        if (result && this.task) {
          this.successEditDetails = true;
          this.task.id = taskId
          this.task.start_bid_amount = start_bid_amount
          this.task.end_bid_date = bid_end_date
          this.task.end_date = complete_date
          this.detailsErrors = null
        }

      }).catch(error => {
        this.successEditDetails = false
        this.detailsErrors = error.info.error.data.data.reason
    })
  }

  onCancelEditTaskDetails() {
    this.successEditDetails = false;
    this.detailsErrors = null
    if (this.task) {
      this.setEditTaskDetails(this.task);
    }
  }

  onCancelTask() {
    if (!this.task) {
      return;
    }

    this.contractService.cancelTask(this.task.id)
      .then(result => {
        if (result) {
          this.router.navigate(['profile'])
        }
      }).catch(error => {
        alert(error.info.error.data.data.reason);
    })
  }

  onPlaceBid() {
    console.log("Task:", this.task)
    if (this.task && this.offer_bid_amount) {
      this.contractService.placeBid(this.task.id, this.offer_bid_amount)
        .then(result => {
          if (result) {
              this.successPlace = true

          }
        })
    }
  }

  onCancelBid(bid: Bid) {
    if (!this.task) {
      console.log("cancel fail")
      return
    }

    console.log("Cancel:", this.task.id)

    let taskId = this.task.id
    let bidId = bid.uid
    if (taskId && bidId) {
      this.contractService.cancelBid(taskId, bidId).then(result => {
        if (result) {
          alert("Successfully requested cancel bid")
        }
      }).catch(error => {
        alert(error.info.error.data.data.reason);
      })
    }
  }

  onRequestCancelBid() {
    if (!this.task || !this.task.user_bid || this.task.user_bid.cancelled) {
      return
    }

    console.log("TEST", this.task.user_bid)
    let taskId = this.task.id
    let bidId = this.task.user_bid.uid
    this.bidService.request_cancel(taskId, bidId).subscribe(result => {

      if (this.task && this.task.user_bid) {
        // @ts-ignore
        this.task.user_bid.cancel_requested = true
        alert("Successfully cancelled bid")

      }
    })
  }

  onCompleteTask(bid: Bid) {
    if (bid.is_payable) {
      this.contractService.completeTask(bid.task_uid).then(result => {
        if (result && this.task) {
          bid.is_payable = false;
          this.task.finalized = true
          alert("Successfully completed task")
        }
      }).catch(error => {
        alert("Failed to complete task")
      })
    }
  }
}
