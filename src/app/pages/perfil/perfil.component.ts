import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { User } from 'src/app/models/users.model';

import { UsersService } from 'src/app/services/users.service';
import { FileUploadService } from 'src/app/services/file-upload.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  constructor(  private activatedRoute: ActivatedRoute,
                private usersService: UsersService,
                private router: Router,
                private fileUploadService: FileUploadService,
                private fb: FormBuilder){
                  this.user = usersService.user;
                }

  ngOnInit(): void {
    
    this.activatedRoute.params
        .subscribe( ({id}) => {

          if ( this.user.uid !== id ) { 
            if (this.user.role === 'ADMIN') { 
              this.loadUser(id);  
            }else{
              Swal.fire('Atención', 'No tienes los privilegios para estar aqui', 'warning');
              this.router.navigateByUrl('/');
              return;              
            } 
          }else{
            this.getForm();
          }   

        }); 
  }
              
  /** ================================================================
   *  CARGAR USUARIO
  ==================================================================== */
  public user!: User;

  loadUser(id:string){

    this.usersService.loadUserId(id)
        .subscribe( ({user}) => {

          this.user = user;          
          this.getForm();  

        });

  }
              
  /** ================================================================
   *  GET FORM
  ==================================================================== */
  getForm(){

    this.formUpdate.reset({
      email: this.user.email,
      name: this.user.name,
      phone: this.user.phone,
      password: '',
      repassword: ''
    });

  }
              
  /** ================================================================
   *  ACTUALIZAR USUARIO
  ==================================================================== */
  public formUpdateSubmitted: boolean = false;
  public formUpdate = this.fb.group({
    email: ['', [Validators.required, Validators.minLength(2)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    password: ['', [Validators.minLength(6)]],
    repassword: ['', [Validators.minLength(6)]],
  });

  updateUser(){

    this.formUpdateSubmitted = true;

    if (this.formUpdate.invalid) {
      return;
    }

    if (this.formUpdate.value.password === '') {
      
      this.formUpdate.reset({
        email: this.formUpdate.value.email,
        name: this.formUpdate.value.name
      });
      
    }

    this.usersService.updateUser(this.formUpdate.value, this.user.uid!)
        .subscribe( ({user}) => {

          this.user = user;

          this.activatedRoute.params
          .subscribe( ({id}) =>{

            if (this.usersService.user.uid === id) {

              this.usersService.user.name = this.user.name;
              this.usersService.user.email = this.user.email;
              
            }

            Swal.fire('Estupendo', 'Se ha actualizado el perfil exitosamente!', 'success');

          }, (err) => {
            console.log(err);
            Swal.fire('Error', err.error.msg, 'error');            
          });

        });

  }
              
  /** ======================================================================
   * VALIDATE FORM EDIT
  ====================================================================== */
  validateEditForm( campo:string ): boolean{

    if ( this.formUpdate.get(campo)?.invalid && this.formUpdateSubmitted ) {      
      return true;
    }else{
      return false;
    }

  }

  /** ================================================================
   *   ACTUALIZAR IMAGEN
  ==================================================================== */
  public imgTemp: any = null;
  public subirImagen!: any;
  cambiarImage(file: any): any{    

    this.subirImagen = file.target.files[0];
    
    if (!this.subirImagen) { return this.imgTemp = null }    
    
    const reader = new FileReader();
    const url64 = reader.readAsDataURL(file.target.files[0]);
        
    reader.onloadend = () => {
      this.imgTemp = reader.result;      
    }

  }
      
  /** ================================================================
   *  SUBIR IMAGEN fileImg
  ==================================================================== */
  @ViewChild('fileImg') fileImg!: ElementRef;
  public imgProducto: string = 'no-image';
  subirImg(){
    
    this.fileUploadService.updateImage( this.subirImagen, 'user', this.user.uid!)
    .then( (resp:{ date: Date, nombreArchivo: string, ok: boolean }) => {

      this.user.img = resp.nombreArchivo;
      this.usersService.user.img = resp.nombreArchivo;
      this.fileImg.nativeElement.value = '';
      this.imgProducto = 'no-image';
      this.imgTemp = null;
    
    });    
    
  }

  /** ================================================================
   *  ACTUALIZAR NOMBRE DE LA EMPRESA
  ==================================================================== */
  updateEmpresa(empresa: string){

    if (empresa.length === 0) {
      Swal.fire('Atención', 'Debes de asignar un nombre a tu empresa', 'warning');
      return;
    }

    this.usersService.updateUser({empresa}, this.user.uid!)
        .subscribe( ({user}) => {

          this.user.empresa = user.empresa;
          Swal.fire('Estupendo', 'Se ha actualizado el nombre de la empresa exitosamente', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ================================================================
   *  CLIPBOARD
  ==================================================================== */
  copyToClipboard() {
    document.addEventListener('copy', (e: ClipboardEvent) => {
      e.clipboardData!.setData('text/plain', (`https://cloud.drawve.com/registrarme?referCode=${this.user.referralCode}`));
      e.preventDefault();
      document.removeEventListener('copy', null!);
    });
    document.execCommand('copy');
  }

}
