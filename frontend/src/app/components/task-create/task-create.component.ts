import {Component} from '@angular/core';
import {DatePipe, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {RouterLink} from "@angular/router";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {TaskService} from "../../services/task.service";
import {CreateTask} from "../../models/task";
import {catchError} from "rxjs";
import {BsDatepickerModule} from "ngx-bootstrap/datepicker";
import {ContractService} from "../../services/contract.service";
import {Web3} from "web3";

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [
    NgForOf,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    BsDatepickerModule,
  ],
  templateUrl: './task-create.component.html',
  styleUrl: './task-create.component.scss'
})
export class TaskCreateComponent {

  createTaskForm = new FormGroup({
    title: new FormControl(''),
    description: new FormControl(''),
    start_bid_amount: new FormControl(0),
    end_bid_date: new FormControl(new Date()),
    end_date: new FormControl(new Date())
  });
  success: boolean = false;
  errors: any = ''

  constructor(private taskService: TaskService, private contractService: ContractService) {
  }

  onSubmit() {
    let task: CreateTask = {
      title: this.createTaskForm.value.title,
      description: this.createTaskForm.value.description,
      start_bid_amount: this.createTaskForm.value.start_bid_amount,
      end_bid_date: this.createTaskForm.value.end_bid_date,
      end_date: this.createTaskForm.value.end_date
    }

    if (task.title === null
      || task.title === undefined
      || task.description === null
      || task.description === undefined
      || task.start_bid_amount === null
      || task.start_bid_amount == undefined
      || task.end_bid_date == null
      || task.end_date == null) {
      return
    }

    this.contractService.createTask(task.title, task.description, task.start_bid_amount, task.end_bid_date, task.end_date)
      .then(result => {
        if (result) {
          this.createTaskForm.reset()
          this.success = true
          this.errors = null
        }
      })
      .catch((error) => {
        this.errors = error.info.error.data.data.reason
        this.success = false
      })
  }

  get title() {
    return this.createTaskForm.get('title');
  }

  get description() {
    return this.createTaskForm.get('description');
  }

  get start_bid_amount() {
    return this.createTaskForm.get('start_bid_amount');
  }

  get end_bid_date() {
    return this.createTaskForm.get('end_bid_date');
  }

  get end_date() {
    return this.createTaskForm.get('end_date');
  }

  protected readonly Date = Date;
}
