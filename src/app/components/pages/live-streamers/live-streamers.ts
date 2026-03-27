import { Component, inject, OnInit, signal } from '@angular/core';
import {RouterLink} from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User, UsersResponse } from '../../../core/interfaces/user.interface';

@Component({
  selector: 'app-live-streamers',
  imports: [
    RouterLink
  ],
  templateUrl: './live-streamers.html',
  styleUrl: './live-streamers.scss',
})
export class LiveStreamers implements OnInit {

  private userService = inject(UserService);

  liveChannels = signal<User[]>([]);

  ngOnInit(): void {
    
    this.getLiveUsers();
  }

  getLiveUsers() {
    this.userService.getUsers().subscribe({
      next: (res: UsersResponse) => {
        console.log(res.data)
        this.liveChannels.set(res.data)
      },
      error: err => {
        console.log(err)
      }
    })
  }
}
