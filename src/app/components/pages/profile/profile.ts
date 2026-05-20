import { Component, inject, OnInit, signal } from '@angular/core';

import { MoneyHistoryService } from '../../../core/services/money-history.service';

import { IMoneyHistory } from '../../../core/interfaces/money-history.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {

  private moneyHistoryService = inject(MoneyHistoryService);

  moneyHistoryList = signal<IMoneyHistory[]>([]);

  userId = localStorage.getItem('user');

  ngOnInit(): void { 
    if(this.userId) {
      this.getUserHistory(this.userId);
    }
  }
  
  getUserHistory(userId: string) {
    this.moneyHistoryService.getMoneyHistory(userId).subscribe({
      next: (res: any) => {
        this.moneyHistoryList.set(res.data)
      },
      error: err => {
        console.log(err)
      }
    })
  }
}
