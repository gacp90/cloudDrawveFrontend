import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SwiperModule } from 'swiper/angular';
import { QRCodeModule } from 'angularx-qrcode';

import { PipesModule } from '../pipes/pipes.module';

import { PagesComponent } from './pages.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';
import { BreadcrumbsComponent } from '../shared/breadcrumbs/breadcrumbs.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { PerfilComponent } from './perfil/perfil.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { RutasComponent } from './rutas/rutas.component';
import { RifaComponent } from './rifa/rifa.component';
import { NgxPrinterModule } from 'ngx-printer';
import { ClientesComponent } from './clientes/clientes.component';
import { NewclientComponent } from './clientes/newclient/newclient.component';
import { MensajesComponent } from './mensajes/mensajes.component';


@NgModule({
  declarations: [
    PagesComponent,
    DashboardComponent,
    FooterComponent,
    HeaderComponent,
    SidebarComponent,
    BreadcrumbsComponent,
    PerfilComponent,
    UsuariosComponent,
    RutasComponent,
    RifaComponent,
    ClientesComponent,
    NewclientComponent,
    MensajesComponent
  ],
  exports: [
    DashboardComponent,
    PagesComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,    
    FormsModule,
    SwiperModule,
    ReactiveFormsModule,
    PipesModule,
    QRCodeModule,
    NgxPrinterModule.forRoot({printOpenWindow: true})
  ]
})
export class PagesModule { }
