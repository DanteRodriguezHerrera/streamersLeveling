import { Component, ElementRef, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ClickOutsideDirective } from '../../../core/directives/click-outside';

@Component({
  selector: 'app-menu',
  imports: [RouterLink, ClickOutsideDirective],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu implements OnInit {

  private userService = inject(UserService)

  refreshTime: number = 30 * 60000; // mili segundos a minutos

  mana = this.userService.mana;

  ngOnInit(): void {
    
    this.getUser();

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
      next: (res: any) => {
        this.userService.mana.set(res.data.actual_money);
      },
      error: err => {
        console.log(err)
      }
    })
  }

}
