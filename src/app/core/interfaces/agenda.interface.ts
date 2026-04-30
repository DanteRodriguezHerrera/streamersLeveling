import { HttpStatusCode } from "@angular/common/http";
import { Day } from "./day.interface";
import { Hour } from "./hour.interface";

export interface IAgenda {
    "user_id": string;
    "day_id": string;
    "hour_id": string;
}

export interface SearchLiveStreams {
  group_id: string;
  day_name: string;
  hour_name: string;
}

export interface LiveStreamersResponse {
  message: string;
  data: {
    live: TodayStreams[],
    scheduled: TodayStreams[]
  };
  status: HttpStatusCode
}

export interface TodayStreams {
  day: Day;
  hour: Hour;
  user: {
    channel_name: string;
    group_id: string;
    user_id: string;
  }
  profile_photo: string;
  display_name: string;
}