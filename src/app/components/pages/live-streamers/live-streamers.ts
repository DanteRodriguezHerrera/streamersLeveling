import { Component, inject, OnInit, signal } from '@angular/core';
import { UserTwitchInfoResponse } from '../../../core/interfaces/user.interface';
import { NoGroup } from '../../layouts/no-group/no-group';
import { TokenPayload } from '../../../core/interfaces/token.interface';
import { jwtDecode } from 'jwt-decode';
import { AgendaService } from '../../../core/services/agenda.service';
import { LiveStreamersResponse, SearchLiveStreams, TodayStreams } from '../../../core/interfaces/agenda.interface';
import { TwitchService } from '../../../core/services/twitch.service';
import { LoadingScreen } from '../../layouts/loading-screen/loading-screen';

@Component({
  selector: 'app-live-streamers',
  imports: [NoGroup, LoadingScreen],
  templateUrl: './live-streamers.html',
  styleUrl: './live-streamers.scss',
})
export class LiveStreamers implements OnInit {

  private agendaService = inject(AgendaService);
  private twitchService = inject(TwitchService);

  isLoading = signal<boolean>(true);

  liveChannels = signal<TodayStreams[]>([]);
  scheduledChannels = signal<TodayStreams[]>([]);
  channelsName: string[] = [];


  decoded: TokenPayload = {
    role: '',
    group: '',
    iat: 0,
    name: ''
  }

  ngOnInit(): void {
    const token = localStorage.getItem("jwtToken");

    if(token){
      this.decoded = jwtDecode<TokenPayload>(token);

      if(this.decoded.group !== null) {
        this.getStreams();
      }
    }
  }

  getStreams() {
    const nowDate: Date = new Date();

    const searchLiveStreams: SearchLiveStreams = {
      group_id: this.decoded.group,
      day_name: nowDate.toLocaleDateString("es-MX", {weekday: 'long'})[0].toUpperCase() + nowDate.toLocaleDateString("es-MX", {weekday: 'long'}).slice(1),
      hour_name: `${nowDate.getHours()}:00`
    }

    this.agendaService.getLiveStreams(searchLiveStreams).subscribe({
      next: (res: LiveStreamersResponse) => {

        this.liveChannels.set(res.data.live)
        this.scheduledChannels.set(res.data.scheduled)

      if(res.data.live.length > 0 || res.data.scheduled.length > 0) {
        res.data.live.forEach(live => {
          this.channelsName.push(live.user.channel_name)
        });
  
        res.data.scheduled.forEach(scheduled => {
          this.channelsName.push(scheduled.user.channel_name)
        });
  
        const twitchToken = localStorage.getItem('twitchAuthToken');
  
        if(twitchToken) {
          this.getUsersInfo(twitchToken, this.channelsName)
        }
      } 
      else {
        this.isLoading.set(false)
      }

      },
      error: err => {
        console.log(err)
      }
    })
  }

  getUsersInfo(twitchToken: string, channelNames: string[]) {
    this.twitchService.getUsersInfo(twitchToken, channelNames).subscribe({
      next: (res: UserTwitchInfoResponse) => {
        let photos = new Map<string, {profile_photo: string, display_name: string}>()

        res.data.forEach(element => {
          photos.set(element.login, {
            profile_photo: element.profile_image_url,
            display_name: element.display_name,
          })
        });
        
        this.liveChannels().map(live => {
          let photo = photos.get(live.user.channel_name)
          if(photo) {
            live.profile_photo = photo.profile_photo
            live.display_name = photo.display_name
          }
        });

        this.scheduledChannels().map(live => {
          let photo = photos.get(live.user.channel_name)
          if(photo) {
            live.profile_photo = photo.profile_photo
            live.display_name = photo.display_name
          }
        });

        this.scheduledChannels().sort((a, b) => a.hour.hour_name.localeCompare(b.hour.hour_name))

        this.isLoading.set(false)
      },
      error: err => {
        console.log(err)
      }
    })
  }
}
