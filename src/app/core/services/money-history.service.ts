import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { MoneyHistoryDTO } from '../interfaces/money-history.interface';

@Injectable({
  providedIn: 'root',
})
export class MoneyHistoryService {
  
  constructor(private http: HttpClient) { }

  BASE_URL = environment.apiUrl;

  getMoneyHistory(user_id: string) {
    return this.http.get(this.BASE_URL + '/money-history', { params: {user_id: user_id} })
  }

  createMoneyHistory(moneyHistory: MoneyHistoryDTO) {
    return this.http.post(this.BASE_URL + '/money-history', moneyHistory)
  }

}
