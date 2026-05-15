import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tokenResponse, validationTokenResponse } from '../interfaces/twitch.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CACHING_ENABLED } from '../auth/authorization.interceptor';
import { UserTwitchInfoResponse } from '../interfaces/user.interface';

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
      Authorization: 'Bearer ' + twitchToken
    }
    
    return this.http.get<validationTokenResponse>('https://id.twitch.tv/oauth2/validate', { headers: headers, context: new HttpContext().set(CACHING_ENABLED, false) })
  }

  refreshTwitchToken(twitchRefreshToken: string): Observable<tokenResponse> {
    return this.http.get<tokenResponse>(this.BASE_URL + '/twitch/refresh/' + twitchRefreshToken)
  }

  getUsersInfo(twitchToken: string, users: string[]) : Observable<UserTwitchInfoResponse> {
    const headers = {
      Authorization: 'Bearer ' + twitchToken,
      "Client-Id": "asbp5fyz7toklrqthtkyk6k4i3w9xe"
    }

    return this.http.post<UserTwitchInfoResponse>(this.BASE_URL + '/twitch/users/' + twitchToken , { headers: headers, context: new HttpContext().set(CACHING_ENABLED, false), users })
  }

}
