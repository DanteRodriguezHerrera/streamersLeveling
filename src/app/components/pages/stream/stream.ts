import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MoneyHistoryService } from '../../../core/services/money-history.service';
import { MoneyHistoryDTO } from '../../../core/interfaces/money-history.interface';
import { MoneyReasonService } from '../../../core/services/money-reason.service';
import { MoneyReason, MoneyReasonsResponse } from '../../../core/interfaces/money-reason.interface';
import { jwtDecode } from 'jwt-decode';
import { TokenPayload } from '../../../core/interfaces/token.interface';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/interfaces/user.interface';

@Component({
  selector: 'app-stream',
  imports: [],
  templateUrl: './stream.html',
  styleUrl: './stream.scss',
})
export class Stream implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private router = inject(Router)
  private sanitizer = inject(DomSanitizer);
  private moneyHistoryService = inject(MoneyHistoryService);
  private moneyReasonsService = inject(MoneyReasonService);
  private userService = inject(UserService)

  isLoading = signal<boolean>(true);

  // Connect the websocket to the Twitch IRC Server 
  chatObserver = new WebSocket("wss://irc-ws.chat.twitch.tv:443")

  decodedJwt: TokenPayload = {
    role: '',
    group: null,
    name: '',
    iat: 0
  };

  myChannel = signal<string>('');
  channel = signal<string>('');

  urlStream: SafeResourceUrl = '';
  urlChat: SafeResourceUrl = '';

  refreshTime = signal<number>(0.5 * 60000); // mili segundos a minutos

  messageCount = signal<number>(0);
  gainCoins = signal<boolean>(false);
  manaPerView = signal<number>(0);
  commentPerView = signal<string>('');
  manaPerSub = signal<number>(0);
  commentPerSub = signal<string>('')

  user: string | null = localStorage.getItem('user')

  moneyReasons = signal<MoneyReason[]>([])

  newMoneyHistory: MoneyHistoryDTO = {
    quantity: 0,
    reason: '',
    user_id: localStorage.getItem('user')!
  }

  ngOnInit() {
    this.channel.set(this.route.snapshot.paramMap.get('channelId')!);
    
    this.userService.getUserByChannelName(this.channel()).subscribe({
      next: (res: UserResponse) => {
        if(res.status === 200) {
          this.urlStream = this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.twitch.tv/?channel=${this.channel()}&parent=localhost&muted=true`)
          this.urlChat = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.twitch.tv/embed/${this.channel()}/chat?darkpopout&parent=localhost`)
      
          this.startListenChat();
          this.getMoneyReasons();
          this.startWatchingStream();
      
          const token = localStorage.getItem("jwtToken");
          if(token){
            this.decodedJwt = jwtDecode<TokenPayload>(token)
            this.myChannel.set(this.decodedJwt.name);
          }
    
          this.isLoading.set(false)
        }
        if(res.status === 404) {
          this.router.navigateByUrl("/agenda")
        }
      },
      error: err => {
        console.log(err)
      }
    })
  }

  ngOnDestroy(): void {
    this.chatObserver.close();
  }

  getMoneyReasons() {
    this.moneyReasonsService.getMoneyReasons().subscribe({
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

  startWatchingStream() {
    setInterval(() => {
      if(this.gainCoins()) {
        if(this.user) {
          this.updateMana(this.user, this.manaPerView())
        }

        this.newMoneyHistory.quantity = this.manaPerView();
        this.newMoneyHistory.reason = this.commentPerView()

        this.createNewHistory(this.newMoneyHistory)
      }
    }, this.refreshTime());
  }

  startListenChat() {

    this.chatObserver.addEventListener("open", () => {

      // Requesting Twitch Capabilities
      this.chatObserver.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands')

      // Anonymous credentials just to listen chat events (read-only)
      this.chatObserver.send("PASS SCHMOOPIIE\r\n");
      this.chatObserver.send(`NICK justinfan${Math.floor(Math.random() * 100000)}\r\n`);

      // Join to the chat of the streamer
      this.chatObserver.send(`JOIN #${this.channel()}`)

      console.log("Se estableció la conexión")
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

        const regex = /:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #\w+ :(.*)/;
        const match = message.match(regex);

        if (match) {
          if(match[1] == this.myChannel()){
            this.messageCount.update(count => count + 1);
            if(this.messageCount() === 1) {
              this.gainCoins.set(true);
            }
          }
        }
      }

      // Detects if someone subscribe/resubscribe to the channel
      if(message.includes("msg-id=sub") || message.includes("msg-id=resub")) {
        const regex = /display-name=(\w+)/;
        const match = message.match(regex);

        if (match) {
          if(match[1] === this.myChannel()){
            if(this.user) {
              this.updateMana(this.user, this.manaPerSub())
            }

            this.newMoneyHistory.quantity = this.manaPerSub();
            this.newMoneyHistory.reason = this.commentPerSub()

            this.createNewHistory(this.newMoneyHistory, false)
          }
        }
      }
    })

    this.chatObserver.addEventListener("error", (event) => {
      console.log(event);
      console.log("Ocurrió un error en la conexión")
    })
  }

  updateMana(user:string, mana: number) {
    this.userService.mana.update(value => value + mana);
    
    this.userService.updateUser(user, {"actual_money": mana}).subscribe({
      error: err => {
        console.log(err)
      }
    })
  }

  createNewHistory(newMoneyHistory: MoneyHistoryDTO, isView: boolean = true) {
    this.moneyHistoryService.createMoneyHistory(newMoneyHistory).subscribe({
      next: () => {
        if(isView) {
          this.gainCoins.set(false);
          this.messageCount.set(0);
        }
      },
      error: err => {
        console.log(err)
      }
    })
  }
}
