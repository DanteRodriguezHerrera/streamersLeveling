import { Component, inject, OnInit, signal } from '@angular/core';
import { AgendaService } from '../../../core/services/agenda.service';
import { TimeFormatPipe } from '../../../core/pipes/time-format-pipe';
import { FormsModule } from '@angular/forms';
import { IAgenda } from '../../../core/interfaces/agenda.interface';
import { DayService } from '../../../core/services/day.service';
import { Day, DaysResponse } from '../../../core/interfaces/day.interface';
import { HourService } from '../../../core/services/hour.service';
import { Hour, HoursResponse } from '../../../core/interfaces/hour.interface';
import { UserService } from '../../../core/services/user.service';
import { TokenPayload } from '../../../core/interfaces/token.interface';
import { jwtDecode } from 'jwt-decode';
import { NoGroup } from '../../layouts/no-group/no-group';
import { MoneyReasonService } from '../../../core/services/money-reason.service';
import { MoneyReasonsResponse } from '../../../core/interfaces/money-reason.interface';
import { MoneyHistoryDTO } from '../../../core/interfaces/money-history.interface';
import { MoneyHistoryService } from '../../../core/services/money-history.service';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-agenda',
  imports: [TimeFormatPipe, FormsModule, NoGroup, ToastModule],
  providers: [MessageService],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class Agenda implements OnInit {

  constructor(private messageService: MessageService) {}
  
  private agendaService = inject(AgendaService);
  private dayService = inject(DayService);
  private hourService = inject(HourService);
  private userService = inject(UserService);
  private moneyReasonService = inject(MoneyReasonService);
  private moneyHistoryService = inject(MoneyHistoryService);

  private user = localStorage.getItem('user')

  days = new Map<string, any[]>([
    ["Lunes", []],
    ["Martes", []],
    ["Miércoles", []],
    ["Jueves", []],
    ["Viernes", []],
    ["Sábado", []],
  ]);

  daysOptions: Day[] = [];

  hours: number[] = Array.from({ length: 24 }, (_, i) => i)

  hoursOptions: Hour[] = [];
  hoursOptionsFiltered = signal<Hour[]>([]);

  monday = new Map<string, number>();
  tuesday = new Map<string, number>();
  wednesday = new Map<string, number>();
  thursday = new Map<string, number>();
  friday = new Map<string, number>();
  saturday = new Map<string, number>();

  mondayStreamers = new Map<string, any[]>();
  tuesdayStreamers = new Map<string, any[]>();
  wednesdayStreamers = new Map<string, any[]>();
  thursdayStreamers = new Map<string, any[]>();
  fridayStreamers = new Map<string, any[]>();
  saturdayStreamers = new Map<string, any[]>();

  usersTooltips: Map<string, any[]>[] = []

  selectedHour: string | null = null
  normalHour = signal<number>(0);
  vipHour = signal<number>(0)

  is24HourFormat = signal(true);

  isLoading = signal(true);

  selectedDay: Day = {
    day_id: '',
    day_name: ''
  }

  mySchedule = signal<any[]>([]);

  todayDate: Date = new Date();
  daysMap: any = {
    Lunes: 1,
    Martes: 2,
    Miércoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sábado: 6
  };

  scheduleToDelete: any = {
    user_id: '',
    day: {
      day_id: '',
      day_name: ''
    },
    hour: {
      hour_id: '',
      hour_name: ''
    }
  };

  newSchedule: IAgenda = {
    user_id: '',
    day_id: '',
    hour_id: ''
  }

  decoded: TokenPayload = {
    role: '',
    group: '',
    iat: 0,
    name: ''
  }

  ngOnInit(): void {
    const token = localStorage.getItem("jwtToken");

    if(token) {
      this.decoded = jwtDecode<TokenPayload>(token);
      
      if(this.decoded.group !== null) {
        this.getScheduledHours();
        this.getDays();
        this.getDaysCost();
      }
    }
  }

  fillMaps(hour:string, dayMap: Map<string, number>, dayStreamersMap: Map<string, any[]>) {
    if(hour.toString().length == 1) {
      dayMap.set(`0${hour}:00`, 0);
      dayStreamersMap.set(`0${hour}:00`, []);
    }
    else {
      dayMap.set(`${hour}:00`, 0);
      dayStreamersMap.set(`${hour}:00`, [])
    }
  }

  getScheduledHours() {
    this.hours.forEach(hour => {
      this.fillMaps(hour.toString(), this.monday, this.mondayStreamers);
      this.fillMaps(hour.toString(), this.tuesday, this.tuesdayStreamers);
      this.fillMaps(hour.toString(), this.wednesday, this.wednesdayStreamers);
      this.fillMaps(hour.toString(), this.thursday, this.thursdayStreamers);
      this.fillMaps(hour.toString(), this.friday, this.fridayStreamers);
      this.fillMaps(hour.toString(), this.saturday, this.saturdayStreamers);
    });

    this.agendaService.getScheduledHours(this.decoded.group).subscribe({
      next: (res: any) => {
        this.countScheduledHours(this.monday, res.monday, "Lunes", this.mondayStreamers);
        this.countScheduledHours(this.tuesday, res.tuesday, "Martes", this.tuesdayStreamers);
        this.countScheduledHours(this.wednesday, res.wednesday, "Miércoles", this.wednesdayStreamers);
        this.countScheduledHours(this.thursday, res.thursday, "Jueves", this.thursdayStreamers);
        this.countScheduledHours(this.friday, res.friday, "Viernes", this.fridayStreamers);
        this.countScheduledHours(this.saturday, res.saturday, "Sábado", this.saturdayStreamers);

        this.usersTooltips = [this.mondayStreamers, this.tuesdayStreamers, this.wednesdayStreamers, this.thursdayStreamers, this.fridayStreamers, this.saturdayStreamers];
        this.isLoading.set(false)
      },
      error: err => {
        console.log(err)
      }
    })
  }

  countScheduledHours(dayWithHours: Map<string, number>, responseDay: any, dayName: string, usersDay: Map<string, any[]>) {

    dayWithHours.forEach((count: number, hour: string) => {
      let hoursCount = 0;
      responseDay.forEach((resDay:any) => {
        if(resDay.hour.hour_name == hour) {
          hoursCount++;
        }
        dayWithHours.set(hour, hoursCount)
      });
    })

    usersDay.forEach((users: any[], hour:string) => {
      responseDay.forEach((resDay:any) => {
        if(resDay.hour.hour_name == hour) {
          usersDay.set(hour, responseDay)
        }
      });
    })

    this.days.set(dayName, [...dayWithHours])
  }

  getDays() {

    this.dayService.getDays().subscribe({
      next: (res: DaysResponse) => {
        this.daysOptions = res.data;
      },
      error: err => {
        console.log(err)
      }
    })

  }

  changeDay(day: Day) {

    this.newSchedule.day_id = day.day_id

    if(this.user) {
      this.hourService.getAvailableHours(this.user, this.decoded.group!, day.day_id).subscribe({
        next: (res: HoursResponse) => {
          this.hoursOptionsFiltered.set(res.data)
        },
        error: err => {
          console.log(err)
        }
      })
    }
  }

  selectHour(hour: Hour) {
    this.newSchedule.hour_id = hour.hour_id;
    this.selectedHour = hour.hour_name
  }

  checkNewSchedule() {

    this.newSchedule.user_id = this.user ? this.user : '';

    if(this.newSchedule.user_id == '' || this.newSchedule.day_id == '' || this.newSchedule.hour_id == '' ) {
      alert("Favor de elegir un dia y hora para agendar")
    }
    else {
      if(this.selectedDay.day_name == 'Sábado' && this.userService.mana() >= this.vipHour()) {
        this.schedule(this.vipHour(), true)
      }
      else if(this.selectedDay.day_name != 'Sábado' && this.userService.mana() >= this.normalHour()) {
        this.schedule(this.normalHour())
      }
      else {
        alert(`No tienes suficiente mana para agendar en ${this.selectedDay.day_name}`);
        this.clearDaySelected();
      }
    }
  }

  schedule(manaCost: number, isVip: boolean = false) {
    this.agendaService.createSchedule(this.newSchedule).subscribe({
      next: (res: any) => {
        this.isLoading.update(value => !value)

        this.getScheduledHours();

        this.userService.mana.update(value => value - manaCost);
        let user_id = this.newSchedule.user_id;

        this.userService.updateUser(this.newSchedule.user_id, {"actual_money": this.userService.mana()}).subscribe({
          next: () => {
            let scheduleReason = 'Agendar hora'
            if(isVip) {
              scheduleReason = 'Agendar hora VIP'
            }
            this.messageService.add({ severity: 'success', summary: 'Se agendo la hora correctamente', life: 5000 })
            this.createNewHistory({quantity: -manaCost, reason: scheduleReason, user_id: user_id});
          },
          error: err => {
            console.log(err)
          }
        })

        this.clearDaySelected();
      },
      error: err => {
        console.log(err)
      }
    })
  }

  clearDaySelected() {
      this.selectedDay = {
        day_id: '',
        day_name: ''
      }

      this.newSchedule = {
        user_id: '',
        day_id: '',
        hour_id: ''
      }
      // this.hoursOptionsFiltered = Array.from(this.hoursOptions);
      this.selectedHour = null;
  }

  getDaysCost() {
    this.moneyReasonService.getMoneyReasons().subscribe({
      next: (res: MoneyReasonsResponse) => {
        res.data.forEach(element => {
          if(element.reason === 1) {
            this.normalHour.set(element.quantity)
          }
          if(element.reason === 3) {
            this.vipHour.set(element.quantity)
          }
        });
      },
      error: err => {
        console.log(err)
      }
    })
  }

  getMyScheduledHours() {
    if(this.user){
      this.agendaService.getScheduledHoursByUser(this.user).subscribe({
        next: (res: any) => {
          this.mySchedule.set(res.data)
        },
        error: err => {
          console.log(err)
        }
      })
    }
  }

  isPastSchedule(schedule: any): boolean {
    const currentDay = this.todayDate.getDay();
    const scheduleDay = this.daysMap[schedule.day.day_name];

    const [hours, minutes] = schedule.hour.hour_name
      .split(':')
      .map(Number);

    const scheduleDate = new Date(this.todayDate);

    const diff = scheduleDay - currentDay;

    scheduleDate.setDate(this.todayDate.getDate() + diff);
    scheduleDate.setHours(hours, minutes, 0, 0);

    return scheduleDate < this.todayDate;
  }

  getHourToDelete(schedule: IAgenda) {
    this.scheduleToDelete = schedule;
  }

  confirmCancelHour() {
    const dayToCancel = this.daysMap[this.scheduleToDelete.day.day_name]

    this.agendaService.deleteOneHourScheduled(this.scheduleToDelete.user_id, this.scheduleToDelete.day.day_id, this.scheduleToDelete.hour.hour_id).subscribe({
      next: (res: any) => {
        if(this.todayDate.getDay() < dayToCancel) {
          if(res.data.day.day_name == 'Sábado') {
            this.userService.mana.update(value => value + this.vipHour());
    
            this.userService.updateUser(this.scheduleToDelete.user_id, {"actual_money": this.userService.mana()}).subscribe({
              next: (res) => {
                this.createNewHistory({quantity: this.vipHour(), reason: 'Cancelar hora VIP', user_id: this.scheduleToDelete.user_id});
              },
              error: err => {
                console.log(err)
              }
            })
          }
          else if(res.data.day.day_name != 'Sábado') {
            this.userService.mana.update(value => value + this.normalHour());
    
            this.userService.updateUser(this.scheduleToDelete.user_id, {"actual_money": this.userService.mana()}).subscribe({
              next: () => {
                this.createNewHistory({quantity: this.normalHour(), reason: 'Cancelar hora', user_id: this.scheduleToDelete.user_id});
              },
              error: err => {
                console.log(err)
              }
            })
          }
        }

        this.messageService.add({ severity: 'success', summary: 'Se cancelo la hora correctamente', life: 5000 })

        this.getScheduledHours();
        this.getMyScheduledHours();
      },
      error: err => {
        console.log(err)
      }
    })
  }

  createNewHistory(newMoneyHistory: MoneyHistoryDTO) {
    this.moneyHistoryService.createMoneyHistory(newMoneyHistory).subscribe({
      error: err => {
        console.log(err)
      }
    })
  }
}
