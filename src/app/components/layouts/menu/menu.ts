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

  toggleSubmenu(className: string) {
    const submenu = document.getElementsByClassName(className);

    submenu[0].classList.remove("hide");
    submenu[0].classList.add("show");
    if(className == 'rankings' && document.getElementsByClassName('profile-options')[0].classList.contains('show')) {
      document.getElementsByClassName('profile-options')[0].classList.remove('show')
      document.getElementsByClassName('profile-options')[0].classList.add('hide')
    }
    if(className == 'profile-options' && document.getElementsByClassName('rankings')[0].classList.contains('show')) {
      document.getElementsByClassName('rankings')[0].classList.remove('show')
      document.getElementsByClassName('rankings')[0].classList.add('hide')
    }
  }

  closeSubmenu() {
    const rankingsSubmenu = document.getElementsByClassName('rankings');
    const profileSubmenu = document.getElementsByClassName('profile-options');

    if(rankingsSubmenu[0].classList.contains("show")) {
      rankingsSubmenu[0].classList.remove("show");
      rankingsSubmenu[0].classList.add("hide");
    }

    if(profileSubmenu[0].classList.contains("show")) {
      profileSubmenu[0].classList.remove("show");
      profileSubmenu[0].classList.add("hide");
    }
  }
  
  getUser() {
    this.userService.getUser(localStorage.getItem('user')!).subscribe({
      next: (res: UserResponse) => {
        this.userService.mana.set(res.data.actual_money);
        if(res.jwt_token){
          this.decoded = jwtDecode<TokenPayload>(res.jwt_token)
          localStorage.setItem("jwtToken", res.jwt_token)

          const submenu = document.getElementsByClassName("rankings");

          if(this.decoded.role === 'superadmin') {
            submenu[0].classList.add("rankings-superadmin")
          }
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
