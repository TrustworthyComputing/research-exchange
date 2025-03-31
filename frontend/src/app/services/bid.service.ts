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

  create(taskId: number) {
    return this.http.post<void>(`${API_URL}/bids/`,
      {
        task: taskId,
        created_by: 'user'
      });
  }

  requestCancelBid(bid: Bid) {
    return this.http.patch<Bid>(`${API_URL}/bids/${bid.id}/`,
      {
        task: bid.task,
        amount: bid.amount,
        cancel_requested: true,
        cancelled: bid.cancel_requested
      });
  }

  cancelBid(bid: Bid) {
    return this.http.patch<Bid>(`${API_URL}/bids/${bid.id}/`,
      {
        task: bid.task,
        amount: bid.amount,
        cancel_requested: bid.cancel_requested,
        cancelled: true
      });
  }

}
