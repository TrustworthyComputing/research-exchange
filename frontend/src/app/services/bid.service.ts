import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Task} from "../models/task";
import {API_URL} from "../constants";
import {Bid, BidStatus} from "../models/bid";

@Injectable({
  providedIn: 'root'
})
export class BidService {

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<Bid[]>(`${API_URL}/bids/`);
  }

  getForTask(taskId: number) {
    return this.http.get<Bid[]>(`${API_URL}/tasks/${taskId}/bids/`);
  }

  request_cancel(taskid: number, bidid: number) {
    return this.http.post<void>(`${API_URL}/tasks/${taskid}/bids/${bidid}/cancel/`,
      {
        taskid: taskid,
        bidid: bidid,
      });
  }
}
