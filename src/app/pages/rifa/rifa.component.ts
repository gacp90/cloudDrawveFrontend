import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// EXCEL
import * as XLSX from 'xlsx';

import SwiperCore, { FreeMode, Navigation, Pagination, Scrollbar, A11y, Autoplay, EffectFade } from 'swiper';
// install Swiper modules
SwiperCore.use([FreeMode, Navigation, Pagination, Scrollbar, A11y, Autoplay, EffectFade]);

import { _metodos, Rifa } from 'src/app/models/rifas.model';
import { Ruta } from 'src/app/models/rutas.model';
import { Ticket, _pagos } from 'src/app/models/ticket.model';
import { User } from 'src/app/models/users.model';
import { Movimiento } from 'src/app/models/movimientos.model';

import { FileUploadService } from 'src/app/services/file-upload.service';
import { RifasService } from 'src/app/services/rifas.service';
import { RutasService } from 'src/app/services/rutas.service';
import { TicketsService } from 'src/app/services/tickets.service';
import { UsersService } from 'src/app/services/users.service';
import { MovimientosService } from 'src/app/services/movimientos.service';
import { WhatsappService } from 'src/app/services/whatsapp.service';

import { environment } from '../../../environments/environment';
import { BluetoothService } from 'src/app/services/bluetooth.service';
import { WatiService } from 'src/app/services/wati.service';
import { NgxPrinterService } from 'ngx-printer';
import { ClientesService } from 'src/app/services/clientes.service';
import { Client } from 'src/app/models/clientes.model';
import { SmsService } from 'src/app/services/sms.service';

interface templateIn{
  id: string,
  elementName: string,
  category: string,
  subCategory: string,
  catalogInfo: string,
  customParams: any[],
  status: string,
  body: string,
  bodyOriginal: string,
  header: any,
  footer: any,
}

@Component({
  selector: 'app-rifa',
  templateUrl: './rifa.component.html',
  styleUrls: ['./rifa.component.css']
})
export class RifaComponent implements OnInit {

  public user!: User;
  public base_url = environment.base_url;
  public local_url = environment.local_url;
  public client = environment.client || false;

  constructor(  private activatedRoute: ActivatedRoute,
                private usersService: UsersService,
                private rifasService: RifasService,
                private ticketsService: TicketsService,
                private rutasService: RutasService,
                private movimientosService: MovimientosService,
                private fileUploadService: FileUploadService,
                private whatsappService: WhatsappService,
                private bluetoothService: BluetoothService,
                private watiService: WatiService,
                private fb: FormBuilder,
                private clientesService: ClientesService,
                private smsService: SmsService,
                private printerService: NgxPrinterService){

    this.user = usersService.user;

    activatedRoute.params.subscribe( ({id}) => {
      this.loadRifa(id);      
    });

  }

  ngOnInit(): void {  
    
  }

