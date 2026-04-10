import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { GroupResponse, GroupsResponse } from '../interfaces/groups.interface';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  
    constructor(private http: HttpClient) { }

    BASE_URL = environment.apiUrl;

    getGroups() : Observable<GroupsResponse> {
      return this.http.get<GroupsResponse>(this.BASE_URL + "/groups");
    }

}
