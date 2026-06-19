import { HttpStatusCode } from "@angular/common/http";

export interface IGroup {
    group_id: string;
    group_name: string;
    clan_name: string;
}

export interface GroupResponse {
    message: string;
    data: IGroup;
    status: HttpStatusCode
}

export interface GroupsResponse {
    message: string;
    data: IGroup[];
    status: HttpStatusCode
}