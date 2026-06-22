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

    getGroup(group_id: string) : Observable<GroupResponse> {
      return this.http.get<GroupResponse>(this.BASE_URL + "/groups/" + group_id)
    }

    getGroups() : Observable<GroupsResponse> {
      return this.http.get<GroupsResponse>(this.BASE_URL + "/groups");
    }

    createGroup() : Observable<GroupResponse> {
      return this.http.post<GroupResponse>(this.BASE_URL + "/groups", {})
    }

    editGroup(group_id: string, clan_name: string) : Observable<GroupResponse> {
      return this.http.patch<GroupResponse>(this.BASE_URL + "/groups/" + group_id + "/", { clanName: clan_name })
    }

    deleteGroup(group_id: string) : Observable<GroupResponse> {
      return this.http.delete<GroupResponse>(this.BASE_URL + "/groups/" + group_id)
    }

}
