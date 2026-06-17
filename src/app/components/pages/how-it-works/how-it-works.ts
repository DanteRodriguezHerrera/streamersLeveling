import { Component, inject, OnInit, signal } from '@angular/core';
import { MoneyReasonService } from '../../../core/services/money-reason.service';

@Component({
  selector: 'app-how-it-works',
  imports: [],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.scss',
})
export class HowItWorks implements OnInit {

  private moneyReasonService = inject(MoneyReasonService)

  manaPerView = signal<number>(0);
  manaPerSub = signal<number>(0);

  ngOnInit(): void {
    this.getMoneyReasons();
  }

  getMoneyReasons() {

    this.moneyReasonService.getMoneyReasons().subscribe({
      next: (res) => {
        console.log(res.data)
        res.data.forEach(reasons => {
          if(reasons.reason === 2) {
            this.manaPerView.set(reasons.quantity);
          }
          if(reasons.reason === 4) {
            this.manaPerSub.set(reasons.quantity);
          }
        });
      },
      error: err => {
        console.log(err)
      }
    })
  }
}
