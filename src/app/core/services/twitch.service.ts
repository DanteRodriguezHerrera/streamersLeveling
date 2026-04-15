import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tokenResponse, validationTokenResponse } from '../interfaces/twitch.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TwitchService {

  constructor(private http: HttpClient) { }

  BASE_URL = environment.apiUrl;

  getTwitchToken(twitchCode: string): Observable<tokenResponse> {
    return this.http.get<tokenResponse>(this.BASE_URL + '/twitch/' + twitchCode)
  }

  validateTwitchToken(twitchToken: string): Observable<validationTokenResponse> {
    const headers = {
      Authorization: 'OAuth ' + twitchToken
    }
    
    return this.http.get<validationTokenResponse>('https://id.twitch.tv/oauth2/validate', { headers: headers })
  }

  refreshTwitchToken(twitchRefreshToken: string): Observable<tokenResponse> {
    return this.http.get<tokenResponse>(this.BASE_URL + '/twitch/refresh/' + twitchRefreshToken)
  }

}
