import {Component, OnInit} from '@angular/core';
import {Task} from "../../models/task";
import {DatePipe, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {TaskService} from "../../services/task.service";
import {RouterLink} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    NgForOf,
    DatePipe,
    RouterLink,
    NgIf,
    NgOptimizedImage,
    FormsModule
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {

  constructor(private authService: AuthService, private taskService: TaskService) {
  }

  loggedIn: boolean = false;
  tasks: Task[] = []
  searchTerm: string = '';

  ngOnInit() {
    this.authService.getLoggedIn().subscribe(loggedIn => {
      this.loggedIn = loggedIn;
    });

    this.taskService.getAll().subscribe(tasks => {
        this.tasks = tasks;
      }
    );
  }

  getFilteredTasks() {
    return this.tasks.filter(task =>
      task.title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
