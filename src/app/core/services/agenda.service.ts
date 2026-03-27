import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IAgenda } from '../interfaces/agenda.interface';

@Injectable({
  providedIn: 'root',
})
export class AgendaService {
  
    constructor(private http: HttpClient) { }

    BASE_URL = environment.apiUrl;
  
    getScheduledHours() {

      return this.http.get(this.BASE_URL + '/agenda/scheduled');
    }

    createSchedule(newAgenda: IAgenda) {

      return this.http.post(this.BASE_URL + '/agenda', newAgenda)
    }
}
