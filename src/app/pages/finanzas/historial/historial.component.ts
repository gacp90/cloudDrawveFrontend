import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/users.model';
import { MetodosService } from 'src/app/services/metodos.service';
import { PaymentsService } from 'src/app/services/payments.service';
import { RifasService } from 'src/app/services/rifas.service';
import { RutasService } from 'src/app/services/rutas.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {

  public pagosList: any[] = [];
  public totalRegistros: number = 0;
  public base_url = 'AQUI_TU_URL_DE_ENTORNO'; // environment.base_url

  // Listas para llenar los <select>
  public rifasList: any[] = [];
  public vendedoresList: any[] = [];
  public rutasList: any[] = [];
  public metodosList: any[] = [];

  // Objeto Maestro de Filtros
  public filtros: any = {
    desde: 0,
    hasta: 50,
    sort: { fecha: -1 },
    rifa: '',
    vendedor: '',
    ruta: '',
    method: '',
    estado: '',
    fechaInicio: '',
    fechaFin: ''
  };

  public user!: User;

  constructor(
    private activatedRoute: ActivatedRoute,
    private usersService: UsersService,
    private metodosService: MetodosService,
    private rifasService: RifasService,
    private rutasService: RutasService,
    private paymentsService: PaymentsService
  ) { 
    this.user = usersService.user;
  }

  ngOnInit(): void {
    this.cargarListasSelects();

    // Capturamos si la secretaria viene desde un ticket o rifa (usando queryParams)
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['rifaId']) this.filtros.rifa = params['rifaId'];
      if (params['estado']) this.filtros.estado = params['estado'];
      
      this.cargarPagos();
    });
  }

  // Carga paralela de todas las opciones para los filtros
  cargarListasSelects() {
    // Ejemplo:
    this.rifasService.loadRifas({abierta: true, admin: (this.user.role === 'ADMIN')? this.user.uid! : this.user.admin }).subscribe((res: any) => this.rifasList = res.rifas);
    this.usersService.loadUsers({status: true}).subscribe((res: any) => this.vendedoresList = res.users);
    this.metodosService.loadMetodos({status: true, hasta: 1000}).subscribe((res: any) => this.metodosList = res.metodos);
    this.rutasService.loadRutas({status: true, admin: (this.user.role === 'ADMIN')? this.user.uid! : this.user.admin }).subscribe((res: any) => this.rutasList = res.rutas);
    
  }

  cargarPagos() {
    // 1. Limpiar campos vacíos del payload para no enviar basura a Node.js
    const payloadQuery: any = {};
    
    Object.keys(this.filtros).forEach(key => {
      if (this.filtros[key] !== '' && this.filtros[key] !== null) {
        payloadQuery[key] = this.filtros[key];
      }
    });

    // 2. Llamada a tu servicio
    this.paymentsService.loadPayments(payloadQuery)
      .subscribe({
        next: ({pagos, total}) =>{

          this.pagosList = pagos;
          this.totalRegistros = total;
        },
        error: (error: any) =>{
          console.log(error);
          
        }
      });
  }

  /** ================================================================
   *   CAMBIAR PAGINA
  ==================================================================== */
  @ViewChild('mostrar') mostrar!: ElementRef;
  cambiarPagina (valor: number){
    
    this.filtros.desde += valor;

    if (this.filtros.desde < 0) {
      this.filtros.desde = 0;
    }
    
    this.cargarPagos();
    
  }

  limpiarFiltros() {
    this.filtros = {
      desde_pag: 0,
      hasta_pag: 50,
      sort: { fecha: -1 },
      rifa: '',
      vendedor: '',
      ruta: '',
      method: '',
      estado: '',
      fechaInicio: '',
      fechaFin: ''
    };
    this.cargarPagos();
  }

  // --------------------------------------------------------
  // LÓGICA DE CHECKBOXES
  // --------------------------------------------------------
  public pagosSeleccionados: string[] = [];
  togglePago(id: string) {
    const index = this.pagosSeleccionados.indexOf(id);
    if (index === -1) {
      this.pagosSeleccionados.push(id);
    } else {
      this.pagosSeleccionados.splice(index, 1);
    }
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      // CORRECCIÓN: Extraemos el 'payid' en lugar del '_id'
      this.pagosSeleccionados = this.pagosList
        .filter(p => p.estado === 'Pendiente')
        .map(p => p.payid || p._id); // Dejamos el fallback por seguridad
    } else {
      this.pagosSeleccionados = [];
    }
  }

  // --------------------------------------------------------
  // ACCIONES HTTP (CONFIRMAR)
  // --------------------------------------------------------
  confirmarIndividual(pagoId: string) {
    this.pagosSeleccionados = [pagoId];
    this.confirmarLote();
  }

  confirmarLote() {
    if (this.pagosSeleccionados.length === 0) return;

    Swal.fire({
      title: '¿Confirmar transacciones?',
      text: `Se aprobarán ${this.pagosSeleccionados.length} pagos y el dinero ingresará al saldo de los bancos correspondientes.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.paymentsService.updatePaymentLote(this.pagosSeleccionados).subscribe((res: any) => {
          Swal.fire('¡Confirmados!', res.msg, 'success');
          
          this.pagosSeleccionados = []; // Limpiamos la selección
          this.cargarPagos(); // Recargamos la tabla para ver los nuevos estados

          // Importante: desmarcar el checkbox maestro visualmente
          const chkAll = document.getElementById('chkAll') as HTMLInputElement;
          if (chkAll) chkAll.checked = false;

        }, err => {
          Swal.fire('Error', err.error.msg, 'error');
        });

      } else {
        // Si cancelan, limpiamos si fue un intento individual
        if (this.pagosSeleccionados.length === 1) this.pagosSeleccionados = [];
      }
    });
  }

  // --------------------------------------------------------
  // ACCIONES HTTP (ANULAR)
  // --------------------------------------------------------
  anularPago(pago: any) {
    Swal.fire({
      title: 'Rechazar o Anular',
      text: `¿Estás seguro de anular el pago por $${pago.equivalencia}? Esta acción afectará el ticket y la cuenta bancaria si ya estaba confirmado.`,
      icon: 'warning',
      input: 'select',
      inputOptions: {
        'Anulado': 'Error de Tipeo / Anular',
        'Rechazado': 'Transferencia Falsa / Rechazar'
      },
      inputPlaceholder: 'Selecciona el motivo',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Procesar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value !== '') { resolve(''); } 
          else { resolve('Debes seleccionar un motivo'); }
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        
        const motivo = result.value;

        // CORRECCIÓN: Usamos pago.payid en la petición HTTP
        const idDelPago = pago.payid || pago._id;

        this.paymentsService.cancelPayment(idDelPago, { estadoCancelacion: motivo }).subscribe((res: any) => {
          Swal.fire('Procesado', res.msg, 'success');
          this.cargarPagos();
        }, err => {
          Swal.fire('Error', err.error.msg, 'error');
        });
      }
    });
  }

}
