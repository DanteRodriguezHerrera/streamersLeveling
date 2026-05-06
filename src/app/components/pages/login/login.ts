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

  redirect_uri: string = environment.redirect_uri;

  userExists: boolean = false;

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
    channel_name: '',
    group: {
      group_id: '',
      group_name: ''
    },
    role: {
      role_id: '',
      role_name: ''
    }
  }
  
  ngOnInit(): void {
    this.verifyUserExists()
  }

  verifyUserExists() {

    const userId = localStorage.getItem('user');

    if(userId !== null) {
      this.userService.getUser(userId).subscribe({
        next: (res: UserResponse) => {
          if(res.status === 201) {
            this.userExists = true;
            this.validatedToken(res.data.access_token, res.data.refresh_token);

            const jwtToken = localStorage.getItem('jwtToken');
            if(jwtToken !== null) {
              localStorage.setItem("jwtToken", jwtToken)
            }
          }
          
          if(res.status === 204) {
            localStorage.clear()
            this.router.navigateByUrl("/login")
          }
        },
        error: err => {
          console.log(err)
        }
      })
    }
    else {
      this.route.queryParams.subscribe(params => {
        if(params['code'] !== undefined){
          this.getAuthorization(params['code'])
        }
      })
    }
  }

  getAuthorization(code: string) {
    this.twitchService.getTwitchToken(code).subscribe({
      next: (res: tokenResponse) => {
        this.newUserInfo.access_token = res.access_token;
        this.newUserInfo.refresh_token = res.refresh_token

        this.validatedToken(res.access_token);
      },
      error: err => {
        console.log(err)
      }
    })
  }

  validatedToken(twitchToken: string, refreshToken: string = '') {
    this.twitchService.validateTwitchToken(twitchToken).subscribe({
      next: (res: validationTokenResponse) => {       
        if(this.userExists) {
          this.router.navigateByUrl("/agenda")
        }
        else {
          this.newUserInfo.twitch_id = res.user_id;
          this.newUserInfo.expires_in = res.expires_in;
          this.newUserInfo.channel_name = res.login;
          this.registerNewUser()
        }
      },
      error: () => {        
        this.refreshNewToken(refreshToken)
      }
    })
  }

  registerNewUser() {
    this.userService.registerUser(this.newUserInfo).subscribe({
      next: (res: UserResponse) => {
        this.router.navigateByUrl("/agenda")

        localStorage.setItem('user', res.data.user_id);
        localStorage.setItem('twitchAuthToken', this.newUserInfo.access_token);
        if(res.jwt_token){
          localStorage.setItem('jwtToken', res.jwt_token)
        }
      },
      error: err => {
        console.log(err)
      }
    })
  }

  refreshNewToken(refreshToken: string) {
    this.twitchService.refreshTwitchToken(refreshToken).subscribe({
      next: (res: tokenResponse) => {
        localStorage.setItem('twitchAuthToken', res.access_token)
        this.validatedToken(res.access_token)
      },
      error: err => {
        console.log(err)
      }
    })
  }

}
