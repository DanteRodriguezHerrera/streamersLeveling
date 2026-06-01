import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { UserService } from '../../../core/services/user.service';
import { ClickOutsideDirective } from '../../../core/directives/click-outside';
import { TokenPayload } from '../../../core/interfaces/token.interface';
import { UserResponse, UserTwitchInfoResponse } from '../../../core/interfaces/user.interface';
import { TwitchService } from '../../../core/services/twitch.service';
import { MoneyReasonService } from '../../../core/services/money-reason.service';
import { MoneyReason, MoneyReasonResponse, MoneyReasonsResponse } from '../../../core/interfaces/money-reason.interface';
import { FormsModule } from '@angular/forms';
import { validationTokenResponse, tokenResponse } from '../../../core/interfaces/twitch.interface';
import { AgendaService } from '../../../core/services/agenda.service';
import { SearchLiveStreams } from '../../../core/interfaces/agenda.interface';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-menu',
  imports: [RouterLink, ClickOutsideDirective, FormsModule,  ToastModule],
  providers: [MessageService],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu implements OnInit {

  private router = inject(Router);
  private userService = inject(UserService);
  private twitchService = inject(TwitchService);
  private moneyReasonService = inject(MoneyReasonService);
  private agendaService = inject(AgendaService);

  constructor(private messageService: MessageService) {}

  activeSubmenu: 'rankings' | 'profile-options' | null = null;
  isFirstLoadRankings = true;
  isFirstLoadProfile = true;

  refreshTime: number = 30 * 60000; // mili segundos a minutos
  checkLiveStreamersTime: number = 60 * 60000;

  mana = this.userService.mana;

  decoded: TokenPayload = {
    role: '',
    group: '',
    iat: 0,
    name: ''
  }

  profileImage = signal<string>('');

  moneyReasons = signal<MoneyReason[]>([]);
  editingIndex: number | null = null;
  newCost: number = 0;

  userId: string | null = ''

  ngOnInit(): void {

    this.userId = localStorage.getItem('user');

    this.verifyUserExists()
    this.getMoneyReason();

    setInterval(() => {
      this.verifyUserExists()
    }, this.refreshTime)
    
    setInterval(() => {
      this.checkLiveStreamers();
    }, this.checkLiveStreamersTime)
  }

  toggleSubmenu(name: 'rankings' | 'profile-options') {
    this.activeSubmenu = this.activeSubmenu === name ? null : name;
    if(name === 'rankings'){
      this.isFirstLoadRankings = false;
    }
    if(name === 'profile-options') {
      this.isFirstLoadProfile = false
    }
  }

  closeSubmenu() {
    this.activeSubmenu = null;
  }

  verifyUserExists() {
    if(this.userId) {
      this.userService.getUser(this.userId).subscribe({
        next: (res: UserResponse) => {
          if(res.status === 201) {
            this.validatedToken(res.data.access_token, res.data.refresh_token);

            if(res.jwt_token){
              this.decoded = jwtDecode<TokenPayload>(res.jwt_token)
              localStorage.setItem("jwtToken", res.jwt_token)
            }

            this.userService.mana.set(res.data.actual_money);
          }
          
          if(res.status === 204) {
            this.logout()
          }
        },
        error: err => {
          console.log(err)
        }
      })
    }
    else {
      this.logout()
    }
  }

  validatedToken(twitchToken: string, refreshToken: string = '') {
    this.twitchService.validateTwitchToken(twitchToken).subscribe({
      next: (res: validationTokenResponse) => {
        const twitchToken = localStorage.getItem('twitchAuthToken');
        if(twitchToken) {
          this.twitchService.getUsersInfo(twitchToken, [res.login]).subscribe({
            next: (res: UserTwitchInfoResponse) => {
              this.profileImage.set(res.data[0].profile_image_url);
            },
            error: err => {
              console.log(err)
            }
          })
        }
      },
      error: (err) => {
        console.log(err)
        this.refreshNewToken(refreshToken)
      }
    })
  }

  refreshNewToken(refreshToken: string) {
    this.twitchService.refreshTwitchToken(refreshToken).subscribe({
      next: (res: tokenResponse) => {
        localStorage.setItem('twitchAuthToken', res.access_token)
        this.validatedToken(res.access_token)

        this.userService.updateUser(this.userId!, {"access_token": res.access_token}).subscribe({
          next: () => {

          },
          error: err => {
            console.log(err)
          }
        })
      },
      error: err => {
        console.log(err)
      }
    })
  }

  getMoneyReason() {
    this.moneyReasonService.getMoneyReasons().subscribe({
      next: (res: MoneyReasonsResponse) => {
        this.moneyReasons.set(res.data)
      },
      error: err => {
        console.log(err)
      }
    })
  }

  enableEditing(index: number ,actualCost: number) {
    this.editingIndex = index;
    this.newCost = actualCost;
  }

  confirmEdit(idMoneyHistory: string, newCost: number) {
    this.editingIndex = null;

    this.moneyReasonService.editMoneyReason(idMoneyHistory, {"quantity": newCost}).subscribe({
      next: (res: MoneyReasonResponse) => {
        this.getMoneyReason()
      },
      error: err => {
        console.log(err)
      }
    })
  }

  cancelEdit() {
    this.editingIndex = null;
  }

  logout() {
    localStorage.clear();
    this.router.navigateByUrl('/login')
  }

  checkLiveStreamers() {
    const nowDate: Date = new Date();

    const searchLiveStreams: SearchLiveStreams = {
      group_id: this.decoded.group,
      day_name: nowDate.toLocaleDateString("es-MX", {weekday: 'long'})[0].toUpperCase() + nowDate.toLocaleDateString("es-MX", {weekday: 'long'}).slice(1),
      hour_name: `${nowDate.getHours()}:00`
    }

    this.agendaService.getLiveStreams(searchLiveStreams).subscribe({
      next: (res) => {
        if(res.data.live.length !== 0) {
          this.messageService.add({ severity: 'info', summary: 'Streamers en vivo', detail: 'Ve y apoya a los streamers agendados', life: 5000 });
        }
        else {
          this.messageService.add({ severity: 'info', summary: 'No hay streamers agendados', detail: 'Espera la siguiente hora y checa de nuevo la sección de apoyo', life: 5000 });
        }
      },
      error: err => {
        console.error(err)
      }
    })
  }
}
