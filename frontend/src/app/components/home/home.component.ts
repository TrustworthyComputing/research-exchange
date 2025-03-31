import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {NgIf, NgOptimizedImage} from "@angular/common";
import {Subscription} from "rxjs";
import {AlertModule} from "ngx-bootstrap/alert";
import {AccordionModule} from "ngx-bootstrap/accordion";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    AlertModule,
    AccordionModule,
    NgOptimizedImage,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})

export class HomeComponent implements OnInit, OnDestroy {

  loggedIn: boolean = false;
  loggedInSubscription?: Subscription;
  loading: boolean = false;
  gitGubClientId: string = '';

  constructor(private route: ActivatedRoute,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    this.loggedInSubscription = this.authService.getLoggedIn().subscribe(loggedIn => {
      this.loggedIn = loggedIn;
      this.loading = false;
    });

    this.gitGubClientId = this.authService.getGitHubClientID()

    const provider = this.route.snapshot.paramMap.get('provider');
    const code = this.route.snapshot.queryParams["code"];
    switch (provider) {
      case 'github':
        this.authService.loginWithGitHub(code);
        this.loading = true;
        break;
    }
  }

  ngOnDestroy(): void {
    this.loggedInSubscription?.unsubscribe();
  }
}
