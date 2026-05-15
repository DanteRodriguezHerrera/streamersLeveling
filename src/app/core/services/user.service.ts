import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserDTO, UserResponse, UsersResponse } from '../interfaces/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  
  constructor(private http: HttpClient) { }

  BASE_URL = environment.apiUrl;

  mana = signal(0);

  registerUser (newUser: UserDTO) : Observable<UserResponse> {
    return this.http.post<UserResponse>(this.BASE_URL + '/users', newUser);
  }

  getUser (user_id: string) : Observable<UserResponse> {
    return this.http.get<UserResponse>(this.BASE_URL + '/users/' + user_id);
  }

  getUsers() : Observable<UsersResponse> {
    return this.http.get<UsersResponse>(this.BASE_URL + '/users');
  }

  getUserByChannelName(channel_name: string) : Observable<UserResponse> {
    return this.http.get<UserResponse>(this.BASE_URL + '/users/byChannelName/' + channel_name)
  }

  getUsersByGroup(group_id: string | null) : Observable<UsersResponse> {
    return this.http.get<UsersResponse>(this.BASE_URL + '/users/byGroup/' + group_id);
  }

  updateUser (user_id: string, userNewInfo: any) : Observable<UserResponse> {
    return this.http.patch<UserResponse>(this.BASE_URL + '/users/' + user_id, userNewInfo);
  }
}
