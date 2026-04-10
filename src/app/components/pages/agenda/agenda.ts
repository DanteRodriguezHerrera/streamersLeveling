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

@Component({
  selector: 'app-agenda',
  imports: [TimeFormatPipe, FormsModule],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class Agenda implements OnInit {
  
  private agendaService = inject(AgendaService);
  private dayService = inject(DayService);
  private hourService = inject(HourService);
  private userService = inject(UserService);

  days = new Map<string, any[]>([
    ["Lunes", []],
    ["Martes", []],
    ["Miercoles", []],
    ["Jueves", []],
    ["Viernes", []],
    ["Sabado", []],
  ]);

  daysOptions: Day[] = [];

  hours: number[] = Array.from({ length: 24 }, (_, i) => i)

  hoursOptions: Hour[] = [];
  hoursOptionsFiltered: Hour[] = [];

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

  is24HourFormat = signal(true);

  isLoading = signal(true);

  selectedDay: Day = {
    day_id: '',
    day_name: ''
  }

  selectedHour: string | null = null

  newSchedule: IAgenda = {
    user_id: '',
    day_id: '',
    hour_id: ''
  }

  ngOnInit(): void {
    this.getScheduledHours();
    this.getDays();
    this.getHours();
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

    this.agendaService.getScheduledHours().subscribe({
      next: (res: any) => {
        this.countScheduledHours(this.monday, res.monday, "Lunes", this.mondayStreamers);
        this.countScheduledHours(this.tuesday, res.tuesday, "Martes", this.tuesdayStreamers);
        this.countScheduledHours(this.wednesday, res.wednesday, "Miercoles", this.wednesdayStreamers);
        this.countScheduledHours(this.thursday, res.thursday, "Jueves", this.thursdayStreamers);
        this.countScheduledHours(this.friday, res.friday, "Viernes", this.fridayStreamers);
        this.countScheduledHours(this.saturday, res.saturday, "Sabado", this.saturdayStreamers);

        this.usersTooltips = [this.mondayStreamers, this.tuesdayStreamers, this.wednesdayStreamers, this.thursdayStreamers, this.fridayStreamers, this.saturdayStreamers];
        
        this.isLoading.update(value => !value)
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

    const dayHours = this.days.get(day.day_name);

    this.hoursOptionsFiltered = Array.from(this.hoursOptions);

    if(dayHours !== undefined) {
      dayHours.forEach((hour, index) => {
        if(hour[1] == 2){
          this.hoursOptionsFiltered.splice(index, 1);
        }
      });
    }
  }

  selectHour(hour: Hour) {
    this.newSchedule.hour_id = hour.hour_id;
    this.selectedHour = hour.hour_name
  }

  getHours() {
    this.hourService.getHours().subscribe({
      next: (res: HoursResponse) => {
        this.hoursOptions = res.data;
        this.hoursOptionsFiltered = res.data;
      },
      error: err => {
        console.log(err)
      }
    })
  }

  checkNewSchedule() {

    const user = localStorage.getItem('user')

    this.newSchedule.user_id = user ? user : '';

    if(this.newSchedule.user_id == '' || this.newSchedule.day_id == '' || this.newSchedule.hour_id == '' ) {
      alert("Favor de elegir un dia y hora para agendar")
    }
    else {
      if(this.selectedDay.day_name == 'Sabado' && this.userService.mana() >= 50) {
        this.schedule(50)
      }
      else if(this.selectedDay.day_name != 'Sabado' && this.userService.mana() >= 10) {
        this.schedule(10)
      }
      else {
        alert("No tienes suficiente mana para agendar");
        this.clearDaySelected();
      }
    }
  }

  schedule(manaCost: number) {
    this.agendaService.createSchedule(this.newSchedule).subscribe({
      next: (res: any) => {
        this.isLoading.update(value => !value)

        this.getScheduledHours();

        this.userService.mana.update(value => value - manaCost);

        this.userService.updateUser(this.newSchedule.user_id, {"actual_money": this.userService.mana()}).subscribe({
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
      this.hoursOptionsFiltered = Array.from(this.hoursOptions);
      this.selectedHour = null;
  }

}
