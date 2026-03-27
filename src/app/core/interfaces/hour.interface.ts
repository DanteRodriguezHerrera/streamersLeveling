import { HttpStatusCode } from "@angular/common/http";

export interface Hour {
    hour_id: string;
    hour_name: string;
}

export interface HourResponse {
    message: string;
    data: Hour;
    status: HttpStatusCode
}

export interface HoursResponse {
    message: string;
    data: Hour[];
    status: HttpStatusCode
}