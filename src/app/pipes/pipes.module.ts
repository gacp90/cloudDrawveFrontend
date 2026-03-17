import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// PIPES
import { ImagenPipe } from './imagen.pipe';
import { WhatsappMediaPipe } from './whatsapp-media.pipe';



@NgModule({
  declarations: [ImagenPipe, WhatsappMediaPipe],
  exports: [ImagenPipe, WhatsappMediaPipe],
  imports: [
    CommonModule
  ]
})
export class PipesModule { }
