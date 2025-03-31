import {Component, OnInit} from '@angular/core';
import {TaskService} from "../../services/task.service";
import {CreateTask, CurrencyCode, Task, TaskStatus} from "../../models/task";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {catchError, Subscription} from "rxjs";
import {UserService} from "../../services/user.service";
import {AuthService} from "../../services/auth.service";
import {DatePipe, JsonPipe, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {BidService} from "../../services/bid.service";
import {AlertModule} from "ngx-bootstrap/alert";
import {Bid, BidStatus} from "../../models/bid";
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {BsDatepickerModule} from "ngx-bootstrap/datepicker";
import {User} from "../../models/user";

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
    DatePipe
  ],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent implements OnInit {

  editTaskForm = new FormGroup({
    title: new FormControl(''),
    description: new FormControl(''),
    start_bid_amount: new FormControl(0),
    end_bid_date: new FormControl(new Date()),
    end_date: new FormControl(new Date())
  });

  user?: User;
  loggedIn: boolean = false;
  loggedInSubscription?: Subscription;
  taskId: string = '';
  task?: Task;
  bids?: Bid[];
  successAlert?: string;
  errorAlert?: any;
  success: boolean = false;
  errors: {[key: string]: string[]} = {}
  manageBidErrors: string[] = []
  changeBidErrors: string[] = []
  successCancel: boolean = false;
  successPlace: boolean = false;
  myBid?: Bid;

  constructor(private route: ActivatedRoute, private router: Router, private taskService: TaskService,
              private authService: AuthService, private userService: UserService, private bidService: BidService) {}

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
        this.setEditTaskForm(task)
        this.bidService.getForTask(task.id).subscribe(bids => {
          this.bids = bids;
        })
      });
      return
    }

    this.router.navigate(['404']);
  }

  private setEditTaskForm(task: Task) {
    this.editTaskForm.patchValue({
      title: task.title,
      description: task.description,
      start_bid_amount: task.start_bid_amount,
      end_bid_date: new Date(task.end_bid_date),
      end_date: new Date(task.end_date),
    })
  }

  onPlaceBid() {
    if (this.task) {
      this.bidService.create(this.task.id).pipe(
        catchError(err => {
          this.successAlert = undefined;
          this.errorAlert = err.error;
          return []
        })
      ).subscribe(_ => {
        this.errorAlert = undefined;
        this.successAlert = "Bid successfully placed."
      });
    }
  }

  isTaskEditable() {
    if (this.bids && this.bids.length != 0) {
      return false;
    }

    return this.user?.username == this.task?.author;
  }

  isTaskBiddable() {
    if (this.task?.end_bid_date && new Date() > this.task.end_bid_date) {
      return false;
    }

    return this.loggedIn && this.user?.username != this.task?.author
  }

  getTaskStatus(): TaskStatus {
    if (this.task && this.task.status) {
      return this.task.status;
    }

    return TaskStatus.CANCELLED
  }

  onEditTask() {
    let task: CreateTask = {
      title: this.editTaskForm.value.title,
      description: this.editTaskForm.value.description,
      start_bid_amount: this.editTaskForm.value.start_bid_amount,
      end_bid_date: this.editTaskForm.value.end_bid_date,
      end_date: this.editTaskForm.value.end_date
    }

    this.taskService.edit(this.taskId, task).subscribe({
      next: (task) => {
        this.task = task
        this.errors = {}
        this.success = true;
      },
      error: (error) => {
        this.errors = error.error;
      },
    });
  }

  onCancelEditTask() {
    this.success = false;
    this.errors = {}
    if (this.task) {
      this.setEditTaskForm(this.task);
    }
  }

  onCancelBid(x: Bid) {
    this.bidService.cancelBid(x).subscribe({
      next: (bid) => {
        this.manageBidErrors = []
        this.bids?.map(b => b.id === x.id ? bid : b)
      },
      error: (error) => {
        this.manageBidErrors = Array.from(error.error as string[]).flat();
      },
    })
  }

  onRequestCancelBid() {
    if (!this.myBid) {
      return
    }
    this.bidService.requestCancelBid(this.myBid).subscribe({
      next: (bid) => {
        this.changeBidErrors = []
        if (this.myBid) {
          // @ts-ignore
          this.bids?.map(b => b.id === this.myBid.id ? bid : b)
        }
      },
      error: (error) => {
        this.changeBidErrors = Array.from(error.error as string[]).flat();
      },
    })
  }

  protected readonly BidStatus = BidStatus;
  protected readonly TaskStatus = TaskStatus;
}
