import { Component, inject, OnInit, signal } from '@angular/core';
import { User, UsersResponse } from '../../../../core/interfaces/user.interface';
import { UserService } from '../../../../core/services/user.service';
import { LoadingScreen } from '../../../layouts/loading-screen/loading-screen';

@Component({
  selector: 'app-global-ranking',
  imports: [LoadingScreen],
  templateUrl: './global-ranking.html',
  styleUrl: './global-ranking.scss',
})
export class GlobalRanking implements OnInit {

  private usersService = inject(UserService);

  isLoading = signal<boolean>(true)

  ranking: User[] = [];

  ngOnInit(): void {
    
    this.getRanking();
  }

  getRanking() {

    this.usersService.getUsers().subscribe({
      next: (res: UsersResponse) => {
        this.ranking = res.data
        this.isLoading.update(value => !value)
      },
      error: err => {
        console.log(err)
      }
    })
  }
}
