import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {CreateTask, Task} from "../models/task";
import {API_URL} from "../constants";
import {User} from "../models/user";

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private http: HttpClient) { }

  create(task: CreateTask) {
    return this.http.post<any>(`${API_URL}/tasks/`, task);
  }

  edit(taskId: string, task: CreateTask) {
    return this.http.patch<Task>(`${API_URL}/tasks/${taskId}/`, task);
  }

  getUser() {
    return this.http.get<Task[]>(`${API_URL}/tasks/user/`);
  }

  getAll() {
    return this.http.get<Task[]>(`${API_URL}/tasks/`);
  }

  get(taskId: string) {
    return this.http.get<Task>(`${API_URL}/tasks/${taskId}/`);
  }
}
