import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  
  constructor(private http: HttpClient) { }

  BASE_URL = environment.apiUrl;

  getRoles() {
    return this.http.get(this.BASE_URL + "/roles")
  }
}
