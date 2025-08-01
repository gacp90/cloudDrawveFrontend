import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';

import Swal from 'sweetalert2';
import { UsersService } from 'src/app/services/users.service';
import { environment } from '../../../environments/environment'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  public client = environment.client || false;

  constructor(  private router: Router,
                private fb: FormBuilder,
                private usersService: UsersService){}


  /** =============================================================
   * LOGIN client: true,
  =============================================================== */
  public formSubmitted: boolean = false;
  public loginForm = this.fb.group({
    email: [localStorage.getItem('email') || '' , [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(3)]],
    remember: [false]
  });

  login(){

    this.formSubmitted = true;
    
    if (this.loginForm.invalid) {
      return;
    }

    this.usersService.login(this.loginForm.value)
        .subscribe( resp => {          

          if (resp === false) {
            Swal.fire('Atención', 'Credenciales incorrectas, porfavor verificar el email o contraseña', 'warning')
            return;
          }          

          if ( this.loginForm.value.remember ) {
            localStorage.setItem('email', this.loginForm.value.email || '');
          }else {
            localStorage.removeItem('email');
          }

          // INGRESAR
          this.router.navigateByUrl('/');

        }, (err) => { Swal.fire('Error', err.error.msg, 'error'); });

  }

  /** =============================================================
   * VALIDAR CAMPOS
  =============================================================== */
  validate( campo: string): boolean{
    
    if ( this.loginForm.get(campo)?.invalid && this.formSubmitted ) {
      return true;
    }else{
      return false;
    }

  }

  /** =============================================================
   * RECUPERAR CONTRASEÑA
  =============================================================== */
  public formPassSubmitted: boolean = false;
  public btnFormPass: boolean = false;
  public formPassRee = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]]
    }
  )

  rePass(){

    this.formPassSubmitted = true;
    this.btnFormPass = true;
    
    if (this.formPassRee.invalid) {
      this.btnFormPass = false;
      return;
    }
    
    this.usersService.recuperarPassword(this.formPassRee.value)
    .subscribe( resp => {
      
      Swal.fire('Estupendo', 'Se ha enviado un correo con tu nueva contraseña, porfavor verificar los correos Spam o no deseados en caso de no llegar a tu bandeja de entrada', 'success');
      this.formPassRee.reset();
      this.formPassSubmitted = false;
      this.btnFormPass = false;
      
    }, (err) => {
      this.btnFormPass = false;
      console.log(err);
          Swal.fire('Error', err.error.msg, 'error');
    
      });


  }

  /** =============================================================
   * VALIDAR CAMPOS PASS
  =============================================================== */
  validatePass( campo: string): boolean{
    
    if ( this.formPassRee.get(campo)?.invalid && this.formPassSubmitted ) {
      return true;
    }else{
      return false;
    }

  }

}
