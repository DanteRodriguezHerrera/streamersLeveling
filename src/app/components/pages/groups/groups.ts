import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GroupsService } from '../../../core/services/group.service';
import { GroupsResponse } from '../../../core/interfaces/groups.interface';
import { UserService } from '../../../core/services/user.service';
import { UsersResponse } from '../../../core/interfaces/user.interface';
import { forkJoin, map } from 'rxjs';
import { LoadingScreen } from '../../layouts/loading-screen/loading-screen';

import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-groups',
  imports: [FormsModule, LoadingScreen, FloatLabelModule, InputTextModule],
  templateUrl: './groups.html',
  styleUrl: './groups.scss',
})
export class Groups implements OnInit{

  private groupsService = inject(GroupsService);
  private usersService = inject(UserService)

  groups = signal<Map<string, any[]>>(new Map());
  groupsIds = signal<string[]>([]);

  noGroupUsers = signal<any[]>([]);

  isLoading = signal<boolean>(true)

  groupsOptions: any[] = [];
  user_id: string = '';

  selectedGroup: string = ''; 

  isEditingName = signal<boolean>(false);
  indexEditing: number = 0;
  group_id: string = '';
  actualName: string = '';
  newName: string = '';

  ngOnInit(): void {
    this.getUserNoGroup();
  }

  getGroups() {

    this.groupsService.getGroups().subscribe({
      next: (res: GroupsResponse) => {

        setTimeout(() => {
          this.groupsOptions = res.data
        }, 0)

        res.data.forEach(group => {
          this.groupsIds().push(group.group_id)
        });

        const requests = res.data.map(group =>
          this.usersService.getUsersByGroup(group.group_id)
            .pipe(map(users => ({ group, users })))
        );

        forkJoin(requests).subscribe({
          next: (results) => {
            results.forEach(({ group, users }) => {
              if(group.clan_name !== ''){
                this.groups.update(value => value.set(group.clan_name, users.data));
              }
              else {
                this.groups.update(value => value.set(group.group_name, users.data));
              }
            });
            this.isLoading.set(false);
          },
          error: err => console.log(err)
        });
      },
      error: err => console.log(err)
    });
  }

  getUserNoGroup() {

    this.groupsIds.set([])
    this.groups.set(new Map());
    this.isLoading.set(true)

    this.usersService.getUsersByGroup(null).subscribe({
      next: (res: UsersResponse) => {
        if(res.data.length !== 0) {
          this.groups.update(value => value.set('Sin grupo', res.data))
          this.groupsIds().unshift("");
        }
        this.getGroups();
      },
      error: err => {
        console.log(err)
      }
    })
  }

  clearGroupSelected() {
    this.user_id = '';
    this.selectedGroup = '';
  }

  updateUser(user_id: string, group: any) {

    this.isLoading.set(true);

    const newGroup = group != null ? group.group_id : 'null';
  
    this.usersService.updateUser(user_id, {group_id: newGroup}).subscribe({
      next: (res: any) => {
        this.getGroups();
        this.getUserNoGroup();
        this.clearGroupSelected();
      },
      error: err => {
        console.log(err)
      }
    })
  }

  createNewGroup() {
    this.groupsService.createGroup().subscribe({
      next: (res) => {
        this.getUserNoGroup()
      },
      error: err => {
        console.log(err)
      }
    })
  }

  deleteEmptyGroup(group_id: string) {
    this.groupsService.deleteGroup(group_id).subscribe({
      next: (res) => {
        this.getUserNoGroup()
      },
      error: err => {
        console.log(err)
        this.isLoading.set(false)
      }
    })
  }

  startEditing(group_id: string, index: number, actual_name: string) {
    this.isEditingName.set(true);
    this.indexEditing = index;
    this.group_id = group_id;
    this.actualName = actual_name;
  }

  confirmEdition() {

    this.groupsService.editGroup(this.group_id, this.newName).subscribe({
      next: (res) => {
        this.getUserNoGroup()
        this.isEditingName.set(false)
        this.newName = '';
      },
      error: err => {
        console.log(err)
      }
    })
  }
}
