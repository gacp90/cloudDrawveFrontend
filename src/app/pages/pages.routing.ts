import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

// GUARDS
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';

// COMPONENTS
import { DashboardComponent } from './dashboard/dashboard.component';
import { PagesComponent } from './pages.component';
import { PerfilComponent } from './perfil/perfil.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { RutasComponent } from './rutas/rutas.component';
import { RifaComponent } from './rifa/rifa.component';
import { ClientesComponent } from './clientes/clientes.component';
import { MensajesComponent } from './mensajes/mensajes.component';
import { ProductsComponent } from './products/products.component';
import { TemplatesComponent } from './templates/templates.component';
import { WhatsappSettingsComponent } from './whatsapp-settings/whatsapp-settings.component';


// COMPONENTS
const routes: Routes = [
    
    { 
      path: 'dashboard',
      component: PagesComponent,
      canActivate: [AuthGuard],
      children:
      [
        { path: '', component: DashboardComponent, data:{ title: 'Dashboard' } },
        { path: 'clientes', component: ClientesComponent, data:{ title: 'Clientes' } },
        { path: 'mensajes', component: MensajesComponent, canActivate: [AdminGuard], data:{ title: 'Mensajes' } },
        { path: 'productos', component: ProductsComponent, canActivate: [AdminGuard], data:{ title: 'Productos' } },
        { path: 'perfil/:id', component: PerfilComponent, data:{ title: 'Perfil' } },
        { path: 'rifa/:id', component: RifaComponent, data:{ title: 'Rifa' } },
        { path: 'rutas', component: RutasComponent, canActivate: [AdminGuard], data:{ title: 'Rutas' } },
        { path: 'plantillas', component: TemplatesComponent, canActivate: [AdminGuard], data:{ title: 'Plantillas' } },
        { path: 'vendedores', component: UsuariosComponent, canActivate: [AdminGuard], data:{ title: 'Vendedores' } },
        { path: 'whatsapp-settings', component: WhatsappSettingsComponent, canActivate: [AdminGuard], data:{ title: 'Configuración de WhatsApp' } },
        
        { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
      ] 
    },    
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PagesRoutingModule {}
