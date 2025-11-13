import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-agenda',
  imports: [],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class Agenda implements OnInit {

  days: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  hours: string[] = Array.from({ length: 24 }, (_, i) => i.toString())

  ngOnInit(): void {

  }
}
