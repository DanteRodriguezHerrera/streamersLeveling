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
}
