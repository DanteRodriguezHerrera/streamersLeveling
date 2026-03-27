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

  ngOnInit(): void {
    
    this.moneyHistoryService.getMoneyHistory('f5e234a0-6c41-41e4-bec5-17197536f7a6').subscribe({
      next: (res: any) => {
        this.moneyHistoryList.set(res.data)
      },
      error: err => {
        console.log(err)
      }
    })
  }
}
