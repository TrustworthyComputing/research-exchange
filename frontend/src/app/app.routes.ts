import { Routes } from '@angular/router';
import { HomeComponent } from "./components/home/home.component";
import { authGuard } from "./guards/auth.guard"
import {TaskListComponent} from "./components/task-list/task-list.component";
import {PageNotFoundComponent} from "./components/page-not-found/page-not-found.component";
import {ProfileComponent} from "./components/profile/profile.component";
import {TaskCreateComponent} from "./components/task-create/task-create.component";
import {TaskDetailComponent} from "./components/task-detail/task-detail.component";
import {FaqComponent} from "./components/faq/faq.component";

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login/:provider/callback',
    component: HomeComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tasks',
    component: TaskListComponent,
  },
  {
    path: 'tasks/create',
    component: TaskCreateComponent,
    canActivate: [authGuard],
  },
  {
    path: 'tasks/:id',
    component: TaskDetailComponent,
  },
  {
    path: 'faq',
    component: FaqComponent,
  },
  {
    path: '404',
    component: PageNotFoundComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  }
];
