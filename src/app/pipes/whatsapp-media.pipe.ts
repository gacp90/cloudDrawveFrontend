import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

@Pipe({
  name: 'whatsappMedia'
})
export class WhatsappMediaPipe implements PipeTransform {

  transform(fileName: string | undefined): string {
    if (!fileName) {
      const baseUrl = environment.base_url; 
      return `${baseUrl}/uploads/rifa/no-image`;
    }

    // Usamos la ruta del controlador de Media que creamos en NestJS
    const baseUrl = environment.wp_url;     
    return `${baseUrl}/media/whatsapp/${fileName}`;
  }

}