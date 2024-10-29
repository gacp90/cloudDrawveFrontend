import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Rifa } from 'src/app/models/rifas.model';
import { User } from 'src/app/models/users.model';
import { RifasService } from 'src/app/services/rifas.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {

  public user!: User

  constructor(  private rifasService: RifasService,
                private usersService: UsersService,
                private fb: FormBuilder){
                  this.user = usersService.user;
                }

  ngOnInit(): void {
    this.loadRifas();
  }

  /** ======================================================================
   * LOAD RIFAS
  ====================================================================== */
  public rifas: Rifa[] = [];
  public rifasTemp: Rifa[] = [];
  public total: number = 0;
  public pendientes: number = 0;
  public enviandos: number = 0;
  public entregados: number = 0;
  public cargando: boolean = false;
  public sinResultados: boolean = false;
  public query: any = {
    desde: 0,
    hasta: 50,
    sort: {fecha: 1}
  }

  loadRifas(){

    this.cargando = true;
    this.sinResultados = false;
    
    if (this.user.role === 'ADMIN') {
      this.query.admin = this.user.uid;
    }else{
      this.query.admin = this.user.admin;
    }

    

    this.rifasService.loadRifas(this.query)
        .subscribe( ({rifas, total}) => {  
          
          // COMPROBAR SI EXISTEN RESULTADOS
          if (rifas.length === 0) {
            this.sinResultados = true;           
          }
          // COMPROBAR SI EXISTEN RESULTADOS

          this.cargando = false;
          this.total = total;
          this.rifas = rifas;
          this.rifasTemp = rifas;
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
    
    this.loadRifas();
    
  }

  /** ================================================================
   *   CHANGE LIMITE
  ==================================================================== */
  limiteChange( cantidad: any ){  

    this.query.hasta = Number(cantidad);    
    this.loadRifas();

  }

  /** ======================================================================
   * NEW RIFA
  ====================================================================== */
  public newRifaFormSubmitted: boolean = false;
  public btnCreate: boolean = false;
  public newRifaForm = this.fb.group({
    name: ['', [Validators.required]],
    monto: ['', [Validators.required]],
    numeros: ['', [Validators.required]],
    loteria: ['', [Validators.required]],
    fecha: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    promocion: 0,
    comision: 0,
  })

  create(){

    this.newRifaFormSubmitted = true;
    this.btnCreate = true;
    
    if (this.newRifaForm.invalid) {
      this.btnCreate = false;
      return;
    }

    this.rifasService.createRifa(this.newRifaForm.value)
        .subscribe( ({rifa}) => {          
          
          this.newRifaFormSubmitted = false;
          this.newRifaForm.reset();
          this.loadRifas();
          this.btnCreate = false;
          
          Swal.fire('Estupendo', 'Se ha creado la rifa exitosamente', 'success');

        }, (err) => {
          this.btnCreate = false;
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ======================================================================
   * VALIDATE RIFA
  ====================================================================== */
  validate(campo: string): boolean{

    if (this.newRifaFormSubmitted && this.newRifaForm.get(campo)?.invalid) {
      return true;
    }else{
      return false;
    }

  }

}
