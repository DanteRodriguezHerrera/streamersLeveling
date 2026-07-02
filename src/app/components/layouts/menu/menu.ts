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
  partChatsCommand: string = 'PART '
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

  private manaInterval30: ReturnType<typeof setInterval> | null = null;
  private manaInterval60: ReturnType<typeof setInterval> | null = null;
  private chatMessageHandler: ((event: MessageEvent) => void) | null = null;
  private chatErrorHandler: ((event: Event) => void) | null = null;
  private isChatInitialized = false

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

              if (!this.isChatInitialized) {
                this.isChatInitialized = true;
                this.setupChatListeners();
                this.checkLiveStreamersTimer();
                this.checkLiveStreamers();
              }
            }

            this.userService.mana.set(res.data.actual_money);
          }
          
          if(res.status === 204) {
            this.logout()
          }
        },
        error: err => {
          this.messageService.add({ severity: 'error', summary: 'Error de verificación', detail: 'No se pudo verificar el usuario.', sticky: true });
          if(err.status === 401 || err.status === 404){
            this.logout()
          }
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
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener la información del perfil.', sticky: true });
            }
          })
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error de validación', detail: 'No se pudo validar el token de Twitch.', sticky: true });
        if(err.status === 401){
          localStorage.clear();
          this.router.navigateByUrl("/login");
          return;
        }
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
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el token en la base de datos.', sticky: true });
          }
        })
      },
      error: err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo renovar el token de Twitch.', sticky: true });
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
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las razones de maná.', sticky: true });
      }
    })
  }

  setupChatListeners() {
    const ircRegister = () => {
      this.chatObserver.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands')
      this.chatObserver.send("PASS SCHMOOPIEII\r\n");
      this.chatObserver.send(`NICK justinfan${Math.floor(Math.random() * 100000)}\r\n`);
    };

    if (this.chatObserver.readyState === WebSocket.OPEN) {
      ircRegister();
    } else {
      this.chatObserver.addEventListener("open", ircRegister, { once: true });
    }

    this.chatMessageHandler = (event) => {
      const message = event.data;

      console.log("Se establecio la conexion")

      if (message.startsWith("PING")) {
          this.chatObserver.send("PONG :tmi.twitch.tv\r\n");
          return;
      }

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
    };
    this.chatObserver.addEventListener("message", this.chatMessageHandler);

    this.chatErrorHandler = (event) => {
      console.log(event);
      console.log("Ocurrió un error en la conexión")
    };
    this.chatObserver.addEventListener("error", this.chatErrorHandler);
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
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo editar el costo de maná.', sticky: true });
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
    // PART from previous chats before connecting to new ones
    if (this.partChatsCommand !== 'PART ') {
      this.chatObserver.send(this.partChatsCommand);
    }

    // Reset commands and state for the new hour
    this.joinChatsCommand = 'JOIN ';
    this.partChatsCommand = 'PART ';
    this.chat1.set('');
    this.chat2.set('');
    this.countMessage1.set(0);
    this.countMessage2.set(0);
    this.isFirstGain1.set(true);
    this.isFirstGain2.set(true);

    if((this.liveStreamersTime() / 60000) < 30) {
      this.messageService.add({ severity: 'info', summary: 'Espera la siguiente hora', detail: 'Ve y apoya a los streamers agendados la siguiente hora', sticky: true });
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
            this.messageService.add({ severity: 'info', summary: 'Streamers en vivo', detail: 'Ve y apoya a los streamers agendados', sticky: true });
  
            res.data.live.forEach((channel, i) => {
              if(i === 0) {
                this.chat1.set(channel.user.channel_name);
              }
              if(i === 1) {
                this.chat2.set(channel.user.channel_name);
              }
              this.joinChatsCommand += `#${channel.user.channel_name},`
              this.partChatsCommand += `#${channel.user.channel_name},`
            });

            console.log(this.joinChatsCommand)
            
            setTimeout(() => {
              this.chatObserver.send(this.joinChatsCommand)
              this.resetManaIntervals();
            }, 1000)
          }
          else {
            this.messageService.add({ severity: 'info', summary: 'No hay streamers agendados', detail: 'Espera la siguiente hora y checa de nuevo la sección de apoyo', sticky: true });
          }
        },
        error: err => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron consultar los streamers en vivo.', sticky: true });
        }
      })
    }
  }

  resetManaIntervals() {
    if (this.manaInterval30) {
      clearInterval(this.manaInterval30);
      this.manaInterval30 = null;
    }
    if (this.manaInterval60) {
      clearInterval(this.manaInterval60);
      this.manaInterval60 = null;
    }

    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const msUntil30 = minutes < 30 ? ((30 - minutes) * 60 - seconds) * 1000 : ((60 - minutes) * 60 - seconds) * 1000;
    const msUntil60 = ((60 - minutes) * 60 - seconds) * 1000;

    setTimeout(() => {
      if(this.userId) {
        if(this.countMessage1() >= 1 && this.isFirstGain1()) {
          this.createNewHistory({quantity: this.manaPerView(), reason: `${this.commentPerView()} - ${this.chat1()}`, user_id: this.userId});
          this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerView()} mana`, detail: `Apoyando a ${this.chat1()}`, sticky: true })
          this.isFirstGain1.set(false)
        }
        if(this.countMessage2() >= 1 && this.isFirstGain2()) {
          this.createNewHistory({quantity: this.manaPerView(), reason: `${this.commentPerView()} - ${this.chat2()}`, user_id: this.userId});
          this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerView()} mana`, detail: `Apoyando a ${this.chat1()}`, sticky: true })
          this.isFirstGain2.set(false)
        }
      }
      this.manaInterval30 = setInterval(() => {
        if(this.userId) {
          if(this.countMessage1() >= 1 && this.isFirstGain1()) {
            this.createNewHistory({quantity: this.manaPerView(), reason: `${this.commentPerView()} - ${this.chat1()}`, user_id: this.userId});
            this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerView()} mana`, detail: `Apoyando a ${this.chat1()}`, sticky: true })
            this.isFirstGain1.set(false)
          }
          if(this.countMessage2() >= 1 && this.isFirstGain2()) {
            this.createNewHistory({quantity: this.manaPerView(), reason: `${this.commentPerView()} - ${this.chat2()}`, user_id: this.userId});
            this.messageService.add({ severity: 'info', summary: `Ganaste ${this.manaPerView()} mana`, detail: `Apoyando a ${this.chat1()}`, sticky: true })
            this.isFirstGain2.set(false)
          }
        }
      }, (30 * 60000))
    }, msUntil30);

    setTimeout(() => {
      if(this.userId) {
        if(this.countMessage1() >= 10) {
          let extraMana = Math.floor((this.countMessage1() - 10) / 5);
          let totalMana = this.manaPerView() + extraMana;
          let extraReason = extraMana > 0 ? `${this.commentPerView()} + ${extraMana} extra - ${this.chat1()}` : `${this.commentPerView()} - ${this.chat1()}`;
          let extraComment = extraMana > 0 ? `Apoyando a ${this.chat1()} y ${extraMana} extra` : `Apoyando a ${this.chat1()}`;

          this.createNewHistory({quantity: totalMana, reason: extraReason, user_id: this.userId});
          this.messageService.add({ severity: 'info', summary: `Ganaste ${totalMana} mana`, detail: extraComment, sticky: true })
        }
        if(this.countMessage2() >= 10) {
          let extraMana = Math.floor((this.countMessage2() - 10) / 5);
          let totalMana = this.manaPerView() + extraMana;
          let extraReason = extraMana > 0 ? `${this.commentPerView()} + ${extraMana} extra - ${this.chat2()}` : `${this.commentPerView()} - ${this.chat2()}`;
          let extraComment = extraMana > 0 ? `Apoyando a ${this.chat2()} y ${extraMana} extra` : `Apoyando a ${this.chat2()}`;

          this.createNewHistory({quantity: totalMana, reason: extraReason, user_id: this.userId});
          this.messageService.add({ severity: 'info', summary: `Ganaste ${totalMana} mana`, detail: extraComment, sticky: true })
        }
      }

      this.countMessage1.set(0);
      this.countMessage2.set(0);

      this.manaInterval60 = setInterval(() => {
        if(this.userId) {
          if(this.countMessage1() >= 10) {
            let extraMana = Math.floor((this.countMessage1() - 10) / 5);
            let totalMana = this.manaPerView() + extraMana;
            let extraReason = extraMana > 0 ? `${this.commentPerView()} + ${extraMana} extra - ${this.chat1()}` : `${this.commentPerView()} - ${this.chat1()}`;
            let extraComment = extraMana > 0 ? `Apoyando a ${this.chat1()} y ${extraMana} extra` : `Apoyando a ${this.chat1()}`;

            this.createNewHistory({quantity: totalMana, reason: extraReason, user_id: this.userId});
            this.messageService.add({ severity: 'info', summary: `Ganaste ${totalMana} mana`, detail: extraComment, sticky: true })
          }
          if(this.countMessage2() >= 10) {
            let extraMana = Math.floor((this.countMessage2() - 10) / 5);
            let totalMana = this.manaPerView() + extraMana;
            let extraReason = extraMana > 0 ? `${this.commentPerView()} + ${extraMana} extra - ${this.chat2()}` : `${this.commentPerView()} - ${this.chat2()}`;
            let extraComment = extraMana > 0 ? `Apoyando a ${this.chat2()} y ${extraMana} extra` : `Apoyando a ${this.chat2()}`;

            this.createNewHistory({quantity: totalMana, reason: extraReason, user_id: this.userId});
            this.messageService.add({ severity: 'info', summary: `Ganaste ${totalMana} mana`, detail: extraComment, sticky: true })
          }
        }

        this.countMessage1.set(0);
        this.countMessage2.set(0);
      }, (60 * 60000));
    }, msUntil60);
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
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el maná.', sticky: true });
            }
          })
        }
      },
      error: err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el registro de maná.', sticky: true });
      }
    })
  }
}
