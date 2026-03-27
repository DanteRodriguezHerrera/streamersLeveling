import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TwitchService } from '../../../core/services/twitch.service';
import { tokenResponse, validationTokenResponse } from '../../../core/interfaces/twitch.interface';
import { User, UserDTO, UserResponse } from '../../../core/interfaces/user.interface';
import { UserService } from '../../../core/services/user.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private twitchService = inject(TwitchService);
  private userService = inject(UserService);

  redirect_uri: string = environment.redirect_uri

  newUserInfo: UserDTO = {
    twitch_id: '',
    role_id: '',
    group_id: '',
    access_token: '',
    expires_in: 0,
    refresh_token: '',
    actual_money: 0,
    channel_name: ''
  }

  user: User = {
    user_id: '',
    twitch_id: '',
    role_id: '',
    group_id: '',
    access_token: '',
    expires_in: 0,
    refresh_token: '',
    actual_money: 0,
    channel_name: ''
  }
  
  ngOnInit(): void {

    console.log(this.redirect_uri)

    this.route.queryParams.subscribe(params => {
      params['code'] ? this.getAuthorization(params['code']) : this.validatedToken();
    });

  }

  getAuthorization(code: string) {

    this.twitchService.getTwitchToken(code).subscribe({
      next: (res: tokenResponse) => {
        console.log(res)
        this.newUserInfo.access_token = res.access_token;
        this.newUserInfo.refresh_token = res.refresh_token

        localStorage.setItem('twitchAuthToken', res.access_token)

        this.validatedToken();
      },
      error: err => {
        console.log(err)
      }
    })
  }

  validatedToken() {
    if(localStorage.getItem('twitchAuthToken')) {
      this.twitchService.validateTwitchToken(localStorage.getItem('twitchAuthToken')!).subscribe({
        next: (validationResponse: validationTokenResponse) => {
          console.log(validationResponse)
          this.userService.getUser(validationResponse.user_id).subscribe({
            next: (userResponse: UserResponse) => {
              // console.log(userResponse)
  
              if(userResponse.status == 204 && this.newUserInfo.access_token != '') {
                this.newUserInfo.twitch_id = validationResponse.user_id;
                this.newUserInfo.expires_in = validationResponse.expires_in;
                this.newUserInfo.channel_name = validationResponse.login;

                localStorage.setItem('channel_name', validationResponse.login)
  
                this.registerNewUser();
              }

              if(userResponse.status == 201) {
                // this.router.navigateByUrl("/agenda")
              }
            },
            error: err => {
              console.log(err)
              console.log(err.status)
            }
          
          })
        },
        error: err => {
          console.log(err)
          console.log(err.status)
        }
      })
    }

  }

  registerNewUser() {
    this.userService.registerUser(this.newUserInfo).subscribe({
      next: (res: UserResponse) => {
        // console.log(res.data)
        // this.router.navigateByUrl("/agenda")

        localStorage.setItem('user', res.data.user_id);
      },
      error: err => {
        console.log(err)
      }
    })
  }

}
