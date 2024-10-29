import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

// COMPONENTS
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

const routes: Routes = [
    
    { path: 'login', component: LoginComponent, data:{ title: 'Login' } },
    { path: 'registrarme', component: RegisterComponent, data:{ title: 'Registrarme' } },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LoginRoutingModule {}
