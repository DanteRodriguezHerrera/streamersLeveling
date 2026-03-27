import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat'
})
export class TimeFormatPipe implements PipeTransform {

  transform(value: string, is24Hours: boolean): string {

    const hour : number = Number(value.split(":")[0]) % 12 || 12;

    const formattedHour : string = Number(Number(value.split(":")[0])) < 13 ? `${hour} am` : `${hour} pm`

    return is24Hours ? value : formattedHour;
  }

}
