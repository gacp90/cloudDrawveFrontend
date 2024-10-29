import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { FormBuilder, Validators } from '@angular/forms';
import { User } from 'src/app/models/users.model';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {

  public user!: User;

  constructor(  private usersService: UsersService,
                private fb: FormBuilder,
                private router: Router){
                  
                }

  ngOnInit(): void {
    // CARGAR USUARIOS
    this.user = this.usersService.user;
    this.loadUsers();
  }

  /** ======================================================================
   * LOAD USERS
  ====================================================================== */
  public users: User[] = [];
  public total: number = 0;
  public query:any = {
    desde: 0,
    hasta: 100000,
    sort: {}
  }

  loadUsers(){

    if (this.user.role === 'ADMIN') {
      this.query.admin = this.user.uid!;      
    }else{
      Swal.fire('Atención', 'No tienes los privilegios para este modulo', 'warning');
      this.router.navigateByUrl('/');
      return;
    }


    this.usersService.loadUsers(this.query)
        .subscribe( ({users, total}) => {

          this.users = users;
          this.total = total;

        }, (err) => { Swal.fire('Error', err.error.msg, 'error') });

  }

  /** ======================================================================
   * CREATE USER
  ====================================================================== */
  @ViewChild('modalNewUser') modalNewUser!: ElementRef;

  public formNewSubmitted: boolean = false;
  public formNewUser = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['STAFF'],
    admin: ''
  });

  createUser(){
       
    this.formNewSubmitted = true;   
    
    if (this.formNewUser.invalid) {
      return;
    }
    
    if (this.formNewUser.value.role === 'none') {
      return;      
    }

    this.formNewUser.value.admin = this.user.uid!;
    
    this.usersService.createUser(this.formNewUser.value)
    .subscribe( ({user}) => {
      
      this.users.push(user);
      
      this.formNewUser.reset({
        role: 'STAFF'
      });

      this.formNewSubmitted = false;
      
      Swal.fire('Estupendo', 'El nuevo usuario se creo con exito!', 'success');

    }, (err) => { Swal.fire('Error', err.error.msg, 'error') });

  }
  
  /** ======================================================================
   * VALIDATE FORM
  ====================================================================== */
  validate( campo: string): boolean{
    
    if ( this.formNewUser.get(campo)?.invalid && this.formNewSubmitted ) {      
      return true;
    }else{
      return false;
    }

  }

  /** ======================================================================
   * DESACTIVAR O ACTIVAR USUARIOS
  ====================================================================== */
  desactiveUser(user: User){

    let texto;

    if (user.status) {
      texto = `desactivar`;
    }else{
      texto = `reactivar`;      
    }

    Swal.fire({
      title: 'Atención!',
      text: `Estas seguro de ${texto} este usuario`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Si, ${texto}`
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.usersService.deleteUser(user.uid!)
            .subscribe( ({user}) => {

              let respT;
              if (user.status) {
                respT = `activado`;
              }else{
                respT = `desactivado`;      
              }

              this.loadUsers();
              Swal.fire('Estupendo', `El usuario a sido ${respT} con exito!`)

            }, (err) => {
              console.log(err);
              Swal.fire('Error', err.error.msg, 'error');
              
            });

      }
    })

  }

}
