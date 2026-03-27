import { HttpStatusCode } from "@angular/common/http";

export interface Day {
    day_id: string;
    day_name: string;
}

export interface DayResponse {
    message: string;
    data: Day;
    status: HttpStatusCode;
}

export interface DaysResponse {
    message: string;
    data: Day[];
    status: HttpStatusCode;
}