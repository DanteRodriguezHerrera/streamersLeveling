import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GroupsService } from '../../../core/services/group.service';
import { GroupsResponse } from '../../../core/interfaces/groups.interface';
import { UserService } from '../../../core/services/user.service';
import { UsersResponse } from '../../../core/interfaces/user.interface';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-groups',
  imports: [FormsModule],
  templateUrl: './groups.html',
  styleUrl: './groups.scss',
})
export class Groups implements OnInit{

  private groupsService = inject(GroupsService);
  private usersService = inject(UserService)

  groups = signal<Map<string, any[]>>(new Map());

  noGroupUsers = signal<any[]>([]);

  isLoading = signal<boolean>(true)

  groupsOptions: any[] = [];
  user_id: string = '';

  selectedGroup: string = ''; 

  ngOnInit(): void {
    
    this.getGroups();
  }

  getGroups() {

    this.groups.set(new Map());

    this.groupsService.getGroups().subscribe({
      next: (res: GroupsResponse) => {

        setTimeout(() => {
          this.groupsOptions = res.data
        }, 0)

        this.getUserNoGroup();

        const requests = res.data.map(group =>
          this.usersService.getUsersByGroup(group.group_id)
            .pipe(map(users => ({ group, users })))
        );

        forkJoin(requests).subscribe({
          next: (results) => {
            results.forEach(({ group, users }) => {
              this.groups.update(value => value.set(group.group_name, users.data));
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

    this.usersService.getUsersByGroup(null).subscribe({
      next: (res: UsersResponse) => {
        if(res.data.length !== 0) {
          this.groups.update(value => value.set('Sin grupo', res.data))
        }
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
}
