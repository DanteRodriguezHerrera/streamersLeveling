import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IAgenda, LiveStreamersResponse, SearchLiveStreams } from '../interfaces/agenda.interface';
import { Observable } from 'rxjs';

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

    getLiveStreams(searchLiveStreams: SearchLiveStreams) : Observable<LiveStreamersResponse> {
      return this.http.post<LiveStreamersResponse>(this.BASE_URL + '/agenda/todayStreams', searchLiveStreams)
    }

}
