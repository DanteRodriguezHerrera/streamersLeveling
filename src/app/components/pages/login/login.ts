import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TwitchService } from '../../../core/services/twitch.service';
import { tokenResponse, validationTokenResponse } from '../../../core/interfaces/twitch.interface';
import { User, UserDTO, UserResponse } from '../../../core/interfaces/user.interface';
import { UserService } from '../../../core/services/user.service';
import { environment } from '../../../../environments/environment';
import { LoadingScreen } from '../../layouts/loading-screen/loading-screen';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-login',
  imports: [LoadingScreen, Toast],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  providers: [MessageService]
})
export class Login implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private twitchService = inject(TwitchService);
  private userService = inject(UserService);

  constructor(private messageService: MessageService) {}

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

  isLoading = signal<boolean>(false);

  userId: string | null = '';
  twitchToken: string | null = '';
  
  ngOnInit(): void {
    this.userId = localStorage.getItem('user');
    this.twitchToken = localStorage.getItem('twitchAuthToken');

    if(!this.userId !== null || !this.twitchToken) {
      localStorage.clear();
    }

    this.verifyUserExists()
  }

  verifyUserExists() {

    this.isLoading.set(true)

    if(this.userId !== null && this.twitchToken) {
      this.userService.getUser(this.userId).subscribe({
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
            this.isLoading.set(false)
          }
        },
        error: err => {
          console.log(err)
          this.isLoading.set(false)
        }
      })
    }
    else {
      this.route.queryParams.subscribe(params => {
        if(params['code'] !== undefined){
          this.getAuthorization(params['code'])
        }
        this.isLoading.set(false)
      })
    }
  }

  getAuthorization(code: string) {
    this.twitchService.getTwitchToken(code).subscribe({
      next: (res: tokenResponse) => {
        this.newUserInfo.access_token = res.access_token;
        this.newUserInfo.refresh_token = res.refresh_token

        this.validatedToken(res.access_token, res.refresh_token);
      },
      error: err => {
        console.log(err)
      }
    })
  }

  validatedToken(twitchToken: string, refreshToken: string = '') {
    if(!twitchToken) {
      localStorage.clear();
      this.isLoading.set(false)
      return;
    }

    this.twitchService.validateTwitchToken(twitchToken).subscribe({
      next: (resValidation: validationTokenResponse) => {
        if(this.userExists) {
          this.router.navigateByUrl("/agenda")
        }
        else {
          this.newUserInfo.channel_name = resValidation.login;

          this.userService.getUserByChannelName(resValidation.login).subscribe({
            next: (res) => {
              if(res.status === 200){
                localStorage.setItem('user', res.data.user_id)
                localStorage.setItem('twitchAuthToken', twitchToken)
                if(res.jwt_token){
                  localStorage.setItem('jwtToken', res.jwt_token)
                  this.userService.updateUser(res.data.user_id, {'access_token': twitchToken, 'refresh_token': refreshToken}).subscribe({
                    next: (res) => {
                      console.log(res)
                      this.router.navigateByUrl("/agenda")
                    },
                    error: err => {
                      console.log(err)
                    }
                  })
                }
              }
              else if(res.status === 404) {
                this.newUserInfo.twitch_id = resValidation.user_id;
                this.newUserInfo.expires_in = resValidation.expires_in;
                this.registerNewUser()
              }
            },
            error: err => {
              console.log(err)
            }
          })

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
        this.messageService.add({ severity: 'info', summary: 'Registro exitoso', detail: 'Se registro el usuario correctamente', life: 5000 });
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
