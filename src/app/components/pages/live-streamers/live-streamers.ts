import { Component, inject, OnInit, signal } from '@angular/core';
import {RouterLink} from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User, UsersResponse } from '../../../core/interfaces/user.interface';
import { NoGroup } from '../../layouts/no-group/no-group';
import { TokenPayload } from '../../../core/interfaces/token.interface';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-live-streamers',
  imports: [
    RouterLink,
    NoGroup
  ],
  templateUrl: './live-streamers.html',
  styleUrl: './live-streamers.scss',
})
export class LiveStreamers implements OnInit {

  private userService = inject(UserService);

  liveChannels = signal<User[]>([]);

  decoded: TokenPayload = {
    role: '',
    group: '',
    iat: 0
  }

  ngOnInit(): void {
    const token = localStorage.getItem("jwtToken");

    if(token){
      this.decoded = jwtDecode<TokenPayload>(token);

      if(this.decoded.group !== null) {
        this.getLiveUsers();
      }
    }
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
