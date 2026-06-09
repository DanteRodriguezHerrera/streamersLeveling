import { Component, inject, signal } from '@angular/core';
import { User, UserResponse, UsersResponse } from '../../../../core/interfaces/user.interface';
import { UserService } from '../../../../core/services/user.service';
import { jwtDecode } from 'jwt-decode';
import { TokenPayload } from '../../../../core/interfaces/token.interface';
import { RouterLink } from '@angular/router';
import { NoGroup } from '../../../layouts/no-group/no-group';

@Component({
  selector: 'app-group-ranking',
  imports: [NoGroup],
  templateUrl: './group-ranking.html',
  styleUrl: './group-ranking.scss',
})
export class GroupRanking {

  private usersService = inject(UserService);

  isLoading = signal<boolean>(true)

  ranking: User[] = [];

  decoded: TokenPayload = {
    role: '',
    group: '',
    iat: 0,
    name: ''
  }

  user: User = {
    user_id: '',
    twitch_id: '',
    role_id: '',
    group_id: '',
    access_token: '',
    expires_in: 0,
    refresh_token: '',
    actual_money: 0,
    channel_name: '',
    group: {
      group_id: '',
      group_name: ''
    },
    role: {
      role_id: '',
      role_name: ''
    }
  };

  ngOnInit(): void {

    const token = localStorage.getItem("jwtToken");

    if(token) {
      this.decoded = jwtDecode<TokenPayload>(token);
      
      if(this.decoded.group !== 'null') {
        this.getRanking();
      }
    }
    
  }

  getRanking() {
    this.usersService.getUsersByGroup(this.decoded.group).subscribe({
      next: (res: UsersResponse) => {
        this.ranking = res.data
        this.isLoading.update(value => !value)
      },
      error: err => {
        console.log(err)
      }
    })
  }

  getExpulsionUser(user: User) {
    this.user = user;
  }

  confirmExpulsion() {
    this.isLoading.update(value => !value)

    this.usersService.updateUser(this.user.user_id, {"group_id": 'null', "role_id": "c3f283bf-1ac3-4c47-a74e-50fb07ad02e7"}).subscribe({
      next: () => {
        this.getRanking();
      },
      error: err => {
        console.log(err)
      }
    })
  }
}
