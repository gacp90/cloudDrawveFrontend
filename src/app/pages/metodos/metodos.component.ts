import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Metodo } from 'src/app/models/metodos.model';
import { MetodosService } from 'src/app/services/metodos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-metodos',
  templateUrl: './metodos.component.html',
  styleUrls: ['./metodos.component.css']
})
export class MetodosComponent implements OnInit {

  constructor(  private metodosServices: MetodosService,
                private fb: FormBuilder

  ) { }


  ngOnInit(): void {

    this.loadMetodos();
    
  }

  /** ======================================================================
   * LOAD METODOS
  ====================================================================== */
  public total: number = 0;
  public metodos: Metodo[] = []
  public query: any = {
    desde: 0,
    hasta: 10,
    status: true,
    sort: {}
  };

  loadMetodos(){
  
    this.metodosServices.loadMetodos(this.query)
      .subscribe({
        next: ({metodos, total}) => {
          this.metodos = metodos;
          this.total = total;
        },
        error: (err) => {
          Swal.fire('Error', err.error.msg, 'error');
        }
    })  
  }

  /** ================================================================
   *   CHANGE ORDEN
  ==================================================================== */
  statusChange( orden: any ){  

    if (orden === 'Activos') {
      this.query.status = true      
    } else {
      this.query.status = false;
    } 

    this.loadMetodos();

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
      
      this.loadMetodos();
      
    }

  /** ======================================================================
   * UPDATE STATUS
  ====================================================================== */
  updateSttatus(metodoP: Metodo){

    this.metodosServices.updateMetodo({status: (metodoP.status)? false: true}, metodoP.metid!)
        .subscribe({
          next: ({metodo}) => {
            Swal.fire('Actualizado', `El metodo ${metodo.nombre} ha sido actualizado`, 'success');
            this.loadMetodos();
          },
          error: (err) => {
            Swal.fire('Error', err.error.msg, 'error');
          }
        })

  }

  /** ======================================================================
   * CREATE
  ====================================================================== */
  public newformSubmit: boolean = false;

  create(){
  
      this.newformSubmit = true;
      
      if (this.updateForm.invalid) {
        this.newformSubmit = false;
        return;
      }
      
      this.metodosServices.createMetodo(this.updateForm.value)
      .subscribe({
        next: ({metodo}) => {
          Swal.fire('Creado', `El metodo ${metodo.nombre} ha sido creado`, 'success');
          this.loadMetodos();
          this.newformSubmit = false;
          this.updateForm.reset();
        },
        error: (err) => {
          Swal.fire('Error', err.error.msg, 'error');
          this.newformSubmit = false;
        }
      })
  
  }

  /** ======================================================================
   * VALIDATE
  ====================================================================== */
  validate(campo: string): boolean{
    return (this.newformSubmit && this.updateForm.get(campo)?.invalid)? true: false; 
  }

  /** ======================================================================
   * UPDATE
  ====================================================================== */
  public formSubmit: boolean = false;
  public updateForm = this.fb.group({
    moneda: ['', [Validators.required]],
    nombre: ['', [Validators.required]],
    cuenta: ['', [Validators.required]],
    tasa: ['', [Validators.required]],
    comision: ['', [Validators.required]]  
  })

  update(){
  
      this.formSubmit = true;
      
      if (this.updateForm.invalid) {
        this.formSubmit = false;
        return;
      }
      
      this.metodosServices.updateMetodo(this.updateForm.value, this.metodoSelect.metid!)
      .subscribe({
        next: ({metodo}) => {
          Swal.fire('Actualizado', `El metodo ${metodo.nombre} ha sido actualizado`, 'success');
          this.loadMetodos();
          this.formSubmit = false;
        },
        error: (err) => {
          Swal.fire('Error', err.error.msg, 'error');
          this.formSubmit = false;
        }
      })
  
  }

  /** ======================================================================
   * VALIDATE
  ====================================================================== */
  validateU(campo: string): boolean{
    return (this.formSubmit && this.updateForm.get(campo)?.invalid)? true: false; 
  }



  /** ======================================================================
   * SET FORM UPDATE
  ====================================================================== */
  public metodoSelect!: Metodo;
  setForm(metodo: Metodo){

    this.metodoSelect = metodo;

    this.updateForm.setValue({
      moneda: metodo.moneda,
      nombre: metodo.nombre,
      cuenta: metodo.cuenta,
      tasa: metodo.tasa.toString(),
      comision: metodo.comision.toString(),
      
    })

  }

  

}