  loadGanador(){

    this.ticketsService.loadTickets({rifa: this.rifa.rifid, ganador: true})
        .subscribe( ({tickets}) => {

          this.ganador = tickets[0];

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ================================================================
   *  BUSCAR CLIENTES
  ==================================================================== */
  @ViewChild ('searchIC') searchIC!:ElementRef;
  @ViewChild ('searchICC') searchICC!:ElementRef;
  public listClients: Client[] = [];
  searchClients(busqueda: string){

    let query: any = {
      desde: 0,
      hasta: 50
    }

    if (busqueda.length < 2 || busqueda.length === 0) {
      this.listClients = [];
      delete query['$or'];
    }else{
      const regex = { $regex: busqueda, $options: 'i' }; // Construir regex      
      query.$or = [
        { telefono: regex },
        { nombre: regex },
        { correo: regex },
        { cedula: regex }
      ];
    }

    this.clientesService.loadClientes(query)
          .subscribe( ({clientes}) => {                     
            this.listClients = clientes;            
          }, (err) => {
            this.listClients = [];
            console.log(err);
            Swal.fire('Error', err.error.msg, 'error');          
          })

  }

  /** ================================================================
   *  ADD ADVERTENCIAS CLIENTE
  ==================================================================== */
  addAlerts(cid: string){
    document.getElementById('modalTicket')?.setAttribute('inert', '');
    

    Swal.fire({
      title: "Agrega advertencias sobre este clientes para notificaciones futuras o en las proximas rifas.",
      input: "text",
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      showLoaderOnConfirm: true,
       preConfirm: (resp)=> {

        return resp;

       }
      
    }).then((result) => {

      if (!result.isConfirmed ) {
        document.getElementById('modalTicket')?.removeAttribute('inert');
        return;
      }

      this.clientesService.updateCliente({alerts: result.value}, cid)
          .subscribe( () =>{

            Swal.fire('Estupendo', 'Se ha agregado la advertencia a este cliente exitosamente', 'success');
            document.getElementById('modalTicket')?.removeAttribute('inert');

          }, (err) => {
            console.log(err);
            document.getElementById('modalTicket')?.removeAttribute('inert');
            Swal.fire('Error', err.error.msg, 'error');            
          })

    });

  }

  /** ================================================================
   *  SELECCIONAR CLIENTE
  ==================================================================== */
  selectClient(client: Client){
    
    if (client.alerts) {
      Swal.fire( 'Atención', client.alerts, 'warning');
    }

    this.searchIC.nativeElement.value = '';
    this.listClients = [],


    this.ticketUpdate.setValue({
      tid: this.ticketSelected.tid!,
      nombre: client.nombre,
      telefono: client.codigo + client.telefono,
      cedula: client.cedula,
      direccion: client.direccion,
      ruta: (client.ruta)? client.ruta._id!:'',
      estado: this.ticketSelected.estado,
      nota: this.ticketSelected.nota || '',
      vendedor: this.user.uid!,
      monto: this.ticketSelected.monto,
      disponible: false,
      cliente: client.cid!
    })    

  }

  /** ================================================================
   *  SELECCIONAR CLIENTE Agrupado
  ==================================================================== */
  selectClient2(client: Client){

    this.searchICC.nativeElement.value = '';
    this.listClients = []

    this.ticketUpdate.setValue({
      tid: '',
      nombre: client.nombre,
      telefono: client.codigo + client.telefono,
      cedula: client.cedula,
      direccion: client.direccion,
      ruta: (client.ruta)? client.ruta._id!:'',
      estado: 'Disponible',
      nota: '',
      vendedor: this.user.uid!,
      monto: this.rifa.monto,
      disponible: false,
      cliente: client.cid!
    })    

  }

  /** ================================================================
   *  ACTUALIZAR FECHA
  ==================================================================== */
  @ViewChild('upDate') upDate!: ElementRef;
  actualizarFecha( fecha: any ){
    

    if (fecha.length === 0) {
      Swal.fire('Atención', 'Debes de asignar la nueva fecha de la rifa para actualizarla', 'warning');
      return;
    }

    Swal.fire({
      title: "Estas seguro?",
      text: "De actualizar la fecha de la rifa!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, actualizar!",
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        
        fecha = new Date(fecha);

        this.rifasService.updateRifa( {fecha}, this.rifa.rifid! )
            .subscribe( ({ rifa }) => {

              this.rifa.fecha = rifa.fecha;
              this.upDate.nativeElement.value = '';
              Swal.fire('Estupendo', 'Se ha actualizado la fecha exitosamente!', 'success');

            }, (err) => {
              console.log(err);
              Swal.fire('Error', err.error.msg, 'error');
              
            })

      }
    });    

  }

  /** ================================================================
   *  CERRAR RIFA
  ==================================================================== */
  close(abierta: boolean){
    
    let textL;

    if (abierta) {
      abierta = false;
      textL = 'cerrar';

    }else{
      abierta = true;
      textL = 'abrir';
    }

    Swal.fire({
      title: "Estas seguro?",
      text: `De ${textL} la venta de tickets`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Si, ${textL}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      
      this.rifasService.updateRifa({abierta}, this.rifa.rifid!)
          .subscribe( ({rifa}) => {

            this.rifa.abierta = rifa.abierta;
            Swal.fire('Estupendo', 'Se ha actualizado la rifa exitosamente', 'success');

          }, (err) => {
            console.log(err);
            Swal.fire('Error', err.error.msg, 'error');            
          })

    });

  }

  /** ======================================================================
   * LOAD VENDEDORES
  ====================================================================== */
  public vendedores: User[] = [];

  loadVendedores(){

    const query:any = {
      desde: 0,
      hasta: 100000,
      admin: this.rifa.admin,
    }

    this.usersService.loadUsers(query)
        .subscribe( ({ users }) => {

          this.vendedores = users;

        }, (err) => { Swal.fire('Error', err.error.msg, 'error') });

  }

  /** ======================================================================
   * LOAD RUTAS
  ====================================================================== */
  public rutas: Ruta[] = [];
  loadRutas(){    

    let admin = this.rifa.admin;

    this.rutasService.loadRutas({admin, status: true})
        .subscribe( ({rutas, total}) => {          
          this.rutas = rutas;          
        });

  }

  /** ======================================================================
   * LOAD RIFA ID
  ====================================================================== */
  public rifa!: Rifa;
  loadRifa(id: string){

    this.rifasService.loadRifaID(id)
        .subscribe( ({rifa}) => {  

          this.rifa = rifa;
          this.query.rifa = rifa.rifid!;          

          this.loadTickets();
          // LOAD VENDEDORES
          this.loadVendedores();
          // LOAD RUTAS
          this.loadRutas();

          this.newRifaForm.setValue({
            name: this.rifa.name,
            monto: this.rifa.monto.toString(),
            loteria: this.rifa.loteria,
            descripcion: this.rifa.descripcion,
            promocion: this.rifa.promocion,
            comision: this.rifa.comision,
            visible: this.rifa.visible,
            lista: this.rifa.lista,
            min: this.rifa.min,
            max: this.rifa.max
          })

          this.loadGanador();

          if (this.user.wati) {
            this.loadTemplates();
          }
          

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');
          
        })

  }

  /** ======================================================================
   * LOAD PLANTILLAS WATI
  ====================================================================== */
  public templates: any[] = [];
  loadTemplates(){

    this.watiService.loadPlantilla(this.user.watitoken!, this.user.watilink!)
        .subscribe( (resp: any) => {
          
          for (const temp of resp.messageTemplates) {
            
            if (temp.status === "APPROVED") {
              this.templates.push(temp)
            }

          }          
          
        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error, 'error');          
        })

  }

  /** ======================================================================
   * UPDATE RIFA
  ====================================================================== */
  public newRifaFormSubmitted: boolean = false;
  public newRifaForm = this.fb.group({
    name: ['', [Validators.required]],
    monto: ['', [Validators.required]],
    promocion: 0,
    comision: 0,
    loteria: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    visible: false,
    lista: true,
    min: [1, [Validators.min(1)]],
    max: 50,
  })

  update(){

    this.newRifaFormSubmitted = true;

    if (this.newRifaForm.invalid) {
      return;
    }

    this.rifasService.updateRifa(this.newRifaForm.value, this.rifa.rifid!)
        .subscribe( ({rifa}) => {          
          
          this.newRifaFormSubmitted = false;

          this.rifa.name = rifa.name;
          this.rifa.monto = rifa.monto;
          this.rifa.promocion = rifa.promocion;
          this.rifa.comision = rifa.comision;
          this.rifa.loteria = rifa.loteria;
          this.rifa.lista = rifa.lista;
          this.rifa.descripcion = rifa.descripcion;
          
          Swal.fire('Estupendo', 'Se ha actualizado la rifa exitosamente', 'success');

        }, (err) => {
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


  /** ======================================================================
   * LOAD TICKETS
  ====================================================================== */
  public tickets: Ticket[] = [];
  public total: number = 0;
  public disponibles: number = 0;
  public apartados: number = 0;
  public pagados: number = 0;
  public query: any = {
    desde: 0,
    hasta: 1000,
    sort: {numero: 1}
  }

  loadTickets(){

    this.query.rifa = this.rifa.rifid!;

    if (this.user.role !== 'ADMIN') {
      if (!this.query.estado) {
        this.query.estado = 'Disponible';
      }
    }

    this.ticketsService.loadTickets(this.query)
        .subscribe( ({tickets, total, disponibles, apartados, pagados}) => {

          this.tickets = tickets;
          this.total = total;
          this.disponibles = disponibles;
          this.apartados = apartados;
          this.pagados = pagados;

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ======================================================================
   * LOAD TICKETS POR ESTADO
  ====================================================================== */
  searchEstado(estado: string){

    if (estado === 'total') {
      delete this.query.estado;  
      delete this.query.pagos;  
      delete this.query.$expr;  
    }else{
      this.query.estado = estado;

      if (this.user.role !== 'ADMIN' && estado !== 'Disponible') {
        this.query.vendedor = this.user.uid;
      }else{
        delete this.query.vendedor;
      }
    }   

    this.loadTickets();

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
    
    this.loadTickets();
    
  }

  /** ================================================================
   *   CHANGE LIMITE
  ==================================================================== */
  limiteChange( cantidad: any ){
    this.query.hasta = Number(cantidad);    
    this.loadTickets();
  }

  /** ================================================================
   *   SELECT TICKET
  ==================================================================== */
  public paymentsTicket: _pagos[] = [];
  public totalPaid: number = 0;
  public loadingTicket: boolean = false;
  public ticketSelected!: Ticket;
  public ticketWhatsapp: string = '';
  selectTicket(ticket: Ticket){

    this.loadingTicket = true;
    this.paymentsTicket = [];
    this.totalPaid = 0;
    
    this.ticketsService.loadTicketID(ticket.tid!)
    .subscribe( ({ticket}) => {
      
          this.ticketSelected = ticket;
          this.paymentsTicket = ticket.pagos;
          
          if (this.paymentsTicket.length > 0) {
            for (const paid of this.paymentsTicket) {
              this.totalPaid += paid.monto;
            }            
          }

          let hora = new Date(this.rifa.fecha).getHours();
          let forma = 'AM';

          if (hora > 12) {
            hora -= 12;
            forma = 'PM';
          }
          
          this.ticketWhatsapp = `Hola, *${this.ticketSelected.nombre}* \n${this.rifa.admin.empresa} \n*Premio:* ${this.rifa.name} \n*Numero:* ${this.ticketSelected.numero} \n*Valor:* $${this.ticketSelected.monto} \n*Pagado:* $${this.totalPaid} \n*Resta:* $${this.ticketSelected.monto - this.totalPaid} \n*Loteria:* ${this.rifa.loteria} \n*Fecha:* ${new Date(this.rifa.fecha).getDate()}/${new Date(this.rifa.fecha).getMonth()+1}/${new Date(this.rifa.fecha).getFullYear()} ${hora}:${new Date(this.rifa.fecha).getMinutes()} ${forma}  `;
          // this.ticketWhatsapp = `Hola, *${this.ticketSelected.nombre}* \n${this.rifa.admin.empresa} \n*Premio:* ${this.rifa.name} \n*Numero:* ${this.ticketSelected.numero} \n*Valor:* $${this.ticketSelected.monto} \n*Pagado:* $${this.totalPaid} \n*Resta:* $${this.ticketSelected.monto - this.totalPaid} \n*Loteria:* ${this.rifa.loteria} \n*Fecha:* ${new Date(this.rifa.fecha).getDate()}/${new Date(this.rifa.fecha).getMonth()+1}/${new Date(this.rifa.fecha).getFullYear()} ${hora}:${new Date(this.rifa.fecha).getMinutes()} ${forma}  \n\n Ticket ${this.ticketSelected.estado}, para estar enterado de nuestros sorteos, sigue nuestro canal de Whatsapp e Instagram abajo de dejo los links suerte. \n\n **Instagram** \nhttps://instagram.com/r_aurinegros \n\n **Whatsapp** \n https://whatsapp.com/channel/0029VbAM4QN5fM5hiVUOgQ0N`;
          
          setTimeout( () =>{

            if (ticket.disponible) {
              this.ticketUpdate.reset({
                tid: ticket.tid!,
                estado: 'Disponible',
                vendedor: this.user.uid!,
                disponible: true
              });
              this.loadingTicket = false;
              return;
            }

            this.loadingTicket = false;
            this.ticketUpdate.setValue({
              tid: ticket.tid!,
              nombre: ticket.nombre,
              telefono: ticket.telefono,
              cedula: ticket.cedula,
              direccion: ticket.direccion,
              ruta: (ticket.ruta)? ticket.ruta._id!:'',
              estado: ticket.estado,
              nota: ticket.nota || '',
              vendedor: this.user.uid!,
              monto: ticket.monto,
              disponible: false,
              cliente: (ticket.cliente)? ticket.cliente: null
            })
  
            
          },1000 )


        })

  }

  /** ================================================================
   *   UPDATE TICKET
  ==================================================================== */
  public ticketUpdateSubmitted: boolean = false;
  public ticketUpdate: any = this.fb.group({
    tid: [''],
    nombre: ['', [Validators.required]],
    telefono: ['', [Validators.required]],
    cedula: ['', [Validators.required]],
    direccion: ['', [Validators.required]],
    ruta: ['', [Validators.required]],
    estado: 'Disponible',
    nota: '',
    vendedor: '',
    monto: 0,
    disponible: false,
    cliente: null 
  })

  updateTicket(){

    this.ticketUpdateSubmitted = true;
    
    if (this.ticketUpdate.invalid) {
      return;
    }

    if (this.ticketUpdate.value.estado !== 'Disponible') {
      this.ticketUpdate.value.disponible = false;
    }else{
      this.ticketUpdate.value.disponible = true;
    }
    
    if (this.ticketUpdate.value.ruta === '') {
      Swal.fire('Atención', 'Debes de seleccionar una ruta', 'success');
      return;
    }
    
    this.ticketsService.updateTicket(this.ticketUpdate.value, this.ticketUpdate.value.tid!)
        .subscribe( ({ticket}) => {

          this.tickets.map( (tic) => {
            if (tic.tid === ticket.tid) {
              tic.estado = ticket.estado;
              tic.nombre = ticket.nombre;
            }
          });

          this.ticketUpdateSubmitted = false;
          this.ticketSelected = ticket;

          let hora = new Date(this.rifa.fecha).getHours();
          let forma = 'AM';
          if (hora > 12) {
            hora -= 12;
            forma = 'PM';
          }
          
          this.ticketWhatsapp = `Hola, *${this.ticketSelected.nombre}* \n${this.rifa.admin.empresa} \n*Premio:* ${this.rifa.name} \n*Numero:* ${this.ticketSelected.numero} \n*Valor:* $${this.ticketSelected.monto} \n*Pagado:* $${this.totalPaid} \n*Resta:* $${this.ticketSelected.monto - this.totalPaid} \n*Loteria:* ${this.rifa.loteria} \n*Fecha:* ${new Date(this.rifa.fecha).getDate()}/${new Date(this.rifa.fecha).getMonth()+1}/${new Date(this.rifa.fecha).getFullYear()} ${hora}:${new Date(this.rifa.fecha).getMinutes()} ${forma}  `;
          // this.ticketWhatsapp = `Hola, *${this.ticketSelected.nombre}* \n${this.rifa.admin.empresa} \n*Premio:* ${this.rifa.name} \n*Numero:* ${this.ticketSelected.numero} \n*Valor:* $${this.ticketSelected.monto} \n*Pagado:* $${this.totalPaid} \n*Resta:* $${this.ticketSelected.monto - this.totalPaid} \n*Loteria:* ${this.rifa.loteria} \n*Fecha:* ${new Date(this.rifa.fecha).getDate()}/${new Date(this.rifa.fecha).getMonth()+1}/${new Date(this.rifa.fecha).getFullYear()} ${hora}:${new Date(this.rifa.fecha).getMinutes()} ${forma}  \n\n Ticket ${this.ticketSelected.estado}, para estar enterado de nuestros sorteos, sigue nuestro canal de Whatsapp e Instagram abajo de dejo los links suerte. \n\n **Instagram** \nhttps://instagram.com/r_aurinegros \n\n **Whatsapp** \n https://whatsapp.com/channel/0029VbAM4QN5fM5hiVUOgQ0N`;
          
          Swal.fire('Estupendo', 'Se ha actualizado el ticket exitosamente', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })
    

  }

  /** ================================================================
   *   VALIDATE UPDATE TICKET
  ==================================================================== */
  validateUpTicket(campo: string): boolean{

    if (this.ticketUpdateSubmitted && this.ticketUpdate.get(campo)?.invalid ) {
      return true;
    }else{
      return false;
    }

  }

  /** ================================================================
   *   CHANGE VENDEDOR TICKET
  ==================================================================== */
  cambiarVendedor(vendedor: string){

    if (vendedor === 'none') {
      Swal.fire('Atención', 'debes de seleccionar un vendedor', 'warning');
      return;
    }

    this.ticketsService.updateVendedorTicket({vendedor}, this.ticketSelected.tid!)
        .subscribe( ({ticket}) => {

          this.ticketSelected.vendedor = ticket.vendedor;

          Swal.fire({
            toast: true,
            title: 'Vendedor Actualizado!',
            timer: 2000,
            icon: 'success',
            position: 'top-right',
            showConfirmButton: false,
          })

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ================================================================
   *   CLEAR TICKETS WEB
  ==================================================================== */
  clearTicketsWeb(p: any, i: any){
    
    Swal.fire({
      title: "Estas seguro de limpiar este pago?",
      text: "Si haces esto!, se eliminara toda la información del ticket o los tickets automaticamente",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, limpiar!",
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        for (const ticket of p.tickets) {

          setTimeout( () => {
            this.ticketsService.clearTicket(ticket.tid)
                .subscribe( ({ticket}) => {
    
                  this.tickets.map( (tic) => {
                    if (tic.tid === ticket.tid) {
                      tic.estado = ticket.estado;
                      tic.nombre = ticket.nombre;
                    }
                  });
                      
                }, (err) => {
                  console.log(err);
                  Swal.fire('Error', err.error.msg, 'error');              
                })
          }, 300)
          
        }

        Swal.fire('Estupendo', 'Se ha limpiado el ticket exitosamente este pago', 'success');
        this.ticketsAg.splice(i, 1)
        

      }
    });
    

  }


  /** ================================================================
   *   CLEAR TICKET
  ==================================================================== */
  clearTicket(id: string){

    Swal.fire({
      title: "Estas seguro de limpiar el ticket?",
      text: "Si haces esto!, se eliminara toda la información del ticket automaticamente",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, limpiar!",
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.ticketsService.clearTicket(id)
            .subscribe( ({ticket}) => {

              this.tickets.map( (tic) => {
                if (tic.tid === ticket.tid) {
                  tic.estado = ticket.estado;
                  tic.nombre = ticket.nombre;
                }
              });
              this.ticketSelected = ticket;
              this.paymentsTicket = [];
              this.totalPaid = 0;

              this.ticketUpdate.reset({
                tid: ticket.tid!,
                estado: 'Disponible',
                vendedor: this.user.uid!,
                disponible: true
              });

              Swal.fire('Estupendo', 'Se ha limpiado el ticket exitosamente', 'success');

            }, (err) => {
              console.log(err);
              Swal.fire('Error', err.error.msg, 'error');              
            })

      }
    });

  }

  /** ================================================================
   *   GANADOR TICKET
  ==================================================================== */
  public ganador!: Ticket;
  ganadorTicket(id: string){

    Swal.fire({
      title: "Estas seguro que este ticket a sido el ganador?",
      text: "Si aceptas de que es el ganador, no podras cambiarlo",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, es el ticket ganador!",
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        let formData = {
          tid: id,
          rifid: this.rifa.rifid
        }
        
        this.ticketsService.ganadorTicket(formData)
            .subscribe( ({ticket}) => {

              this.ganador = ticket;

              this.tickets.map( (tic) => {
                if (tic.tid === ticket.tid) {
                  tic.ganador = true;
                }
              });

              Swal.fire('Estupendo', 'Este ticket a sido seleccionado como el ticket ganador de esta rifa!', 'success');

            }, (err) => {
              console.log(err);
              Swal.fire('Error', err.error.msg, 'error');              
            })

      }
    });

  }
  
  /** ================================================================
   *   UPDATE LIST TICKETS
  ==================================================================== */
  updateListTikcets(){

    this.ticketUpdateSubmitted = true;
    
    if (this.ticketUpdate.invalid) {
      return;
    }

    if (this.ticketUpdate.value.estado !== 'Disponible') {
      this.ticketUpdate.value.disponible = false;
    }else{
      this.ticketUpdate.value.disponible = true;
    }

    this.ticketUpdate.value.vendedor = this.user.uid;
    
    let i = 0;
    
    for  (const ticket of this.listTicketsSelect) {

      this.ticketUpdate.value.tid = ticket.tid!;      

      this.ticketsService.updateTicket(this.ticketUpdate.value, ticket.tid!)
        .subscribe( ({ticket}) => {

          this.tickets.map( (tic) => {
            if (tic.tid === ticket.tid) {
              tic.estado = ticket.estado;
              tic.nombre = ticket.nombre;
            }
          });

          this.ticketUpdateSubmitted = false;
          i++;
          
          if (i === this.listTicketsSelect.length) {
            Swal.fire('Estupendo', `Se actualizaron ${i} tickets`, 'success');
            this.listTicketsSelect = [];
            this.ticketUpdate.reset({
              estado: 'Disponible',
              disponible: false
            })
          }

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })
    }    

  }

  /** ================================================================
   *   ADD PAID
  ==================================================================== */
  @ViewChild('desc') desc!: ElementRef;
  @ViewChild('monto') monto!: ElementRef;

  addPaid(descripcion: string, monto: any){

    monto = Number(monto);

    if (monto <= 0) {
      Swal.fire('Atención', 'Debes de agregar un monto valido', 'warning');
      return;
    }

    // COMPROBAR QUE EL ABONO NO SEA MAYOR AL TOTAL DEL TICKET
    if ((this.totalPaid + monto) > this.ticketSelected.monto) {
      monto = this.ticketSelected.monto - this.totalPaid;
    }

    let estado = 'Confirmado';

    if (this.user.uid !== this.rifa.admin.uid) {
      estado = 'Pendiente';
    }

    this.totalPaid += monto;
    this.paymentsTicket.push({
      descripcion,
      estado,
      user: this.user.uid,
      monto
    });

    let campos: any = {
      pagos: this.paymentsTicket
    }

    if (this.totalPaid >= this.ticketSelected.monto) {
      campos.estado = 'Pagado';
      this.ticketUpdate.value.estado = 'Pagado';
    }else{
      campos.estado = 'Apartado';
      this.ticketUpdate.value.estado = 'Apartado';
    }

    this.ticketsService.updateTicket(campos, this.ticketUpdate.value.tid!)
        .subscribe( ({ ticket }) => {

          Swal.fire('Estupendo', 'Se ha agregado el pago exitosamente!', 'success');

          this.paymentsTicket = [];
          this.totalPaid = 0;

          this.paymentsTicket = ticket.pagos;
          if (this.paymentsTicket.length > 0) {
            for (const paid of this.paymentsTicket) {
              this.totalPaid += paid.monto;
            }            
          }

          this.tickets.map( (tic) => {
            if (tic.tid === ticket.tid) {
              tic.estado = ticket.estado;
            }
          });

          this.ticketSelected = ticket;

          let hora = new Date(this.rifa.fecha).getHours();
          let forma = 'AM';

          if (hora > 12) {
            hora -= 12;
            forma = 'PM';
          }
          
          this.ticketWhatsapp = `Hola, *${this.ticketSelected.nombre}* \n${this.rifa.admin.empresa} \n*Premio:* ${this.rifa.name} \n*Numero:* ${this.ticketSelected.numero} \n*Valor:* $${this.ticketSelected.monto} \n*Pagado:* $${this.totalPaid} \n*Resta:* $${this.ticketSelected.monto - this.totalPaid} \n*Loteria:* ${this.rifa.loteria} \n*Fecha:* ${new Date(this.rifa.fecha).getDate()}/${new Date(this.rifa.fecha).getMonth()+1}/${new Date(this.rifa.fecha).getFullYear()} ${hora}:${new Date(this.rifa.fecha).getMinutes()} ${forma}  `;
          // this.ticketWhatsapp = `Hola, *${this.ticketSelected.nombre}* \n${this.rifa.admin.empresa} \n*Premio:* ${this.rifa.name} \n*Numero:* ${this.ticketSelected.numero} \n*Valor:* $${this.ticketSelected.monto} \n*Pagado:* $${this.totalPaid} \n*Resta:* $${this.ticketSelected.monto - this.totalPaid} \n*Loteria:* ${this.rifa.loteria} \n*Fecha:* ${new Date(this.rifa.fecha).getDate()}/${new Date(this.rifa.fecha).getMonth()+1}/${new Date(this.rifa.fecha).getFullYear()} ${hora}:${new Date(this.rifa.fecha).getMinutes()} ${forma}  \n\n Ticket ${this.ticketSelected.estado}, para estar enterado de nuestros sorteos, sigue nuestro canal de Whatsapp e Instagram abajo de dejo los links suerte. \n\n **Instagram** \nhttps://instagram.com/r_aurinegros \n\n **Whatsapp** \n https://whatsapp.com/channel/0029VbAM4QN5fM5hiVUOgQ0N`;
          

          this.desc.nativeElement.value = '';
          this.monto.nativeElement.value = '';

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })


  }

  /** ================================================================
   *   DELETE PAID
  ==================================================================== */
  deletePaid(i:any){

    Swal.fire({
      title: "Estas seguro?",
      text: "De eliminar este pago!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Cancelar",
      confirmButtonText: "Si, eliminar!"
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.paymentsTicket.splice(i, 1);
        this.totalPaid = 0;
        if (this.paymentsTicket.length > 0) {
          for (const paid of this.paymentsTicket) {
            this.totalPaid += paid.monto;
          }            
        }

        let campos: any = {
          pagos: this.paymentsTicket
        }

        if (this.totalPaid >= this.ticketSelected.monto) {
          campos.estado = 'Pagado';
          this.ticketUpdate.value.estado = 'Pagado';
        }else{
          campos.estado = 'Apartado';
          this.ticketUpdate.value.estado = 'Apartado';
        }

        this.ticketsService.updateTicket(campos, this.ticketUpdate.value.tid!)
        .subscribe( ({ ticket }) => {

          Swal.fire('Estupendo', 'Se ha agregado el pago exitosamente!', 'success');

          this.paymentsTicket = [];
          this.totalPaid = 0;

          this.paymentsTicket = ticket.pagos;
          if (this.paymentsTicket.length > 0) {
            for (const paid of this.paymentsTicket) {
              this.totalPaid += paid.monto;
            }            
          }

          this.tickets.map( (tic) => {
            if (tic.tid === ticket.tid) {
              tic.estado = ticket.estado;
            }
          });

          this.ticketSelected = ticket;

          let hora = new Date(this.rifa.fecha).getHours();
          let forma = 'AM';

          if (hora > 12) {
            hora -= 12;
            forma = 'PM';
          }
          
          this.ticketWhatsapp = `Hola, * ${this.ticketSelected.nombre.toUpperCase()} * \n${this.rifa.admin.empresa || ''} \n*Premio:* ${this.rifa.name} \n*Numero:* ${this.ticketSelected.numero} \n*Valor:* $${this.ticketSelected.monto} \n*Pagado:* $${this.totalPaid} \n*Resta:* $${this.ticketSelected.monto - this.totalPaid} \n*Loteria:* ${this.rifa.loteria} \n*Fecha:* ${new Date(this.rifa.fecha).getDate()}/${new Date(this.rifa.fecha).getMonth()+1}/${new Date(this.rifa.fecha).getFullYear()} ${hora}:${new Date(this.rifa.fecha).getMinutes()} ${forma} `;
          // this.ticketWhatsapp = `Hola, * ${this.ticketSelected.nombre.toUpperCase()} * \n${this.rifa.admin.empresa || ''} \n*Premio:* ${this.rifa.name} \n*Numero:* ${this.ticketSelected.numero} \n*Valor:* $${this.ticketSelected.monto} \n*Pagado:* $${this.totalPaid} \n*Resta:* $${this.ticketSelected.monto - this.totalPaid} \n*Loteria:* ${this.rifa.loteria} \n*Fecha:* ${new Date(this.rifa.fecha).getDate()}/${new Date(this.rifa.fecha).getMonth()+1}/${new Date(this.rifa.fecha).getFullYear()} ${hora}:${new Date(this.rifa.fecha).getMinutes()} ${forma} \n\n Ticket ${this.ticketSelected.estado}, para estar enterado de nuestros sorteos, sigue nuestro canal de Whatsapp e Instagram abajo de dejo los links suerte. \n\n **Instagram** \nhttps://instagram.com/r_aurinegros \n\n **Whatsapp** \n https://whatsapp.com/channel/0029VbAM4QN5fM5hiVUOgQ0N`;
          

          this.desc.nativeElement.value = '';
          this.monto.nativeElement.value = '';

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

      }
    });

  }

  /** ================================================================
   *   FILTRAR POR RUTA
  ==================================================================== */
  filterRuta(ruta: string){

    if (ruta === 'Todos') {
      delete this.query.ruta;
      this.loadTickets();
      return;
    }

    this.query.ruta = ruta;
    this.loadTickets();

  }

  /** ================================================================
   *   FILTRAR POR VENDEDOR
  ==================================================================== */
  filterVendedor(vendedor: string){

    if (vendedor === 'Todos') {
      delete this.query.vendedor;
      this.loadTickets();
      return;
    }

    this.query.vendedor = vendedor;
    this.loadTickets();

  }

  /** ================================================================
   *   SEARCH TICKET REZAGADO
  ==================================================================== */
  filterRezagados(){

    this.query.pagos = { $size: 0 };
    this.loadTickets();

  }

  /** ================================================================
   *   SEARCH MONTO X
  ==================================================================== */
  filterMonto(monto: any){

    monto = Number(monto);
    if (monto <= 0) {
      Swal.fire('Atención', 'El monto debe ser mayor a 0', 'warning');
      return;
    }

    this.query.$expr = {
      $lt: [
        {
          $reduce: {
            input: "$pagos",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.monto"] }
          }
        },
        monto  // Monto límite
      ]
    }

    this.loadTickets();

  }

  /** ================================================================
   *   LIMPIAR FILTRO
  ==================================================================== */
  clearFilters(){
    delete this.query.$expr;
    delete this.query.pagos;

    this.loadTickets();
  }

  /** ================================================================
   *   SEARCH TICKET FOR CLIENT
  ==================================================================== */
  search(busqueda: string){

    if (busqueda.length < 2 || busqueda.length === 0) {
      delete this.query['$or'];
    }else{
      const regex = { $regex: busqueda, $options: 'i' }; // Construir regex      
      this.query.$or = [
        { telefono: regex },
        { nombre: regex },
        { correo: regex },
        { cedula: regex }
      ];
    }

    this.loadTickets();

  }

  /** ================================================================
   *   ADD PAID
  ==================================================================== */
  @ViewChild('nameM') nameM!: ElementRef;
  @ViewChild('descM') descM!: ElementRef;
  @ViewChild('cuentaM') cuentaM!: ElementRef;
  @ViewChild('tasaM') tasaM!: ElementRef;

  addMetodoPaid(name: string, descripcion: string, cuenta: string, tasa: any, min: any = 0){

    tasa = Number(tasa);
    min = Number(min);
    
    if (name.length === 0 || descripcion.length === 0 || cuenta.length === 0 || tasa <= 0 || min < 0) {
      Swal.fire('Atención', 'Debes de llenar los campos obligatorios', 'warning');
      return;
    }

    this.rifa.metodos.push({
      name,
      descripcion,
      cuenta,
      tasa,
      min
    })

    this.rifasService.updateRifa({metodos: this.rifa.metodos}, this.rifa.rifid!)
        .subscribe( ({ rifa }) => {

          Swal.fire('Estupendo', 'Se ha agregado el metodo pago exitosamente!', 'success');

          this.nameM.nativeElement.value = '';
          this.descM.nativeElement.value = '';
          this.cuentaM.nativeElement.value = '';
          this.tasaM.nativeElement.value = '';

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })


  }

  /** ================================================================
   *   DELETE PAID
  ==================================================================== */
  deleteMetodoPaid(i:any){

    Swal.fire({
      title: "Estas seguro?",
      text: "De eliminar este metodo pago!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Cancelar",
      confirmButtonText: "Si, eliminar!"
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.rifa.metodos.splice(i, 1);

        this.rifasService.updateRifa({metodos: this.rifa.metodos}, this.rifa.rifid!)
        .subscribe( ({ rifa }) => {

          Swal.fire('Estupendo', 'Se ha eliminado el metodo pago exitosamente!', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

      }
    });

  }

  /** ================================================================
   *   EDIT PAID
  ==================================================================== */
  async editMetodoPaid(paid : _metodos){

    // 1. Hacer el modal de Bootstrap "inert" temporalmente
    document.getElementById('addMetodoPaid')?.setAttribute('inert', '');

    const { value: formValues } = await Swal.fire({
      title: 'Editar metodo de pago',
      html:
        `<div class="form-group mb-3">
            <input id="swal-name" type="text" class="form-control" placeholder="Nombre" value="${paid.name}">
            
        </div>
        <div class="form-group mb-3">
            <input id="swal-descripcion" type="text" class="form-control" placeholder="Descripción" value="${paid.descripcion}">
        </div>
        <div class="form-group mb-3">
            <input id="swal-cuenta" type="text" class="form-control" placeholder="Cuenta" value="${paid.cuenta}">
        </div>
        <div class="form-group mb-3">
            <input id="swal-tasa" type="number" min="1" class="form-control" placeholder="Tasa" value="${paid.tasa}">
        </div>
        <div class="form-group mb-3">
            <input id="swal-min" type="number" min="1" class="form-control" placeholder="Compra Minima" value="${paid.min}">
        </div>
        `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      confirmButtonColor: '#25D366',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-name') as HTMLInputElement).value,
          descripcion: (document.getElementById('swal-descripcion') as HTMLInputElement).value,
          cuenta: (document.getElementById('swal-cuenta') as HTMLInputElement).value,
          tasa: (document.getElementById('swal-tasa') as HTMLInputElement).value,
          min: (document.getElementById('swal-min') as HTMLInputElement).value,
        }
      },
      // Opcional: Validación básica
      didOpen: () => {
        Swal.getConfirmButton()?.addEventListener('click', () => {
          const name = (document.getElementById('swal-name') as HTMLInputElement).value;
          const descripcion = (document.getElementById('swal-descripcion') as HTMLInputElement).value;
          const cuenta = (document.getElementById('swal-cuenta') as HTMLInputElement).value;
          const tasa = (document.getElementById('swal-tasa') as HTMLInputElement).value;
          const min = (document.getElementById('swal-min') as HTMLInputElement).value;
          if (!name ||
              !descripcion ||
              !cuenta ||
              !tasa ||
              !min) {
            Swal.showValidationMessage('Todos los campos son requeridos');
          }
        });
      }
    });

    if (formValues) {
      // Actualizamos las variables solo si el usuario confirmó
      
      paid.name = formValues.name
      paid.descripcion = formValues.descripcion
      paid.cuenta = formValues.cuenta
      paid.tasa = formValues.tasa
      paid.min = formValues.min

      this.rifasService.updateRifa({metodos: this.rifa.metodos}, this.rifa.rifid!)
          .subscribe( () => {
            Swal.fire('Estupendo', 'Se ha actualizado el metodo pago exitosamente!', 'success');
          }, (err) => {
            console.log(err);
            Swal.fire('Error', err.error.msg, 'error');            
          })
    }

    document.getElementById('addMetodoPaid')?.removeAttribute('inert');

  }

  /** ================================================================
   *   ADD PAID
  ==================================================================== */
  @ViewChild('nameP') nameP!: ElementRef;
  @ViewChild('descripcionP') descripcionP!: ElementRef;
  @ViewChild('fechaP') fechaP!: ElementRef;

  addPremios(name: string, descripcion: string, fecha: any){
    
    if (name.length === 0 || descripcion.length === 0 || fecha.length === 0) {
      Swal.fire('Atención', 'Debes de llenar los campos obligatorios', 'warning');
      return;
    }

    this.rifa.premios.push({
      name,
      descripcion,
      fecha: new Date(fecha)
    })

    this.rifasService.updateRifa({premios: this.rifa.premios}, this.rifa.rifid!)
        .subscribe( ({ rifa }) => {

          Swal.fire('Estupendo', 'Se ha agregado el premio especial exitosamente!', 'success');

          this.nameP.nativeElement.value = '';
          this.descripcionP.nativeElement.value = '';
          this.fechaP.nativeElement.value = '';

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })


  }

  /** ================================================================
   *   DELETE PAID
  ==================================================================== */
  deletePremio(i:any){

    Swal.fire({
      title: "Estas seguro?",
      text: "De eliminar este premio especial!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Cancelar",
      confirmButtonText: "Si, eliminar!"
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.rifa.premios.splice(i, 1);

        this.rifasService.updateRifa({premios: this.rifa.premios}, this.rifa.rifid!)
        .subscribe( ({ rifa }) => {

          Swal.fire('Estupendo', 'Se ha eliminado el premio especial exitosamente!', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

      }
    });

  }

  /** ================================================================
   *   ACTUALIZAR IMAGEN
  ==================================================================== */
  public imgTempP: any = null;
  public subirImagen!: any;
  cambiarImage(file: any): any{  
    
    this.subirImagen = file.target.files[0];
    
    if (!this.subirImagen) { return this.imgTempP = null }    
    
    const reader = new FileReader();
    const url64 = reader.readAsDataURL(file.target.files[0]);
        
    reader.onloadend = () => {
      this.imgTempP = reader.result;      
    }

  }

  /** ================================================================
   *  SUBIR IMAGEN
  ==================================================================== */
  @ViewChild('fileImg') fileImg!: ElementRef;
  public imgPerfil: string = 'no-image';
  subirImg(type: any){
    
    this.fileUploadService.updateImage( this.subirImagen, type, this.rifa.rifid!)
    .then( 
      (resp:{ date: Date, nombreArchivo: string, ok: boolean }) => {

        if (type === 'rifa') {
          this.rifa.img.push({
            img: resp.nombreArchivo,
            fecha: resp.date
          })          
        }else{
          this.rifa.portada = {
            img: resp.nombreArchivo,
            fecha: resp.date
          }
        }
        
      }
    );
    
    this.fileImg.nativeElement.value = '';
    this.imgTempP = null;
    
  }

  /** ================================================================
   *  ELIMINAR IMAGEN
  ==================================================================== */
  deleImg(img: string){

    this.fileUploadService.deleteFile(img, this.rifa.rifid!, 'rifa')
        .subscribe( (resp: {rifa: Rifa}) => {
          
          this.rifa.img = resp.rifa.img;
          Swal.fire('Estupendo', 'Se ha eliminado la imagen exitosamente!', 'success');
          
        }, (err)  => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        });

  }

  /** ================================================================
   *  CONFIG SWIPER
  ==================================================================== */  
  public config = {
    slidesPerView:1,
    spaceBetween:10,
    centeredSlides: true,
    navigation: true,
    pagination: { clickable: true, dynamicBullets: true },
    breakpoints:{
      '450': {
        slidesPerView: 2,
        spaceBetween: 20,
        centeredSlides: false,
      },
      '640': {
        slidesPerView: 3,
        spaceBetween: 30,
        centeredSlides: false,
      },
      '768': {
        slidesPerView: 3,
        spaceBetween: 40,
        centeredSlides: false,
      },
    }

  }

  /** ================================================================
   *   ENVIAR WHATSAPP
  ==================================================================== */
  public sendM: boolean = false;
  sendWhatsapp(message: string){

    if (!this.user.whatsapp) {
      this.sendWhatsappOld(message);
    }else{    
        
      if (this.ticketSelected.telefono) {
        
        this.sendM = true;

        if (this.user.wati) {

          this.watiService.sendMessage(this.user.watitoken!, this.user.watilink!, this.ticketSelected.telefono.trim(), message)
              .subscribe( (resp: any) => {

                this.sendM = false;                

                if (!resp.result) {
                  Swal.fire('Error', resp.info, 'error');
                  return;       
                }

                Swal.fire('Estupendo', 'se estan enviando todos los mensajes', 'success');
  
                const Toast = Swal.mixin({
                  toast: true,
                  position: "top-end",
                  showConfirmButton: false,
                  timer: 2000,
                  timerProgressBar: true,
                  didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                  }
                });
  
                Toast.fire({
                  icon: "success",
                  title: 'se ha enviado el mensaje con exito'
                });
                

              }, (err) => {
                console.log(err);
                this.sendM = false;
                Swal.fire('Error', err.error, 'error');                
              })
          
        }else{
          this.whatsappService.sendMessage(this.user.uid!, {message: message, number: this.ticketSelected.telefono.trim()}, this.user.wp!)
          .subscribe( ({ok, msg}) => {
                this.sendM = false;
  
                const Toast = Swal.mixin({
                  toast: true,
                  position: "top-end",
                  showConfirmButton: false,
                  timer: 2000,
                  timerProgressBar: true,
                  didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                  }
                });
  
                Toast.fire({
                  icon: "success",
                  title: msg
                });
                
              }, (err)=> {
                console.log(err);
                Swal.fire('Error', err.error.msg, 'error');            
                this.sendM = false;
              })  
        }

      }

    }
    
  }

  /** ================================================================
   *   ENVIAR WHATSAPP
  ==================================================================== */
  sendWhatsappOld(msg: string){
    
    let text = msg.replaceAll(' ','+').replaceAll('\n' , '%0A');

    // window.open(`https://wa.me/${this.ticketSelected.telefono}?text=${text}`, '_blank')
    window.open(`whatsapp://send?text=${text}&phone=${this.ticketSelected.telefono}`);
    
  }


  /** ================================================================
   *  CLIPBOARD
  ==================================================================== */
  copyToClipboard() {
    document.addEventListener('copy', (e: ClipboardEvent) => {
      e.clipboardData!.setData('text/plain', (`https://rifari.com/rifa/${this.rifa.rifid!}`));
      e.preventDefault();
      document.removeEventListener('copy', null!);
    });
    document.execCommand('copy');
  }

  /** ================================================================
   *   SELECT VARIOS
  ==================================================================== */
  public listTicketsSelect: Ticket[] = [];
  addTicketList(ticket: Ticket){

    const validarItem = this.listTicketsSelect.findIndex( (tic) =>{      
      if (tic.tid === ticket.tid ) {
        return true;
      }else {
        return false;
      }
    });

    if (validarItem === -1) {      
      this.listTicketsSelect.push(ticket);
    }    

  }

  /** ================================================================
   *   DELET TICKET LIST
  ==================================================================== */
  delTicketList(i: number){
    this.listTicketsSelect.splice(i,1);
  }

  /** ================================================================
   *   VER INGRESOS
  ==================================================================== */
  public apartadosIng: Ticket[] = [];
  public pagadosIng: Ticket[] = [];
  public pendientes: Ticket[] = [];
  public totalTickets: number = 0;
  public totalApartado: number = 0;
  public totalPendiente: number = 0;
  public totalPendienteCobrar: number = 0;
  public totalPagado: number = 0;
  loadIngresos(){

    this.loadingEgresos = true;

    this.totalTickets = 0;
    this.totalApartado = 0;
    this.totalPendiente = 0;
    this.totalPendienteCobrar = 0;
    this.totalPagado = 0;

    this.ticketsService.loadIngresosTickets(this.rifa.rifid!)
        .subscribe( ({apartados, pagados, totalApartado,totalPagado, pendientes}) => {

          this.apartadosIng = apartados;
          this.pagadosIng = pagados;
          this.totalApartado = totalApartado;
          this.totalPagado = totalPagado;
          this.pendientes = pendientes;          
          
          for (const tick of pendientes) {

            for (const paid of tick.pagos) {
              
              if (paid.estado === 'Pendiente') {                
                this.totalPendiente += paid.monto;
              }

            }
            
          }

          for (const tick of this.apartadosIng) {
            this.totalTickets+= tick.monto;
          }

          this.totalPendienteCobrar = (this.totalTickets - this.totalApartado);         
          

          this.loadEgresos();
          
        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  getRutaWebID(rutas:any) {
    const rutaWeb = rutas.find((r:any) => r.name.trim().toLowerCase() === 'web');
    return rutaWeb ? rutaWeb.ruid : null;
  }

  /** ================================================================
   *   COMPRAS WEB
  ==================================================================== */
  public ticketsAg: any[] = [];
  public metodosAg: any[] = [];
  public loadingComprasWeb: boolean = true;
  loadComprasWeb(){

    // console.log(this.rutas);
    let rutaW = this.getRutaWebID(this.rutas);
    this.loadingComprasWeb = true;
    
    this.ticketsService.loadTickets({ rifa: this.rifa.rifid, estado: 'Apartado', ruta: rutaW})
        .subscribe( ({tickets}) => {

          this.loadingComprasWeb = false;
          const grupos: { [clave: string]: any } = {};
          const meto: { [clave: string]: any } = {};

          let metodoDesconocido = {
            name: 'Desconocido',
            tasa: 1,
            descripcion: 'No hay descripcion',
            cuenta: 'verificar capture',
            _id: '00000000001'
          }
          
          
          for (const ticket of tickets) {

            if (ticket.pagos.length === 0) {
              continue;
            }

            if (!ticket.pagos[0].metodo) {
              ticket.pagos[0].metodo = metodoDesconocido;
              // continue
            }

            const telefono = ticket.telefono || '';
            const clave = `${telefono}-${ticket.pagos[0]!.img || ''}`;

            if (!grupos[clave]) {
              grupos[clave] = {
                nombre: ticket.nombre,
                estado: 'Pendiente',
                ver: true,
                referencia: ticket.pagos[0].referencia,
                fecha: ticket.pagos[0].fecha,
                telefono: telefono,
                tasa: ticket.pagos[0].metodo['tasa'] || 1,
                monto: 0,
                equivalencia: 0,
                img: ticket.pagos[0].img,
                metodo: ticket.pagos[0].metodo._id,
                metodoname: ticket.pagos[0].metodo.name,
                tickets: []
              };
            }

            grupos[clave].monto += ticket.monto;
            grupos[clave].equivalencia += ticket.pagos[0].equivalencia;
            grupos[clave].tickets.push(ticket);

            if (!meto[ticket.pagos[0].metodo._id]) {
              meto[ticket.pagos[0].metodo._id] = {
                name: ticket.pagos[0].metodo.name,
                id: ticket.pagos[0].metodo._id,
                monto: 0,
                equivalencia: 0
              }
            }
            

          }

          // Convertir el objeto a array;
          this.ticketsAg = Object.values(grupos);
          this.metodosAg = Object.values(meto);


          this.totalizarMetodos();
          

        }, (err)=> {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }
  /** ================================================================
   *   TOTALIZAR METODOS DE PAGO
  ==================================================================== */
  sanitizeText(text: string): string {
    return text.replace(/\n/g, '<br>');
  }

  /** ================================================================
   *   TOTALIZAR METODOS DE PAGO
  ==================================================================== */
  public totalPaidWeb: number = 0;
  totalizarMetodos(){

    this.totalPaidWeb = 0;
    this.metodosAg.map( meto => {meto.monto = 0; meto.equivalencia = 0})

    this.ticketsAg.map( ti => {

      if (ti.ver) {
        
        this.metodosAg.map( met => {
          if (met.id === ti.metodo) {
            
            met.monto += ti.monto;
            met.equivalencia += ti.equivalencia;
          }        
        })      
        this.totalPaidWeb += ti.monto;
      }

    })    

  }
  
  /** ================================================================
   *   TOTALIZAR METODOS DE PAGO
  ==================================================================== */
  filtrarMetodoWeb(metodo: string){

    if (metodo === 'Todos') {
      this.ticketsAg.map( t => t.ver = true)
    }else{
      this.ticketsAg.map( t => {

        if(t.metodo === metodo){
          t.ver = true
        }else{
          t.ver = false
        }

      })

    }

    this.totalizarMetodos();

  }

  /** ================================================================
   *   PREPARE MENSAJE
  ==================================================================== */
  public wmwb: string = '';
  public wtwb: string = '';
  prepareWhatsappWeb(pago: any){

    const numeros = pago.tickets.map((t:any) => '*#' + t.numero + '*').join(', ');    

    if (pago.estado === 'Confirmado') {

      // this.wmwb = `Hola ${pago.nombre}, hemos confirmado exitosamente la compra de ${ (pago.tickets.length > 1)? 'tus tickets': 'tu ticket' } @number , con el metodo de pago ${pago.metodoname}, referencia ${pago.referencia}, gracias por tu compra`
      this.wmwb = `Hola ${pago.nombre}, hemos confirmado exitosamente la compra de ${ (pago.tickets.length > 1)? 'tus tickets': 'tu ticket' } @number , con el metodo de pago ${pago.metodoname}, referencia ${pago.referencia}, Ya sabes ponte bonit@ y espera la llamada ganadora`
      
    }else{
      this.wmwb = `Hola ${pago.nombre}, No hemos podido confirmar la compra de ${ (pago.tickets.length > 1)? 'tus tickets': 'tu ticket' } @number, con el metodo de pago ${pago.metodoname}, referencia ${pago.referencia}, porfavor vuelve a enviarnos los datos por este medio`
    }

    this.wmwb = this.wmwb.replace(/@number/g, numeros);
    this.wtwb = pago.telefono;
    
    this.showWhatsAppForm()

  }

  /** ================================================================
   *   SEND MENSAJE
  ==================================================================== */
  async showWhatsAppForm() {

    // 1. Hacer el modal de Bootstrap "inert" temporalmente
    document.getElementById('comprasWeb')?.setAttribute('inert', '');
    

    const { value: formValues } = await Swal.fire({
      title: 'Enviar mensaje por WhatsApp',
      html:
        `<div class="form-group mb-3">
          <input id="swal-number" class="form-control" 
                placeholder="Número de teléfono" 
                value="${this.wtwb || ''}">
        </div>
        <div class="form-group mb-3">
          <label>Mensaje</label>
          <textarea id="swal-message" class="form-control" rows="6">${this.wmwb || ''}</textarea>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<i class="mdi mdi-whatsapp"></i> Enviar',
      confirmButtonColor: '#25D366',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          number: (document.getElementById('swal-number') as HTMLInputElement).value,
          message: (document.getElementById('swal-message') as HTMLTextAreaElement).value
        }
      },
      // Opcional: Validación básica
      didOpen: () => {
        Swal.getConfirmButton()?.addEventListener('click', () => {
          const number = (document.getElementById('swal-number') as HTMLInputElement).value;
          if (!number) {
            Swal.showValidationMessage('El número es requerido');
          }
        });
      }
    });

    if (formValues) {
      // Actualizamos las variables solo si el usuario confirmó
      this.wtwb = formValues.number;
      this.wmwb = formValues.message;
      
      this.sendWW();
    }

    // 3. Remover el atributo inert después
    document.getElementById('comprasWeb')?.removeAttribute('inert');
  
  }

   /** ================================================================
   *   ENVAIR MENSAJE PAGOS WEB
  ==================================================================== */
  sendWW(){
    

    this.whatsappService.sendMessage(this.user.uid!, {message: this.wmwb, number: this.wtwb.trim()}, this.user.wp!)
          .subscribe( ({ok, msg}) => {
                this.sendM = false;
  
                const Toast = Swal.mixin({
                  toast: true,
                  position: "top-end",
                  showConfirmButton: false,
                  timer: 2000,
                  timerProgressBar: true,
                  didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                  }
                });
  
                Toast.fire({
                  icon: "success",
                  title: msg
                });
                
              }, (err)=> {
                console.log(err);
                Swal.fire('Error', err.error.msg, 'error');            
                this.sendM = false;
              }) 
    

  }

  /** ================================================================
   *   CONFIRMAR PAGOS WEB
  ==================================================================== */
  confirmarPagoWeb(pago: any){

    Swal.fire({
      title: "Estas seguro?",
      text: "De confirmar este pago",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, confirmar!",
      cancelButtonText: 'cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        
        pago.estado = 'Confirmado';

        for (const ticket of pago.tickets) {          
          this.confirmarPago(ticket.tid, ticket.pagos[0]._id, 'Confirmado');
        }
      }
    });

  }

  /** ================================================================
   *   VER EGRESOS
  ==================================================================== */
  public loadingEgresos: boolean = false;
  public egresos: Movimiento[] = [];
  public totalMovimiento: number = 0;
  loadEgresos(){    

    let query = {
      desde:0,
      hasta: 5000,
      rifa: this.rifa.rifid!,
      type: 'Salida'
    }

    this.movimientosService.loadMovimientos(query)
        .subscribe( ({movimientos, total, totalMovimiento}) => {

          this.loadingEgresos = false;
          this.egresos = movimientos;
          this.totalMovimiento = totalMovimiento;

        }, (err) => {
          this.loadingEgresos = false;
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ================================================================
   *   ADD EGRESOS
  ==================================================================== */
  @ViewChild ('descE') descE!: ElementRef;
  @ViewChild ('montoE') montoE!: ElementRef;
  addEgresos(descripcion: string, monto: any){

    monto = Number(monto);

    if (!monto || monto <= 0) {
      Swal.fire('Atención', 'Debes de agregar un monto valido', 'warning');
      return;      
    }

    let formData = {
      monto,
      descripcion,
      rifa: this.rifa.rifid,
      type: 'Salida'
    }

    this.movimientosService.createMovimiento(formData)
        .subscribe( ({movimiento}) => {

          movimiento.moid = movimiento._id;

          this.egresos.push(movimiento);
          this.totalMovimiento += movimiento.monto;

          this.descE.nativeElement.value = '';
          this.montoE.nativeElement.value = '';
          Swal.fire('Estupendo', 'Se ha agregado el egreso exitosamente!', 'success');

        })

  }


  /** ================================================================
   *   DELETE EGRESOS
  ==================================================================== */
  deleteEgreso(moid: string){

    Swal.fire({
      title: "Estas seguro?",
      text: "De eliminar este egreso!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, eliminar!",
      cancelButtonText: 'cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        this.movimientosService.deleteMovimiento(moid)
            .subscribe( ({msg}) => {

              Swal.fire('Estupendo', msg, 'success');
              this.loadEgresos();

            }, (err) => {
              console.log(err);
              Swal.fire('Error', err.error.msg, 'error');              
            })

      }
    });

  }

  /** ================================================================
   *   FILTRAR ABONOS PENDIENTES POR VENDEDOR
  ==================================================================== */
  public vendedorSelect: string = '';
  async filterVendedorPendientes(vendedor: string){

    if(vendedor === 'Todos'){
      this.loadIngresos();
      return;
    }
    
    await this.loadIngresos();
    
    setTimeout(() => {


      let totalPendientesT = 0;
      let pendientesT = this.pendientes.filter( (tick) => {

        // Verifica que tick.vendedor y tick.vendedor._id existan
        if (!tick.vendedor || !tick.vendedor._id) {
          return false;
        }

        // Compara los IDs
        return vendedor === tick.vendedor._id;

      });

      for (const pendienteT of pendientesT) {
        for (const paid of pendienteT.pagos) {

          if (paid.estado === 'Pendiente') {
            totalPendientesT += paid.monto;
          }
          
        }
      }

      this.pendientes = pendientesT;
      this.totalPendiente = totalPendientesT;
      
    }, 500);

  }

  /** ================================================================
   *  CONFIRMAR PAGOS
  ==================================================================== */
  confirmarPago(ticketE: string, pago: string, estado: string){

    this.ticketsService.loadTicketID( ticketE )
        .subscribe( ({ticket}) => {

          ticket.pagos.map( (paid) => {

            if (paid._id === pago) {
              paid.estado = estado
            }

          })

          let totalPago = 0;
          for (const pago of ticket.pagos) {
            if (pago.estado === estado) {
              totalPago += pago.monto;
            }
          }

          if (totalPago >= ticket.monto) {
            ticket.estado = 'Pagado'
          }

          this.ticketsService.updateTicket( {pagos: ticket.pagos, estado: ticket.estado}, ticketE )
              .subscribe( ({ticket} ) => {

                this.pendientes.map( (tick) => {
                  if (tick.tid === ticketE) {
                    
                    tick.pagos.map( (paid) => {
                       
                      if (paid._id === pago) {
                        paid.estado = estado;
                        this.totalPendiente -= paid.monto;
                      }
                    })

                  }
                })

              }, (err) => {
              console.log(err);
              Swal.fire('Error', err.error.msg, 'error');          
            })

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ================================================================
   *   GENERAR QR WHATSAPP
  ==================================================================== */
  public qr!: string;
  public generando: boolean = false;
  generarQR(){

    if (!this.user.whatsapp) {
      Swal.fire('Atención', 'No tienes habilitada esta funcion', 'warning');
      return;
    }

    this.generando = true;
    
    this.whatsappService.generateQR(this.user.uid!, this.user.wp!)
    .subscribe( ({qr}) => {
          this.qr = qr;
          this.generando = false;
        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
          this.generando = false;
        })

  }

  /** ================================================================
   *   LOGOUT WHATSAPP
  ==================================================================== */
  public logoutW: boolean = false;
  logoutWhatsapp(){

    this.logoutW = true;
    Swal.fire({
      title: "Estas seguro?",
      text: "de cerrar la session de whatsapp?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, cerrar!",
      cancelButtonText: "cancelar"
    }).then((result) => {
      
      this.whatsappService.logoutWhatsapp(this.user.wp!)
          .subscribe( ({msg, ok}) => {
            this.logoutW = false;
            Swal.fire('Aternción', msg, 'success');

          }, (err) => {
            this.logoutW = false;
            console.log(err);
            Swal.fire('Error', err.error.msg, 'error')
          })

    });

  }

  /** ================================================================
   *   ENVIAR IMG WHATSAPP
  ==================================================================== */
  public sendImage: boolean = false;
  @ViewChild('contentToCapture') contentToCapture!: ElementRef;
  @ViewChild('captionI') captionI!: ElementRef;
  sendImg(caption: string = ''){

    this.sendImage = true;

    if (!this.user.whatsapp) {
      Swal.fire('Atención', 'No tienes habilitada esta funcion', 'warning');
      return;
    }    

    html2canvas(this.contentToCapture.nativeElement, { useCORS: true }).then((canvas) => {
      // Convertir el canvas a data URL (Base64)
      const imageBase64 = canvas.toDataURL('image/png');

      // Si necesitas enviar la imagen como Blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Crear un objeto FormData para enviar la imagen

          if (this.user.wati) {

            this.watiService.sendImage(this.user.watitoken!, this.user.watilink!, this.ticketSelected.telefono, blob, caption)
                .subscribe( (resp) => {

                  this.sendImage = false;

                  const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                      toast.onmouseenter = Swal.stopTimer;
                      toast.onmouseleave = Swal.resumeTimer;
                    }
                  });
      
                  Toast.fire({
                    icon: "success",
                    title: 'Se ha enviado el ticket digital exitosamente!'
                  });

                  this.captionI.nativeElement.value = '';

                }, (err) => {
                  console.log(err);
                  Swal.fire('Error', err.error, 'error');
                  
                })
            
          }else{

            this.whatsappService.sendImage(this.user.uid!, this.ticketSelected.telefono, blob, caption, this.user.wp!)
                .subscribe( ({ok, msg}) => {
                  this.sendImage = false;
  
                  const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                      toast.onmouseenter = Swal.stopTimer;
                      toast.onmouseleave = Swal.resumeTimer;
                    }
                  });
      
                  Toast.fire({
                    icon: "success",
                    title: msg
                  });
  
                  this.captionI.nativeElement.value = '';
                  
                }, (err) => {
                  console.log(err);
                  Swal.fire('Error', err.error.msg, 'error');
                  this.sendImage = false;
                  
                })
          }


          // Enviar la imagen a la API
          
        }
      }, 'image/png');
    });


  }

  /** ================================================================
   *   ACTUALIZAR IMAGEN
  ==================================================================== */
  @ViewChild('fileImgMasive') fileImgMasive!: ElementRef;
  public imgTempPMasive: any = null;
  public subirImagenMasive!: any;
  public imgMasive: string = 'no-image';

  cambiarImageMasive(file: any): any{    
    
    this.subirImagenMasive = file.target.files[0];
    
    if (!this.subirImagenMasive) { return this.imgTempPMasive = null }    
    
    const reader = new FileReader();
    const url64 = reader.readAsDataURL(file.target.files[0]);
        
    reader.onloadend = () => {
      this.imgTempPMasive = reader.result;      
    }

  }

  /** ================================================================
   *   ADD DECORATOR WHATSAPP MASIVE
  ==================================================================== */
  addDeco(deco: string){

    this.message = this.message+' '+deco;
    this.whatMasive.nativeElement.focus();

  }

  /** ================================================================
   *   WHATSAPP MASIVE 
  ==================================================================== */
  public message: string = '';
  public sendMasive: boolean = false;
  @ViewChild('whatMasive') whatMasive!: ElementRef;
  @ViewChild('addImgMasive') addImgMasive!: ElementRef;
  sendMasiveW(imgS: boolean = false){

    if (!this.user.whatsapp) {
      Swal.fire('Atención', 'No tienes habilitada esta funcion', 'warning');
      return;
    }

    if (this.message.length < 5) {
      Swal.fire('Atención', 'Debes de agregar un mensaje con mas de 5 caracteres', 'warning');
      return;
    }

    let messages: any[] = [];
    this.sendMasive = true;

    const groupedTickets: { [telefono: string]: any[] } = {};

    // Agrupar los tickets por número de teléfono
    for (let i = 0; i < this.tickets.length; i++) {
      const ticket = this.tickets[i];
    
      if (ticket.estado !== 'Disponible') {
        const number = ticket.telefono.trim().replace(/\s/g, '').replace(/[^\d]/g, '');
        if (!groupedTickets[number]) {
          groupedTickets[number] = [];
        }
        groupedTickets[number].push(ticket);
      }
    }

    // Recorrer los grupos por número
    for (const number in groupedTickets) {
      const ticketsPersona = groupedTickets[number];
      const primerTicket = ticketsPersona[0]; // Usamos el primer ticket para obtener nombre, etc.
    
      let mensaje = this.message;
    
      if (mensaje.includes('@name')) {
        mensaje = mensaje.replace(/@name/g, '*' + primerTicket.nombre + '*');
      }
    
      if (mensaje.includes('@premio')) {
        mensaje = mensaje.replace(/@premio/g, '*' + this.rifa.name + '*');
      }
    
      if (mensaje.includes('@empresa')) {
        mensaje = mensaje.replace(/@empresa/g, '*' + (this.rifa.admin.empresa || '') + '*');
      }
    
      if (mensaje.includes('@number')) {
        // Concatenamos todos los números de los tickets
        const numeros = ticketsPersona.map(t => '*#' + t.numero + '*').join(', ');
        mensaje = mensaje.replace(/@number/g, numeros);
      }
    
      messages.push({
        number: number + '@s.whatsapp.net',
        message: mensaje
      });
    }
    
    if (imgS) {
      this.whatsappService.sendMessageMasiveImg(this.user.uid!, {contacts: messages}, this.user.wp!, this.subirImagenMasive)
          .subscribe( ({msg}) => {

            const Toast = Swal.mixin({
              toast: true,
              position: "top-end",
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
              }
            });
  
            Toast.fire({
              icon: "success",
              title: msg
            });
            
            this.message = '';
            this.sendMasive = false;

            this.imgTempPMasive = ''; 
            this.fileImgMasive.nativeElement.value = '';
            this.addImgMasive.nativeElement.checked = false;

          }, (err) => {
            console.log(err);
            Swal.fire('Error', err.error.msg, 'error');
            this.sendMasive = false;          
          })
      
    }else{

      this.whatsappService.sendMessageMasive(this.user.uid!, {contacts: messages}, this.user.wp!)
          .subscribe( ({msg}) => {
  
            const Toast = Swal.mixin({
              toast: true,
              position: "top-end",
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
              }
            });
  
            Toast.fire({
              icon: "success",
              title: msg
            });
            
            this.message = '';
            this.sendMasive = false;
  
          }, (err) => {
            console.log(err);
            Swal.fire('Error', err.error.msg, 'error');
            this.sendMasive = false;          
          })
    }
    


  }

  /** ================================================================
   *   SELECCIONAR PLANTILLA
  ==================================================================== */
  public templateSelected: any;
  seleccionarPlantilla(plantillaID: string){

    if (plantillaID === 'none') {
      delete this.templateSelected;
      return;
    }

    this.templates.map( temp => {
      if (temp.id === plantillaID) {
        this.templateSelected = temp;
      }
    })

  }

  /** ================================================================
   *   SEND MASIVE WITH WATI
  ==================================================================== */
  sendMassiveWATI() {

    if (!this.user.whatsapp) {
      Swal.fire('Atención', 'No tienes habilitada esta función', 'warning');
      return;
    }

    if (!this.templateSelected || !this.templateSelected.customParams?.length) {
      Swal.fire('Atención', 'Debes seleccionar una plantilla con parámetros', 'warning');
      return;
    }

    const receivers: any[] = [];
    const groupedTickets: { [telefono: string]: any[] } = {};

    // Agrupar los tickets por número de teléfono
    for (const ticket of this.tickets) {
      if (ticket.estado !== 'Disponible') {
        const number = ticket.telefono.trim().replace(/\s/g, '').replace(/[^\d]/g, '');
        if (!groupedTickets[number]) {
          groupedTickets[number] = [];
        }
        groupedTickets[number].push(ticket);
      }
    }

    // Construir estructura receivers
    for (const number in groupedTickets) {
      const ticketsPersona = groupedTickets[number];
      const primerTicket = ticketsPersona[0];

      // Construir parámetros personalizados (basado en la plantilla seleccionada)
      const customParams = this.templateSelected.customParams.map((param: any) => {
        let value = '';

        switch (param.paramName) {
          case 'tickets':
            value = ticketsPersona.map(t => `#${t.numero}`).join(', ');
            break;
          case 'nombre':
          case 'name':
            value = primerTicket.nombre || '';
            break;
          case 'cedula':
            value = primerTicket.cedula || '';
            break;
          case 'empresa':
            value = this.rifa.admin?.empresa || '';
            break;
          case 'premio':
            value = this.rifa?.name || '';
            break;
          default:
            value = '-'; // Por si el campo no existe
        }

        return {
          name: param.paramName,
          value
        };
      });

      receivers.push({
        whatsappNumber: number,
        customParams
      });
    }

    // Construir cuerpo final para WATI
    const body = {
      template_name: this.templateSelected.elementName,
      broadcast_name: this.templateSelected.elementName,
      receivers
    };

    this.watiService.sendTemplateMasive(this.user.watitoken!, this.user.watilink!, body)
        .subscribe( (resp: any) => {

          if (!resp.result) {
            Swal.fire('Error', resp.errors.error, 'error');
            return;       
          }

          Swal.fire('Estupendo', 'se estan enviando todos los mensajes', 'success');

        }, (err) =>{
          console.log(err);
          Swal.fire('Error', err.error, 'error');
          
        })

  }


  /** ================================================================
   *   EXPORTAR EXCEL
  ==================================================================== */
  exportar(){

    let tickets: any[] = [];

    for (const ticket of this.tickets) {

      
      let tick: any = {
        Numero: ticket.numero,
        Monto: ticket.monto,
        Nombres: ticket.nombre || '',
        Cedula: ticket.cedula || '',
        Telefono: ticket.telefono || '',
        Direccion: ticket.direccion || '',
        Estado: ticket.estado
      }

      if (ticket.ruta) {
        tick.Ruta = ticket.ruta.name;
      }

      if (ticket.vendedor) {
        tick.Vendedor = ticket.vendedor.name;
      }

      // CARGAR ABONOS DE CADA TICKET
      tick.Abonado = 0;
      if (ticket.pagos.length > 0) {

        for (let i = 0; i < ticket.pagos.length; i++) {
          const pago = ticket.pagos[i]; 
          tick.Abonado += pago.monto;         
          tick[`Pago${i+1}`] = `${pago.monto}`;
          tick[`Fecha${i+1}`] = `${new Date(pago.fecha!).getDate()}/${new Date(pago.fecha!).getMonth()+1}/${new Date(pago.fecha!).getFullYear()}`;
        }
        
      }     
      
      tickets.push(tick)

    }

    /* generate a worksheet */
    var ws = XLSX.utils.json_to_sheet(tickets);

    // ✅ Aplica tipo texto a todas las celdas de la columna A (excepto encabezado)
    Object.keys(ws).forEach(cell => {
      if (cell.startsWith('A') && cell !== 'A1') {
        ws[cell].t = 's';  // tipo: string
        ws[cell].z = '@';  // formato: texto
      }
    });
      
    /* add to workbook */
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");

    /* title */
    let title = `${this.rifa.name}.xls`;

    /* write workbook and force a download */
    XLSX.writeFile(wb, title);


  }

  exportarAgrupado() {
  let agrupado: { [telefono: string]: any } = {};
  let maxPagos = 0;

  for (const ticket of this.tickets) {
    const telefono = ticket.telefono?.trim()?.replace(/\s/g, '') || 'SinTeléfono';

    if (!agrupado[telefono]) {
      agrupado[telefono] = {
        Nombres: String(ticket.nombre || ''),
        Cedula: String(ticket.cedula || ''),
        Telefono: String(ticket.telefono || ''),
        Direccion: String(ticket.direccion || ''),
        Números: [],
        Estados: new Set(),
        MontoTotal: 0,
        Abonado: 0,
        Pagos: [],
        Ruta: String(ticket.ruta?.name || ''),
        Vendedor: String(ticket.vendedor?.name || '')
      };
    }

    agrupado[telefono].Números.push(`#${ticket.numero}`);
    agrupado[telefono].Estados.add(ticket.estado);
    agrupado[telefono].MontoTotal += Number(ticket.monto || 0);

    if (ticket.pagos?.length) {
      for (const pago of ticket.pagos) {
        const monto = Number(pago.monto || 0);
        const fecha = pago.fecha ? new Date(pago.fecha).toLocaleDateString() : '';
        agrupado[telefono].Abonado += monto;
        agrupado[telefono].Pagos.push({ monto: String(monto), fecha: String(fecha) });
      }
    }

    // Actualizar el máximo número de pagos
    maxPagos = Math.max(maxPagos, agrupado[telefono].Pagos.length);
  }

  const resultado: any[] = [];

  Object.values(agrupado).forEach((cliente: any) => {
    const row: any = {
      Nombres: cliente.Nombres,
      Cedula: cliente.Cedula,
      Telefono: cliente.Telefono,
      Direccion: cliente.Direccion,
      CantidadTickets: cliente.Números.length, 
      Números: cliente.Números.join(', '),
      Estado: Array.from(cliente.Estados).join(', '),
      MontoTotal: Number(cliente.MontoTotal || 0),
      Abonado: Number(cliente.Abonado || 0),
      Ruta: cliente.Ruta,
      Vendedor: cliente.Vendedor
    };

    // Rellenar todos los pagos hasta maxPagos
    for (let i = 0; i < maxPagos; i++) {
      const pago = cliente.Pagos[i];
      row[`Pago${i + 1}`] = pago ? pago.monto : '';
      row[`Fecha${i + 1}`] = pago ? pago.fecha : '';
    }

    resultado.push(row);
  });

  const ws = XLSX.utils.json_to_sheet(resultado);

  Object.keys(ws).forEach(cell => {
    if ((cell.startsWith('C') || cell.startsWith('B')) && cell !== 'C1' && cell !== 'B1') {
      ws[cell].t = 's';
      ws[cell].z = '@';
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

  const title = `${this.rifa.name}_agrupado.xls`;
  XLSX.writeFile(wb, title);
}


//   exportarAgrupado() {
//   let agrupado: { [telefono: string]: any } = {};

//   for (const ticket of this.tickets) {
//     const telefono = ticket.telefono?.trim()?.replace(/\s/g, '') || 'SinTeléfono';

//     if (!agrupado[telefono]) {
//       agrupado[telefono] = {
//         Nombres: String(ticket.nombre || ''),
//         Cedula: String(ticket.cedula || ''),
//         Telefono: String(ticket.telefono || ''),
//         Direccion: String(ticket.direccion || ''),
//         Números: [],
//         Estados: new Set(),
//         MontoTotal: 0,
//         Abonado: 0,
//         Pagos: [],
//         Ruta: String(ticket.ruta?.name || ''),
//         Vendedor: String(ticket.vendedor?.name || '')
//       };
//     }

//     agrupado[telefono].Números.push(`#${ticket.numero}`);
//     agrupado[telefono].Estados.add(ticket.estado);
//     agrupado[telefono].MontoTotal += Number(ticket.monto || 0);

//     if (ticket.pagos?.length) {
//       for (const pago of ticket.pagos) {
//         const monto = Number(pago.monto || 0);
//         const fecha = pago.fecha ? new Date(pago.fecha).toLocaleDateString() : '';
//         agrupado[telefono].Abonado += monto;
//         agrupado[telefono].Pagos.push({ monto: String(monto), fecha: String(fecha) });
//       }
//     }
//   }

//   const resultado: any[] = [];

//   Object.values(agrupado).forEach((cliente: any) => {
//     const row: any = {
//       Nombres: cliente.Nombres,
//       Cedula: cliente.Cedula,
//       Telefono: cliente.Telefono,
//       Direccion: cliente.Direccion,
//       Números: cliente.Números.join(', '),
//       Estado: Array.from(cliente.Estados).join(', '),
//       MontoTotal: Number(cliente.MontoTotal || 0),
//       Abonado: Number(cliente.Abonado || 0),
//       Ruta: cliente.Ruta,
//       Vendedor: cliente.Vendedor
//     };

//     cliente.Pagos.forEach((pago: any, index: number) => {
//       row[`Pago${index + 1}`] = pago.monto;
//       row[`Fecha${index + 1}`] = pago.fecha;
//     });

//     // Sanitizar todos los campos para evitar errores de tipos
//     for (const key in row) {
//       const value = row[key];
//       if (
//         typeof value !== 'string' &&
//         typeof value !== 'number' &&
//         typeof value !== 'boolean'
//       ) {
//         row[key] = String(value ?? '');
//       }

//       // Eliminar NaN o undefined
//       if (value === undefined || value === null || Number.isNaN(value)) {
//         row[key] = '';
//       }
//     }

//     resultado.push(row);
//   });

//   const ws = XLSX.utils.json_to_sheet(resultado);

//   Object.keys(ws).forEach(cell => {
//     if ((cell.startsWith('C') || cell.startsWith('B')) && cell !== 'C1' && cell !== 'B1') {
//       ws[cell].t = 's';
//       ws[cell].z = '@';
//     }
//   });

//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

//   const title = `${this.rifa.name}_agrupado.xls`;
//   XLSX.writeFile(wb, title);
// }


// exportarAgrupado2() {
//   let agrupado: { [telefono: string]: any } = {};

//   for (const ticket of this.tickets) {
//     const telefono = ticket.telefono?.trim()?.replace(/\s/g, '') || 'SinTeléfono';

//     if (!agrupado[telefono]) {
//       agrupado[telefono] = {
//         Nombres: ticket.nombre || '',
//         Cedula: ticket.cedula || '',
//         Telefono: ticket.telefono || '',
//         Direccion: ticket.direccion || '',
//         Números: [],
//         Estados: new Set(),
//         MontoTotal: 0,
//         Abonado: 0,
//         Pagos: [],

//         Ruta: ticket.ruta?.name || '',
//         Vendedor: ticket.vendedor?.name || ''
//       };
//     }

//     // Agregar número y estado
//     agrupado[telefono].Números.push(`#${ticket.numero}`);
//     agrupado[telefono].Estados.add(ticket.estado);
//     agrupado[telefono].MontoTotal += ticket.monto;

//     // Agregar pagos
//     if (ticket.pagos?.length) {
//       for (const pago of ticket.pagos) {
//         agrupado[telefono].Abonado += pago.monto;
//         agrupado[telefono].Pagos.push({
//           monto: pago.monto,
//           fecha: new Date(pago.fecha!).toLocaleDateString()
//         });
//       }
//     }
//   }

//   // Preparar array final para exportar
//   const resultado: any[] = [];

//   Object.values(agrupado).forEach((cliente: any) => {
//     const row: any = {
//       Nombres: cliente.Nombres,
//       Cedula: cliente.Cedula,
//       Telefono: cliente.Telefono,
//       Direccion: cliente.Direccion,
//       Números: cliente.Números.join(', '),
//       Estado: Array.from(cliente.Estados).join(', '),
//       MontoTotal: cliente.MontoTotal,
//       Abonado: cliente.Abonado,
//       Ruta: cliente.Ruta,
//       Vendedor: cliente.Vendedor
//     };

//     // Agregar pagos como columnas Pago1, Fecha1, Pago2...
//     cliente.Pagos.forEach((pago: any, index: number) => {
//       row[`Pago${index + 1}`] = pago.monto;
//       row[`Fecha${index + 1}`] = pago.fecha;
//     });

//     resultado.push(row);
//   });

//   // Exportar con xlsx
//   const ws = XLSX.utils.json_to_sheet(resultado);

//   // Marcar columna A como texto si es necesario (por ejemplo, Cédula o Teléfono)
//   Object.keys(ws).forEach(cell => {
//     if ((cell.startsWith('C') || cell.startsWith('B')) && cell !== 'C1' && cell !== 'B1') {
//       ws[cell].t = 's';
//       ws[cell].z = '@';
//     }
//   });

//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

//   const title = `${this.rifa.name}_agrupado.xls`;
//   XLSX.writeFile(wb, title);
// }


  /** ================================================================
   *   AGREGAR MONTO
  ==================================================================== */
  @ViewChild ('newMontoI') newMontoI!: ElementRef;
  @ViewChild ('newMontoQty') newMontoQty!: ElementRef;
  addMonto(monto: any, qty: any){
    monto = Number(monto);
    qty = Number(qty);

    if (monto < 0 || !monto) {
      Swal.fire('Atención', 'El monto debe ser mayor a cero', 'warning');
      return;
    }

    this.rifa.montos.push({
      monto,
      qty
    })

    this.rifasService.updateRifa({montos: this.rifa.montos}, this.rifa.rifid!)
        .subscribe( ({}) => {

          Swal.fire('Estupendo', 'Se ha agregado el nuevo monto exitosamente', 'success');
          this.newMontoI.nativeElement.value = '';
          this.newMontoQty.nativeElement.value = '';

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ================================================================
   *   ELIMINAR MONTO
  ==================================================================== */
  delMonto(i: any){

    this.rifa.montos.splice(i, 1);

    this.rifasService.updateRifa({montos: this.rifa.montos}, this.rifa.rifid!)
        .subscribe( ({}) => {

          Swal.fire('Estupendo', 'Se ha eliminado el monto exitosamente', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })


  }

  /** ================================================================
   *   AGREGAR BOTONES
  ==================================================================== */
  public newBtnFormSubmitted: boolean = false;
  public newBtnForm = this.fb.group({
    name: ['', [Validators.required]],
    monto: [0, [Validators.required, Validators.min(1)]],
    qty: [0, [Validators.required, Validators.min(1)]],
    color: ['#000', [Validators.required]],
    fondo: ['#ffffff', [Validators.required]],
  })

  addBtn(){

    this.newBtnFormSubmitted = true;

    if (this.newBtnForm.invalid) {
      return;
    }

    this.rifa.botones.push({
      name: (this.newBtnForm.value.name)? this.newBtnForm.value.name: '',
      monto: (this.newBtnForm.value.monto)? this.newBtnForm.value.monto : 0,
      qty: (this.newBtnForm.value.qty)? this.newBtnForm.value.qty : 0,
      color: (this.newBtnForm.value.color)? this.newBtnForm.value.color: '',
      fondo: (this.newBtnForm.value.fondo)? this.newBtnForm.value.fondo: ''
    })

    this.rifasService.updateRifa({botones: this.rifa.botones}, this.rifa.rifid!)
        .subscribe( ({rifa}) => {

          this.newBtnFormSubmitted = false;
          this.newBtnForm.reset({
            qty: 0,
            monto: 0,
            color: '#000000',
            fondo: '#ffffff'
          })
          Swal.fire('Estupendo', 'Se ha agregado un boton nuevo', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })


  }

  validateBtn(campo: string):boolean{

    if (this.newBtnFormSubmitted && this.newBtnForm.get(campo)?.invalid ) {
      return true;
    } else {
      return false;
    }

  }


  /** ================================================================
   *   ELIMINAR BOTON
  ==================================================================== */
  delBoton(i: any){


    this.rifa.botones.splice(i, 1);

    this.rifasService.updateRifa({botones: this.rifa.botones}, this.rifa.rifid!)
        .subscribe( ({}) => {

          Swal.fire('Estupendo', 'Se ha eliminado el boton exitosamente', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ================================================================
   *   CONVERTIR EN BASE64 EL LOGO
  ==================================================================== */
  convertImageToBase64(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Importante para evitar problemas de CORS
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));  // Convierte la imagen a Base64
      };

      img.onerror = (error) => reject(error);
    });
  }

  /** ================================================================
   *   WRAP TEXT
  ==================================================================== */
  wrapText(text: string, lineLength: number): string[] {
    const regex = new RegExp(`.{1,${lineLength}}`, 'g');
    return text.match(regex) || [];
  }

  /** ================================================================
   *  PRINT INVOICE
  ==================================================================== */
  @ViewChild('PrintTemplate') PrintTemplateTpl!: TemplateRef<any>;
  printTemplate() {
    this.printerService.printDiv('PrintTemplateTpl');
  }

  /** ================================================================
   *   printTicket
  ==================================================================== */
  public app = environment.app;
  public imprimiendo: boolean = false;
  async printTicket() {
    
    this.imprimiendo = true;

    const content:any = document.getElementById('captureImprimir')?.innerText;  
    

    if (localStorage.getItem('typePrinter') === 'ESC') {
      this.printTicketImpresora(content);
    }else{
      
      // const lines = this.wrapText(content, 24); // asumiendo 32 caracteres por línea
      // let y = 10;
      // const commands = lines.map(line => {
      //   const cmd = `TEXT 10,${y},"3",0,1,1,"${line}"`;
      //   y += 30; // espacio entre líneas
      //   return cmd;
      // });

      // const labelHeightDots = lines.length * 30;
      // const labelHeightMM = Math.ceil(labelHeightDots / 8);

      // const fullCommand = `SIZE 58 mm, ${labelHeightMM} mm\nOFFSET 0 \nDENSITY 10 \nSPEED 4 \nDIRECTION 1 \nREFERENCE 0,0\nCLS\n${commands.join('\n')}\nPRINT 1,1\n`;
      
      // this.printTicketImpresora(fullCommand);  
      const comando = await this.generarComandoTSPL();
      this.printTicketImpresora(comando);  
            
    }

  }

  async printTicketImpresora(content: any) {
    if (content) {
      this.bluetoothService.printText(content)
        .then(response => {
          this.imprimiendo = false;
        })
        .catch(error => {
          this.imprimiendo = false;
          console.error(error)
        });
    }
  }

  /** ================================================================
   *   GENERAR TICKET TSPL
  ==================================================================== */
  generarComandoTSPL() {
    let y = 10; // posición vertical inicial
    const salto = 30; // salto vertical por línea (ajustable)
    const comandos: string[] = [];

    // Función auxiliar para agregar línea y sumar Y
    const addLine = (text: string, fontSize = 1, center = false) => {
      const x = center ? Math.max(0, (384 - (text.length * 12 * fontSize)) / 2) : 10;
      comandos.push(`TEXT ${x},${y},"3",0,${fontSize},${fontSize},"${text}"`);
      y += salto * fontSize;
    };

    const wrapText = (text: string, maxChars: number): string[] => {
      const lines = [];
      while (text.length > maxChars) {
        lines.push(text.slice(0, maxChars));
        text = text.slice(maxChars);
      }
      if (text) lines.push(text);
      return lines;
    };

    // --- Comenzamos línea por línea según tu estructura ---
    wrapText(this.rifa.admin.empresa, 23).forEach(line => addLine(line, 1, true));      
    addLine(`#${this.ticketSelected.numero}`, 3, true); // triple tamaño y centrado
    addLine(this.ticketSelected.estado === "Pagado" ? "Pagado" : "Apartado", 1, true);
    addLine("-----------------------");

    wrapText(this.rifa.name, 23).forEach(line => addLine(line));
    addLine("-----------------------");

    addLine(`Precio: ${this.ticketSelected.monto}$`);
    addLine("--------fecha---------");
    
    let fecha = new Date(this.rifa.fecha)

    addLine(`${fecha.getDate()}-${fecha.getMonth()+1}-${fecha.getFullYear()} ${fecha.getHours()}:${fecha.getMinutes()}`);
    addLine("-------loteria--------");

    wrapText(`${this.rifa.loteria}`, 23).forEach(line => addLine(line));
    addLine("-------cliente--------");

    wrapText(this.ticketSelected.nombre, 23).forEach(line => addLine(line));
    wrapText(this.ticketSelected.telefono, 23).forEach(line => addLine(line));
    addLine("--------pagos---------");
    
    this.ticketSelected.pagos.forEach((pago: any) => {

      let fechap = new Date(pago.fecha);

      wrapText(`-- ${pago.monto}$ - ${fechap.getDate()}/${fechap.getMonth()+1}/${fechap.getFullYear()}`, 23).forEach(line => addLine(line));
    });
    addLine("-----------------------");

    let resta = this.ticketSelected.monto;
    for (const pago of this.ticketSelected.pagos) {
      resta -= pago.monto;
    }

    addLine(`resta: ${resta}$`);

    const altoTotal = y + 20;

    const fullCommand = `SIZE 58 mm, ${altoTotal} mm\nOFFSET 0 \nDENSITY 10 \nSPEED 4 \nDIRECTION 1 \nREFERENCE 0,0\nCLS\n${comandos.join('\n')}\nPRINT 1,1`;

    return fullCommand;
  }

  /** ================================================================
   *   DESCARGAR PLANTILLA DE EXCEL
  ==================================================================== */
  plantilla(){

    let tickets = [{
        numero: '001',
        monto: 20,
        estado: 'Apartado',
        cedula: '11111111',
        direccion: 'direccion 1',
        nombre: 'pepito perez',
        telefono: '584247111111',
        ruta: 'nombre de la ruta',
      },
      {
        numero: '221',
        monto: 20,
        estado: 'Pagado',
        cedula: '2222222',
        direccion: 'direccion 2',
        nombre: 'fulanito diaz',
        telefono: '584247222222',
        ruta: 'nombre de la ruta',
    
      }
    ];

    /* generate a worksheet */
    var ws = XLSX.utils.json_to_sheet(tickets);

    // Forzar tipo texto a la columna A (números de tickets)
    Object.keys(ws).forEach(cell => {
      if (cell.startsWith('A') && cell !== 'A1') {
        ws[cell].z = '@'; // z = formato, '@' es texto
        ws[cell].t = 's';  // t = tipo, 's' es string
      }
    });

    /* add to workbook */
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "tickets");

    /* title */
    let title = 'plantilla.xls';

    /* write workbook and force a download */
    XLSX.writeFile(wb, title);
  }

  /** ================================================================
   *   IMPORTAR PRODUCTOS CON EXCEL
  ==================================================================== */
  public arrayExceltUpdate:any;
  public excelUpdate!:File;
  public ticketsMasivesJson: any[] = [];
  public sendExcel: boolean = false;

  selectFileExcel(event: any){
    this.excelUpdate= event.target.files[0]; 
  }

  UploadExcel() {

    this.ticketsMasivesJson = [];

    if (!this.excelUpdate) {
      Swal.fire('Atención', 'No has seleccionado ningun archivo de excel', 'info');
      return;
    }

    this.sendExcel = true;

    let fileReader = new FileReader();
      fileReader.onload = (e) => {

          this.arrayExceltUpdate = fileReader.result;
          var data = new Uint8Array(this.arrayExceltUpdate);
          var arr = new Array();

          for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
          
          var bstr = arr.join("");
          var workbook = XLSX.read(bstr, {type:"binary"});
          var first_sheet_name = workbook.SheetNames[0];
          var worksheet = workbook.Sheets[first_sheet_name];
          
          this.ticketsMasivesJson = XLSX.utils.sheet_to_json(worksheet,{raw:true});

          this.ticketsService.saveTicketMasive({tickets: this.ticketsMasivesJson, rifid: this.rifa.rifid})
              .subscribe( ({msg, ticketsNoEncontrados, rutasSinCoincidencia}) => {

                this.query = {
                  desde: 0,
                  hasta: 1000,
                  sort: {numero: 1}
                }
                this.loadTickets();

                Swal.fire('Estupendo', `${msg} ${(ticketsNoEncontrados.length > 0)? `, Tickets no encontrados o no disponibles ${ticketsNoEncontrados.length}`: ''} ${(rutasSinCoincidencia.length > 0)? `, Rutas no encontradas ${rutasSinCoincidencia.length}`: ''} `, 'success');                
                this.sendExcel = false;
                
              }, (err) => {
                this.sendExcel = false;
                console.log(err);
                Swal.fire('Error', err.error.msg, 'error');                
              })
          

      }
      
      fileReader.readAsArrayBuffer(this.excelUpdate);
  };

  /** ================================================================
   *   ENVIAR SMS
  ==================================================================== */
  public sendS: boolean = false;
  sendSMS(message: string){

    message = message.replace(/[\r\n/*]+/g, ' ').trim();

    if (message.length > 160) {
      Swal.fire('Atención', 'para SMS el maximo de caracteres es de 160', 'warning');
      return;
    }

    if (this.ticketSelected.telefono) {
        
        this.sendS = true;

        this.smsService.sendMessageSMS({message: message, number: '+'+this.ticketSelected.telefono.trim()})
          .subscribe( ({ok, msg}) => {

                this.sendS = false;
  
                const Toast = Swal.mixin({
                  toast: true,
                  position: "top-end",
                  showConfirmButton: false,
                  timer: 2000,
                  timerProgressBar: true,
                  didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                  }
                });
  
                Toast.fire({
                  icon: "success",
                  title: msg
                });
                
              }, (err)=> {
                console.log(err);
                Swal.fire('Error', err.error.msg, 'error');            
                this.sendS = false;
              })  

      }
        
  }

  /** ================================================================
   *   ENVIAR SMS
  ==================================================================== */
  public sendSMasive: boolean = false;
  sendSmsMasives(){

    let messages: any[] = [];
    this.sendSMasive = true;
    
    this.message = this.message.replace(/[\r\n]+/g, '').trim();
    if (this.message.length > 160) {
      Swal.fire('Atención', 'para SMS el maximo de caracteres es de 160', 'warning');
      return;
    }
    
    const groupedTickets: { [telefono: string]: any[] } = {};
    
    // Agrupar los tickets por número de teléfono
    for (let i = 0; i < this.tickets.length; i++) {
      const ticket = this.tickets[i];
    
      if (ticket.estado !== 'Disponible') {
        const number = ticket.telefono.trim().replace(/\s/g, '').replace(/[^\d]/g, '');
        if (!groupedTickets[number]) {
          groupedTickets[number] = [];
        }
        groupedTickets[number].push(ticket);
      }
    }

    // Recorrer los grupos por número
    for (const number in groupedTickets) {
      const ticketsPersona = groupedTickets[number];
      const primerTicket = ticketsPersona[0]; // Usamos el primer ticket para obtener nombre, etc.
      
      let mensaje = this.message;
    
      if (mensaje.includes('@name')) {
        mensaje = mensaje.replace(/@name/g, primerTicket.nombre);
      }
    
      if (mensaje.includes('@premio')) {
        mensaje = mensaje.replace(/@premio/g, this.rifa.name);
      }
    
      if (mensaje.includes('@empresa')) {
        mensaje = mensaje.replace(/@empresa/g, (this.rifa.admin.empresa || ''));
      }
    
      if (mensaje.includes('@number')) {
        // Concatenamos todos los números de los tickets
        const numeros = ticketsPersona.map(t => '#' + t.numero).join(', ');
        mensaje = mensaje.replace(/@number/g, numeros);
      }

      if (number.startsWith('58')) {
        // El número es venezolano 
        messages.push({
          number: '+'+number,
          message: mensaje
        });
      }
    
    }

    this.smsService.sendMessageMasiveSMS({messages})
          .subscribe( ({msg, total}) => {
  
            const Toast = Swal.mixin({
              toast: true,
              position: "top-end",
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
              }
            });
  
            Toast.fire({
              icon: "success",
              title: msg
            });
            
            this.message = '';
            this.sendSMasive = false;
  
          }, (err) => {
            console.log(err);
            Swal.fire('Error', err.error.msg, 'error');
            this.sendSMasive = false;          
          })

  }
  

}
