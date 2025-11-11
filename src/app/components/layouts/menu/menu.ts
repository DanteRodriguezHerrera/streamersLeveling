import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {

  toggleRankingsSubmenu() {
    const rankingsSubmenu = document.getElementsByClassName("rankings");

    if (rankingsSubmenu[0].classList.contains("show")) {
      rankingsSubmenu[0].classList.remove("show");
      rankingsSubmenu[0].classList.add("hide");
    }
    else {
      rankingsSubmenu[0].classList.remove("hide");
      rankingsSubmenu[0].classList.add("show");
    }
  }

  toggleProfileSubmenu() {
    const profileSubmenu = document.getElementsByClassName("profile-options");

    if (profileSubmenu[0].classList.contains("show")) {
      profileSubmenu[0].classList.remove("show");
      profileSubmenu[0].classList.add("hide");
    } else {
      profileSubmenu[0].classList.remove("hide");
      profileSubmenu[0].classList.add("show");
    }

  }
}
