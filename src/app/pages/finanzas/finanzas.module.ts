import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FinanzasRoutingModule } from './finanzas-routing.module';
import { HistorialComponent } from './historial/historial.component';
import { ReportesComponent } from './reportes/reportes.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    HistorialComponent,
    ReportesComponent
  ],
  imports: [
    CommonModule,
    FinanzasRoutingModule,
    FormsModule
  ]
})
export class FinanzasModule { }
