import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterLink, RouterLinkActive} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {NgIf} from "@angular/common";
import {Subscription} from "rxjs";
import {UserService} from "../../services/user.service";
import {User} from "../../models/user";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLinkActive,
    RouterLink,
    NgIf
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {

  user?: User;
  loggedIn: boolean = false;
  loggedInSubscription?: Subscription;
  gitHubClientId: string = '';

  constructor(private authService: AuthService, private userService: UserService) {}

  ngOnInit(): void {
    this.loggedInSubscription = this.authService.getLoggedIn().subscribe(loggedIn => {
      this.loggedIn = loggedIn;
    });

    this.gitHubClientId = this.authService.getGitHubClientID()
    this.userService.get().subscribe(user => {
      this.user = user;
    })
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.loggedInSubscription?.unsubscribe();
  }
}
