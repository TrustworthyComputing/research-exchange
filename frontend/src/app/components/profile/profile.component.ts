import {Component, OnInit} from '@angular/core';
import {UserService} from "../../services/user.service";
import {User} from "../../models/user";
import {Task, TaskStatus} from "../../models/task";
import {TaskService} from "../../services/task.service";
import {DatePipe, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {RouterLink} from "@angular/router";
import {BidService} from "../../services/bid.service";
import {Bid, BidStatus} from "../../models/bid";
import {AccordionModule} from "ngx-bootstrap/accordion";
import {TabsModule} from "ngx-bootstrap/tabs";
import {ContractService} from "../../services/contract.service";
import {Wallet} from "ethers";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DatePipe,
    NgForOf,
    RouterLink,
    NgIf,
    AccordionModule,
    TabsModule,
    NgOptimizedImage
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  user?: User
  tasks: Task[] = []
  bids: Bid[] = []

  userAddress: string | null = null;

  constructor(private userService: UserService, private taskService: TaskService, private bidService: BidService, private contractService: ContractService) { }

  ngOnInit(): void {
      this.userService.get().subscribe(user => this.user = user);
      this.taskService.getUser().subscribe(tasks => {
        this.tasks = tasks;
      });

      this.bidService.getAll().subscribe(bids => this.bids = bids)
  }

  protected readonly BidStatus = BidStatus;
  protected readonly TaskStatus = TaskStatus;
}
