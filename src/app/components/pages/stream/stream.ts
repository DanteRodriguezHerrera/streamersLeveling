import {Component, inject, OnInit} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MoneyHistoryService } from '../../../core/services/money-history.service';
import { MoneyHistoryDTO } from '../../../core/interfaces/money-history.interface';

@Component({
  selector: 'app-stream',
  imports: [],
  templateUrl: './stream.html',
  styleUrl: './stream.scss',
})
export class Stream implements OnInit {

  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private moneyHistoryService = inject(MoneyHistoryService);

  // Connect the websocket to the Twitch IRC Server 
  chatObserver = new WebSocket("wss://irc-ws.chat.twitch.tv:443")

  channel: string = '';

  urlStream: SafeResourceUrl = '';
  urlChat: SafeResourceUrl = '';

  refreshTime: number = 30 * 60000; // mili segundos a minutos
  counter: number = 0;

  gainCoins: boolean = false;

  ngOnInit() {
    this.channel = this.route.snapshot.paramMap.get('channelId')!;
    this.urlStream = this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.twitch.tv/?channel=${this.channel}&parent=localhost`)
    this.urlChat = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.twitch.tv/embed/${this.channel}/chat?darkpopout&parent=localhost`)

    this.startListenChat();

    this.startWatchingStream();
  }

  startWatchingStream() {

    setInterval(() => {

      if(this.gainCoins) {

        const newMoneyHistory: MoneyHistoryDTO = {
          quantity: 2,
          reason: 'Vista y comentario',
          user_id: localStorage.getItem('user')!
        }

        this.moneyHistoryService.createMoneyHistory(newMoneyHistory).subscribe({
          next: (res: any) => {
            // console.log(res)
            this.gainCoins = false;
          },
          error: err => {
            console.log(err)
          }
        })
      }

    }, this.refreshTime);
  }

  startListenChat() {

    this.chatObserver.addEventListener("open", () => {

      // Requesting Twitch Capabilities
      this.chatObserver.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands')

      // Anonymous credentials just to listen chat events (read-only)
      this.chatObserver.send("PASS SCHMOOPIIE\r\n");
      this.chatObserver.send(`NICK justinfan${Math.floor(Math.random() * 100000)}\r\n`);

      // Join to the chat of the streamer
      this.chatObserver.send(`JOIN #${this.channel}`)

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

        // console.log(match)

        if (match) {
          const username = match[1];
          const text = match[2];
          console.log(`${username}: ${text}`);

          if(match[1] == localStorage.getItem('channel_name')) this.gainCoins = true;
        }
      }

      // Detects if someone subscribe/resubscribe to the channel
      if(message.includes("msg-id=sub") || message.includes("msg-id=resub")) {
        // console.log(message)
        const regex = /display-name=(\w+)/;
        const match = message.match(regex);

        // console.log(match)

        if (match) {
          const username = match[1];
          console.log(`Se suscribió ${username}`);
        }
      }
    })

    this.chatObserver.addEventListener("error", (event) => {
      console.log(event);
      console.log("Ocurrió un error en la conexión")
    })

    this.chatObserver.addEventListener("close", (event) => {
      console.log(event);
      console.log("Se cerro la conexión");
    })
  }
}
