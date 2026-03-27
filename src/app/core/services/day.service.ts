import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DaysResponse } from '../interfaces/day.interface';

@Injectable({
  providedIn: 'root',
})
export class DayService {
  
    constructor(private http: HttpClient) { }

    BASE_URL = environment.apiUrl;

    getDays() {
      return this.http.get<DaysResponse>(this.BASE_URL + "/days")
    }
}
