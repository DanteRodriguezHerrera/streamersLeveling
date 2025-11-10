import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Twitch } from '../../../core/services/twitch.service';
import { tokenResponse, validationTokenResponse } from '../../../core/interfaces/twitch.interface';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {

  constructor(private route: ActivatedRoute, private twitchService: Twitch) { }

  code: string = '';
  userId: string = '';

  ngOnInit(): void {
    // this.route.queryParams.subscribe(params => {
    //   this.code = params['code'];
    // });

    // this.getAuthorization();

    // this.validatedToken();
  }

  getAuthorization() {

    this.twitchService.getTwitchToken(this.code).subscribe({
      next: (res: tokenResponse) => {
        console.log(res)
        localStorage.setItem('twitchAuthToken', res.access_token)
      },
      error: err => {
        console.log(err)
      }
    })
  }

  validatedToken() {
    this.twitchService.validateTwitchToken(localStorage.getItem('twitchAuthToken')!).subscribe({
      next: (res: validationTokenResponse) => {
        // console.log(res)
        this.userId = res.user_id;
        // this.getUserInfo();
      },
      error: err => {
        console.log(err)
      }
    })
  }

  // Esto se llamara desde el back debido a CORS
  // getUserInfo() {
  //   this.twitchService.getTwitchUser(this.userId, localStorage.getItem('twitchAuthToken')!).subscribe({
  //     next: (res: any) => {
  //       console.log(res)
  //     },
  //     error: err => {
  //       console.log(err)
  //     }
  //   })
  // }

}
