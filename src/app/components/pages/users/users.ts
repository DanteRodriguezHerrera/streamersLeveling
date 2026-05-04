import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { User, UserResponse, UsersResponse } from '../../../core/interfaces/user.interface';
import { UserService } from '../../../core/services/user.service';
import { TokenPayload } from '../../../core/interfaces/token.interface';
import { jwtDecode } from 'jwt-decode';
import { GroupsService } from '../../../core/services/group.service';
import { RolesService } from '../../../core/services/rol.service';
import { IGroup } from '../../../core/interfaces/groups.interface';
import { IRole } from '../../../core/interfaces/role.interface';

@Component({
  selector: 'app-users',
  imports: [FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {

  private usersService = inject(UserService);
  private groupsService = inject(GroupsService);
  private rolesService = inject(RolesService);

  isLoading = signal<boolean>(true)

  users: User[] = [];
  groups: IGroup[] = [];
  roles: IRole[] = []

  selectedUser: User = {
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
  }

  selectedGroup: string = '';

  selectedRol: string = '';

  decoded: TokenPayload = {
    role: '',
    group: '',
    iat: 0
  }

  ngOnInit(): void {
    this.getUsers();
    this.getGroups();
    this.getRoles();
  }

  getUsers() {

    const token = localStorage.getItem("jwtToken");

    if(token){
      this.decoded = jwtDecode<TokenPayload>(token);
      this.usersService.getUsers().subscribe({
        next: (res: UsersResponse) => {
          console.log(res.data)
          this.users = res.data
          this.isLoading.update(value => !value)
        },
        error: err => {
          console.log(err)
        }
      })
    }
  }

  getGroups() {

    this.groupsService.getGroups().subscribe({
      next: (res) => {
        console.log(res.data)
        this.groups = res.data;
      },
      error: err => {
        console.log(err)
      }
    })
  }

  getRoles() {

    this.rolesService.getRoles().subscribe({
      next: (res: any) => {
        console.log(res.data)
        this.roles = res.data;
      },
      error: err => {
        console.log(err)
      }
    })
  }

  getUserInfo(user: User) {
    console.log(user)
    this.selectedUser = user;
  }

  clearUserSelected() {
    this.selectedUser = {
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
    }
  }

  checkUserEdition() {
    this.isLoading.update(value => !value)
    let newUserInfo:any = {};

    if(this.selectedGroup !== '') {
      newUserInfo['group_id'] = this.selectedGroup
    }

    if(this.selectedRol !== '') {
      newUserInfo['role_id'] = this.selectedRol
    }

    this.usersService.updateUser(this.selectedUser.user_id, newUserInfo).subscribe({
      next: (res: UserResponse) => {
        console.log(res)
        this.getUsers();
      },
      error: err => {
        console.log(err)
      }
    })

    this.selectedGroup = '';
    this.selectedRol = '';
  }
}
