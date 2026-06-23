import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HistorialComponent } from './historial/historial.component';
import { ReportesComponent } from './reportes/reportes.component';

const routes: Routes = [
    { 
        path: 'historial', 
        component: HistorialComponent, 
        data: { title: 'Historial de Pagos' } 
    },
    { 
        path: 'reportes', 
        component: ReportesComponent, 
        data: { title: 'Reporte Contable' } 
    },
    // Si entran a /dashboard/finanzas sin nada más, los enviamos al historial por defecto
    { path: '', redirectTo: 'historial', pathMatch: 'full' } 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanzasRoutingModule { }
