import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserDTO, UserResponse } from '../interfaces/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  
  constructor(private http: HttpClient) { }

  BASE_URL = environment.apiUrl;

  registerUser (newUser: UserDTO) : Observable<UserResponse> {
    return this.http.post<UserResponse>(this.BASE_URL + '/users', newUser);
  }

  getUser (user_id: string) : Observable<UserResponse> {
    return this.http.get<UserResponse>(this.BASE_URL + '/users', {
      params: {
        user_id: user_id
      }
    })
  }
}
