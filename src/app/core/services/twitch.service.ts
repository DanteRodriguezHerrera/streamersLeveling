import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tokenParameters, tokenResponse, validationTokenResponse } from '../interfaces/twitch.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Twitch {

  constructor(private http: HttpClient) { }

  getTwitchToken(twitchCode: string): Observable<tokenResponse> {

    const getTokenParameters: tokenParameters = {
      client_id: 'asbp5fyz7toklrqthtkyk6k4i3w9xe',
      client_secret: 'o88mnh2sm5jh7rgvdwiejhwpae70u1',
      code: twitchCode,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:4200'
    }

    return this.http.post<tokenResponse>('https://id.twitch.tv/oauth2/token', getTokenParameters)
  }

  validateTwitchToken(twitchToken: string): Observable<validationTokenResponse> {

    const headers = {
      Authorization: 'OAuth ' + twitchToken
    }

    return this.http.get<validationTokenResponse>('https://id.twitch.tv/oauth2/validate', { headers: headers })
  }

  // getTwitchUser(userId: string, twitchToken: string) {
  //   const headers = {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${twitchToken}`,
  //     client_id: 'asbp5fyz7toklrqthtkyk6k4i3w9xe',
  //   }

  //   return this.http.get('/api', { headers: headers, params: { id: userId } })
  // }
}
