import { Pipe, PipeTransform } from '@angular/core';

/** Turns API enum names into readable labels: `InProgress` → `In Progress`. */
@Pipe({ name: 'enumLabel' })
export class EnumLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
}
