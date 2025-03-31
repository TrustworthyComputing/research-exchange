import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {API_URL} from "../constants";
import {Observable} from "rxjs";
import {User} from "../models/user";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  get() : Observable<User>   {
    return this.http.get<User>(`${API_URL}/auth/user/`);
  }
}
