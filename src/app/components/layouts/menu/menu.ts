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
import { MoneyHistoryDTO } from '../../../core/interfaces/money-history.interface';
import { MoneyHistoryService } from '../../../core/services/money-history.service';

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
  private moneyHistoryService = inject(MoneyHistoryService);
  
  constructor(private messageService: MessageService) {}

  activeSubmenu: 'rankings' | 'profile-options' | null = null;
  isFirstLoadRankings = signal<boolean>(true);
  isFirstLoadProfile = signal<boolean>(true);

  refreshTime = signal<number>(30 * 60000); // mili segundos a minutos
  liveStreamersTime = signal<number>(0);

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

  // Connect the websocket to the Twitch IRC Server 
  chatObserver = new WebSocket("wss://irc-ws.chat.twitch.tv:443")
  joinChatsCommand: string = 'JOIN ';
  chat1 = signal<string>('');
  chat2 = signal<string>('');
  myChannel = signal<string>('');
  countMessage1 = signal<number>(0);
  countMessage2 = signal<number>(0);
  isFirstGain1 = signal<boolean>(true);
  isFirstGain2 = signal<boolean>(true);

  manaPerView = signal<number>(0);
  commentPerView = signal<string>('');
  manaPerSub = signal<number>(0);
  commentPerSub = signal<string>('')

  ngOnInit(): void {

    this.userId = localStorage.getItem('user');

    this.verifyUserExists()
    this.getMoneyReason();

    setInterval(() => {
      this.verifyUserExists()
    }, this.refreshTime())
  }

  toggleSubmenu(name: 'rankings' | 'profile-options') {
    this.activeSubmenu = this.activeSubmenu === name ? null : name;
    if(name === 'rankings'){
      this.isFirstLoadRankings.set(false);
    }
    if(name === 'profile-options') {
      this.isFirstLoadProfile.set(false);
    }
  }

  closeSubmenu() {
    this.activeSubmenu = null;
  }

  checkLiveStreamersTimer() {
    this.liveStreamersTime.set((60 - new Date().getMinutes()) * 60000)

    if((this.liveStreamersTime() / 60000) <= 59) {
      setTimeout(() => {
        this.checkLiveStreamers();
        this.checkLiveStreamersTimer();
      }, this.liveStreamersTime())
    }
    else{
      setInterval(() => {
        this.checkLiveStreamers();
      }, this.liveStreamersTime())
    }
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
              this.myChannel.set(this.decoded.name);
              this.checkLiveStreamersTimer();
              this.checkLiveStreamers();
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
        res.data.forEach(reasons => {
          if(reasons.reason === 2) {
            this.manaPerView.set(reasons.quantity);
            this.commentPerView.set(reasons.description);
          }
          if(reasons.reason === 4) {
            this.manaPerSub.set(reasons.quantity);
            this.commentPerSub.set(reasons.description)
          }
        });
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

    if((this.liveStreamersTime() / 60000) < 30) {
      this.messageService.add({ severity: 'info', summary: 'Espera la siguiente hora', detail: 'Ve y apoya a los streamers agendados la siguiente hora', life: 5000 });
    }
    else {
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
  
            res.data.live.forEach((channel, i) => {
              if(i === 0) {
                this.chat1.set(channel.user.channel_name);
              }
              if(i === 1) {
                this.chat2.set(channel.user.channel_name);
              }
              this.joinChatsCommand += `#${channel.user.channel_name},`
            });
  
            this.startListenChat();
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

  startListenChat() {
    this.chatObserver.addEventListener("open", () => {

      // Requesting Twitch Capabilities
      this.chatObserver.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands')

      // Anonymous credentials just to listen chat events (read-only)
      this.chatObserver.send("PASS SCHMOOPIIE\r\n");
      this.chatObserver.send(`NICK justinfan${Math.floor(Math.random() * 100000)}\r\n`);

      // Join to the chat of the streamer
      this.chatObserver.send(this.joinChatsCommand)

      console.log("Se estableció la conexión")

      this.checkUserComments();
    })

    this.chatObserver.addEventListener("message", (event) => {
      const message = event.data;

      // Twitch verification the connection stills up
      if (message.startsWith("PING")) {
          this.chatObserver.send("PONG :tmi.twitch.tv\r\n");
          return;
      }

      // Detects every "normal" message in chat
      if (message.includes("PRIVMSG")) {
        const regex = /:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #(\w+) :(.*)/;
        const match = message.match(regex);

        if(match[1] == this.myChannel()){
          if(match[2].includes(this.chat1())) {
            this.countMessage1.update(count => count + 1)
            if(this.countMessage1() === 5) {
              this.messageService.add({ severity: 'info', summary: '1ra meta alcanzada', detail: 'Has completado los comentarios, sigue viendo por 30 minutos para obtener tu mana correspondiente', sticky: true });
            }
            if(this.countMessage1() === 10) {
              this.messageService.add({ severity: 'info', summary: '2da meta alcanza', detail: 'Has completado los comentarios, sigue viendo para completar la hora de apoyo para obtener tu mana correspondiente', sticky: true });
            }
          }
          if(this.chat2() && match[2].includes(this.chat2())) {
            this.countMessage2.update(count => count + 1)
            if(this.countMessage2() === 5) {
              this.messageService.add({ severity: 'info', summary: '1ra meta alcanzada', detail: 'Has completado los comentarios, sigue viendo por 30 minutos para obtener tu mana correspondiente', sticky: true });
            }
            if(this.countMessage2() === 10) {
              this.messageService.add({ severity: 'info', summary: '2da meta alcanza', detail: 'Has completado los comentarios, sigue viendo para completar la hora de apoyo para obtener tu mana correspondiente', sticky: true });
            }
          }
        }
      }

      // Detects if someone subscribe/resubscribe to the channel
      if(message.includes("msg-id=sub") || message.includes("msg-id=resub")) {
        const regex = /display-name=(\w+).*USERNOTICE #(\w+)/;
        const match = message.match(regex);

        if(match[1] === this.myChannel()){
          if(this.userId) {
            if(match[2].includes(this.chat1())){
              this.createNewHistory({quantity: this.manaPerSub(), reason: `${this.commentPerSub()} - ${this.chat1()}`, user_id: this.userId});
              this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerSub} mana`, detail: `Te suscribiste o regalaste subs en el canal de ${this.chat1()}`, sticky: true })
            }
            if(this.chat2() && match[2].includes(this.chat2())){
              this.createNewHistory({quantity: this.manaPerSub(), reason: `${this.commentPerSub()} - ${this.chat2()}`, user_id: this.userId});
              this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerSub} mana`, detail: `Te suscribiste o regalaste subs en el canal de ${this.chat2()}`, sticky: true })
            }
          }
        }
      }
    })

    this.chatObserver.addEventListener("error", (event) => {
      console.log(event);
      console.log("Ocurrió un error en la conexión")
    })
  }

  checkUserComments() {
    // Checks every 30 minutes for gain 1 mana
    setInterval(() => {
      if(this.userId) {
        if(this.countMessage1() >= 1 && this.isFirstGain1()) {
          this.createNewHistory({quantity: this.manaPerView(), reason: `${this.commentPerView()} - ${this.chat1()}`, user_id: this.userId});
          this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerView()} mana`, detail: `Apoyando a ${this.chat1()}` })
          this.isFirstGain1.set(false)
        }
        if(this.countMessage2() >= 1 && this.isFirstGain2()) {
          this.createNewHistory({quantity: this.manaPerView(), reason: `${this.commentPerView()} - ${this.chat2()}`, user_id: this.userId});
          this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerView()} mana`, detail: `Apoyando a ${this.chat1()}` })
          this.isFirstGain2.set(false)
        }
      }
    }, (30 * 60000))
      
    // Checks every hour for gain 1 mana or gain 2 for the extra
    setInterval(() => {
      if(this.userId) {
        if(this.countMessage1() >= 10) {
          let extraMana = this.countMessage1() >= 15 ? this.manaPerView() + 1 : this.manaPerView();
          let extraReason = this.countMessage1() >= 15 ? `${this.commentPerView()} + extra - ${this.chat1()}` : `${this.commentPerView()} - ${this.chat1()}`;
          let extraComment = this.countMessage1() >= 15 ?  `Apoyando a ${this.chat1()} y un extra` :  `Apoyando a ${this.chat1()}`;

          this.createNewHistory({quantity: extraMana, reason: extraReason, user_id: this.userId});
          this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerView()} mana`, detail: extraComment })
        }
        if(this.countMessage2() >= 10) {
          let extraMana = this.countMessage2() >= 15 ? this.manaPerView() + 1 : this.manaPerView();
          let extraReason = this.countMessage2() >= 15 ? `${this.commentPerView()} + extra - ${this.chat1()}` : `${this.commentPerView()} - ${this.chat1()}`;
          let extraComment = this.countMessage2() >= 15 ?  `Apoyando a ${this.chat1()} y un extra` :  `Apoyando a ${this.chat1()}`;

          this.createNewHistory({quantity: extraMana, reason: extraReason, user_id: this.userId});
          this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerView()} mana`, detail: extraComment })
        }
      }

      this.countMessage1.set(0);
      this.countMessage2.set(0);
      this.chatObserver.close()
    }, (60 * 60000));
  }

  createNewHistory(newMoneyHistory: MoneyHistoryDTO) {
    this.moneyHistoryService.createMoneyHistory(newMoneyHistory).subscribe({
      next: () => {
        if(this.userId) {
          this.userService.getUser(this.userId).subscribe({
            next: (res) => {
              this.userService.mana.set(res.data.actual_money)
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
}
