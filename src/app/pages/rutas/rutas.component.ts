import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Ruta } from 'src/app/models/rutas.model';
import { User } from 'src/app/models/users.model';
import { RutasService } from 'src/app/services/rutas.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.css']
})
export class RutasComponent implements OnInit {

  public user!: User;

  constructor(  private rutasService: RutasService,
                private usersService: UsersService,
                private fb: FormBuilder){
                  this.user = usersService.user;
                }

  ngOnInit(): void {
    this.loadRutas();
  }

  /** ======================================================================
   * LOAD RUTAS
  ====================================================================== */
  public rutas: Ruta[] = [];
  public rutasTemp: Ruta[] = [];
  public total: number = 0;
  public pendientes: number = 0;
  public enviandos: number = 0;
  public entregados: number = 0;
  public cargando: boolean = false;
  public sinResultados: boolean = false;
  public query: any = {
    desde: 0,
    hasta: 50,
    admin: ''
  }

  loadRutas(){

    this.cargando = true;
    this.sinResultados = false;

    if (this.user.role === 'ADMIN') {
      this.query.admin = this.user.uid;
    }else{
      this.query.admin = this.user.admin?.uid;
    }

    this.rutasService.loadRutas(this.query)
        .subscribe( ({rutas, total}) => {  
          
          // COMPROBAR SI EXISTEN RESULTADOS
          if (rutas.length === 0) {
            this.sinResultados = true;           
          }
          // COMPROBAR SI EXISTEN RESULTADOS

          this.cargando = false;
          this.total = total;
          this.rutas = rutas;
          this.rutasTemp = rutas;
        });

  }

  /** ================================================================
   *   CAMBIAR PAGINA
  ==================================================================== */
  @ViewChild('mostrar') mostrar!: ElementRef;
  cambiarPagina (valor: number){
    
    this.query.desde += valor;

    if (this.query.desde < 0) {
      this.query.desde = 0;
    }
    
    this.loadRutas();
    
  }

  /** ================================================================
   *   CHANGE LIMITE
  ==================================================================== */
  limiteChange( cantidad: any ){  

    this.query.hasta = Number(cantidad);    
    this.loadRutas();

  }

  /** ======================================================================
   * NEW RIFA
  ====================================================================== */
  public newRutaFormSubmitted: boolean = false;
  public newRutaForm = this.fb.group({
    name: ['', [Validators.required]],
    color: '#2d2d2d'
  })

  create(){

    this.newRutaFormSubmitted = true;

    if (this.newRutaForm.invalid) {
      return;
    }
    

    this.rutasService.createRuta(this.newRutaForm.value)
        .subscribe( ({ruta}) => {

          this.newRutaFormSubmitted = false;
          this.newRutaForm.reset({
            color: this.newRutaForm.value.color
          });
          ruta.ruid = ruta._id;
          this.rutas.push(ruta);
          Swal.fire('Estupendo', 'Se ha creado la rifa exitosamente', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ======================================================================
   * VALIDATE RIFA
  ====================================================================== */
  validate(campo: string): boolean{

    if (this.newRutaFormSubmitted && this.newRutaForm.get(campo)?.invalid) {
      return true;
    }else{
      return false;
    }

  }

  /** ======================================================================
   * DESACTIVAR O ACTIVAR
  ====================================================================== */
  desactiveRuta(ruta: Ruta){

    let texto;
    let status: boolean;

    if (ruta.status) {
      texto = `desactivar`;
      status = false;
    }else{
      texto = `reactivar`;      
      status = true;
    }

    Swal.fire({
      title: 'Atención!',
      text: `Estas seguro de ${texto} esta ruta`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Si, ${texto}`
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.rutasService.updateRuta({status}, ruta.ruid!)
            .subscribe( ({ruta}) => {

              let respT;
              if (ruta.status) {
                respT = `activado`;
              }else{
                respT = `desactivado`;      
              }

              this.loadRutas();
              Swal.fire('Estupendo', `La ruta a sido ${respT} con exito!`, 'success');

            }, (err) => {
              console.log(err);
              Swal.fire('Error', err.error.msg, 'error');
              
            });

      }
    })

  }

  /** ======================================================================
   * SET FORM UPDATE
  ====================================================================== */
  public rutaSelected!: Ruta;
  setForm(ruta: Ruta){

    this.rutaSelected = ruta;
    this.updateForm.setValue({
      name: ruta.name,
      color: ruta.color || '#2d2d2d'
    });

  }

  /** ======================================================================
   * UPDATE
  ====================================================================== */  
  public updateSubmitted: boolean = false;
  public updateForm = this.fb.group({
    name: ['', [Validators.required]],
    color: ['#2d2d2d', [Validators.required]],
  });

  update(){

    this.updateSubmitted = true;

    if (this.updateForm.invalid) {
      return;
    }

    this.rutasService.updateRuta(this.updateForm.value, this.rutaSelected.ruid!)
        .subscribe( ({ruta}) => {

          this.rutas.map( (rut) => {
            if (rut.ruid === this.rutaSelected.ruid!) {
              rut.name = ruta.name;
              rut.color = ruta.color;
            }
          })

          Swal.fire('Estupendo', 'Se ha actualizado la ruta exitosamente!', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');
          
        })

  }

  /** ======================================================================
   * VALIDATE UPDATE
  ====================================================================== */
  validateUpdate(campo: string): boolean{
    return (this.updateSubmitted && this.updateForm.get(campo)?.invalid)? true : false;
  }

}
