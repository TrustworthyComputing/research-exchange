import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { API_URL } from "../constants";
import { Token } from "../models/auth";
import {BehaviorSubject, Observable} from "rxjs";
import {Router} from "@angular/router";

const TOKEN_STORAGE_KEY: string = "token";
const GITHUB_CLIENT_ID: string = "Ov23liFFm8xtckiuS0tf";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token: string | null;
  private readonly loggedIn: BehaviorSubject<boolean>;

  constructor(private router: Router, private http: HttpClient) {
    this.token = localStorage.getItem(TOKEN_STORAGE_KEY)
    this.loggedIn = new BehaviorSubject<boolean>(this.token != null);
  }

  private setToken(token: string | null): void {
    this.token = token;
    this.loggedIn.next(this.token != null);
    if (this.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, this.token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isLoggedIn(): boolean {
    return this.loggedIn.getValue();
  }

  getLoggedIn(): Observable<boolean> {
    return this.loggedIn;
  }

  getGitHubClientID(): string {
    return GITHUB_CLIENT_ID;
  }

  loginWithGitHub(code: string): void {
    this.http.post<Token>(`${API_URL}/auth/github/`, {'code': code})
      .subscribe(data => {
         this.setToken(data.key);
         this.router.navigate(['']);
      });
  }

  logout(): void {
    this.http.post<void>(`${API_URL}/auth/logout/`, null);
    this.setToken(null);
  }
}
