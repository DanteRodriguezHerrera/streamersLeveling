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
  
    getScheduledHours(group_id: string) {
      return this.http.get(this.BASE_URL + '/agenda/scheduled/' + group_id);
    }

    createSchedule(newAgenda: IAgenda) {
      return this.http.post(this.BASE_URL + '/agenda', newAgenda)
    }

    getLiveStreams(searchLiveStreams: SearchLiveStreams) : Observable<LiveStreamersResponse> {
      return this.http.post<LiveStreamersResponse>(this.BASE_URL + '/agenda/todayStreams', searchLiveStreams)
    }

    getScheduledHoursByUser(user_id: string) {
      return this.http.get(this.BASE_URL + '/agenda/my-hours/' + user_id)
    }

    deleteOneHourScheduled(user_id: string, day_id: string, hour_id: string) {
      return this.http.delete(this.BASE_URL + '/agenda/deleteHour/' + user_id + '/' + day_id + '/' + hour_id)
    }
}
