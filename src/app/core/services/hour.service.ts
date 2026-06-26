import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HoursResponse } from '../interfaces/hour.interface';

@Injectable({
  providedIn: 'root',
})
export class HourService {
  
    constructor(private http: HttpClient) { }

    BASE_URL = environment.apiUrl;

    getHours() {
      return this.http.get<HoursResponse>(this.BASE_URL + '/hours');
    }

    getAvailableHours(user_id: string, group_id: string, day_id: string, currentTime: string) {
      return this.http.post<HoursResponse>(this.BASE_URL + '/hours/no-scheduled', {user_id, group_id, day_id, currentTime})
    }
}
