import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { UserService } from '../../../core/services/user.service';
import { ClickOutsideDirective } from '../../../core/directives/click-outside';
import { TokenPayload } from '../../../core/interfaces/token.interface';
import { UserResponse, UserTwitchInfoResponse } from '../../../core/interfaces/user.interface';
import { TwitchService } from '../../../core/services/twitch.service';
import { MoneyReasonService } from '../../../core/services/money-reason.service';
import { MoneyReason, MoneyReasonResponse, MoneyReasonsResponse } from '../../../core/interfaces/money-reason.interface';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu',
  imports: [RouterLink, ClickOutsideDirective, FormsModule],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu implements OnInit {

  private userService = inject(UserService);
  private twitchService = inject(TwitchService);
  private moneyReasonService = inject(MoneyReasonService)

  activeSubmenu: 'rankings' | 'profile-options' | null = null;
  isFirstLoadRankings = true;
  isFirstLoadProfile = true;

  refreshTime: number = 30 * 60000; // mili segundos a minutos

  mana = this.userService.mana;

  decoded: TokenPayload = {
    role: '',
    group: '',
    iat: 0,
  }

  profileImage = signal<string>('');

  moneyReasons = signal<MoneyReason[]>([]);
  editingIndex: number | null = null;
  newCost: number = 0;

  ngOnInit(): void {
    
    this.getUser();
    this.getMoneyReason();

    setInterval(() => {
      this.getUser()
    }, this.refreshTime)
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
  
  getUser() {
    this.userService.getUser(localStorage.getItem('user')!).subscribe({
      next: (res: UserResponse) => {
        this.userService.mana.set(res.data.actual_money);
        if(res.jwt_token){
          this.decoded = jwtDecode<TokenPayload>(res.jwt_token)
          localStorage.setItem("jwtToken", res.jwt_token)
        }

        const twitchToken = localStorage.getItem('twitchAuthToken');
        if(twitchToken) {
          this.twitchService.getUsersInfo(twitchToken, [res.data.channel_name]).subscribe({
            next: (res: UserTwitchInfoResponse) => {
              this.profileImage.set(res.data[0].profile_image_url);
            },
            error: err => {
              console.log(err)
            }
          })
        }

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
}
