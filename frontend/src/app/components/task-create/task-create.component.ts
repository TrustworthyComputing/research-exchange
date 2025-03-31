import { Component } from '@angular/core';
import {DatePipe, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {RouterLink} from "@angular/router";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {TaskService} from "../../services/task.service";
import {CreateTask} from "../../models/task";
import {catchError} from "rxjs";
import {BsDatepickerModule} from "ngx-bootstrap/datepicker";

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
  errors: {[key: string]: string[]} = {}

  constructor(private taskService: TaskService) {}

  onSubmit() {
    let task: CreateTask = {
      title: this.createTaskForm.value.title,
      description: this.createTaskForm.value.description,
      start_bid_amount: this.createTaskForm.value.start_bid_amount,
      end_bid_date: this.createTaskForm.value.end_bid_date,
      end_date: this.createTaskForm.value.end_date
    }

    this.taskService.create(task).pipe(catchError(err => {
      if (err.status == 400) {
        this.errors = err.error;
        return []
      }
      return err
    })).subscribe(data => {
      this.createTaskForm.reset();
      this.errors = {};
      this.success = true;
    });
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
