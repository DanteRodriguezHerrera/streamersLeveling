import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { MoneyReasonDTO, MoneyReasonResponse, MoneyReasonsResponse } from '../interfaces/money-reason.interface';

@Injectable({
  providedIn: 'root',
})
export class MoneyReasonService {

  constructor(private http: HttpClient) { }

  BASE_URL = environment.apiUrl;

  getMoneyReasons() : Observable<MoneyReasonsResponse> {
    return this.http.get<MoneyReasonsResponse>(this.BASE_URL + '/money-reasons')
  }

  editMoneyReason(idMoneyReason: string, moneyReasonInfo: MoneyReasonDTO) : Observable<MoneyReasonResponse> {
    return this.http.patch<MoneyReasonResponse>(this.BASE_URL + '/money-reasons/' + idMoneyReason, moneyReasonInfo)
  }
}
