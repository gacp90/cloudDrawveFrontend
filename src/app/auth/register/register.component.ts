import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  constructor(  private router: Router,
                private fb: FormBuilder,
                private usersService: UsersService,
                private activatedRoute: ActivatedRoute){

                  activatedRoute.queryParams.subscribe( ({referCode}) => {
                    
                    if (referCode) {
                      localStorage.setItem('referCode', referCode);
                    }else{
                      localStorage.setItem('referCode', '');
                    }

                  })

                }

  /** =============================================================
   * REGISTER
  =============================================================== */
  public registerFormSubmitted: boolean = false;
  public registerForm = this.fb.group({
    email:['', [Validators.required]],
    name:['', [Validators.required]],
    phone:['', [Validators.required]],
    password:['', [Validators.required]],
    repassword:['', [Validators.required]],
    referredBy: '',
    terms:['', [Validators.requiredTrue]]
  })

  register(){

    this.registerFormSubmitted = true;
    
    if (this.registerForm.invalid) {
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.repassword) {
      Swal.fire('Error', 'Las contraseñas no son las mismas', 'error');      
      return;
    }

    this.registerForm.value.referredBy = localStorage.getItem('referCode') || '';

    this.usersService.createUser(this.registerForm.value)
        .subscribe( ({ok}) => {

          if(ok){
            Swal.fire('Estupendo', 'Se a registrado con exito!', 'success');
            this.router.navigateByUrl('/login');
          }

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        });

  }

  /** =============================================================
   * VALIDAR CAMPOS
  =============================================================== */
  validate( campo: string): boolean{
    
    if ( this.registerForm.get(campo)?.invalid && this.registerFormSubmitted ) {
      return true;
    }else{
      return false;
    }

  }

}
