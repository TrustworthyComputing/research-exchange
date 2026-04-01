import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterLink, RouterLinkActive} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {NgIf} from "@angular/common";
import {Subscription} from "rxjs";
import {UserService} from "../../services/user.service";
import {User} from "../../models/user";
import {ContractService} from "../../services/contract.service";

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
  balance?: string = ''

  constructor(private authService: AuthService, private userService: UserService, private contractService: ContractService) {}

  ngOnInit(): void {
    this.loggedInSubscription = this.authService.getLoggedIn().subscribe(loggedIn => {
      this.loggedIn = loggedIn;
    });

    this.gitHubClientId = this.authService.getGitHubClientID()
    this.userService.get().subscribe(user => {
      this.user = user;
    })

    this.contractService.getWalletBalance().subscribe(balance => {
      this.balance = balance
    })
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.loggedInSubscription?.unsubscribe();
  }
}
