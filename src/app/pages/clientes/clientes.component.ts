import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Client } from 'src/app/models/clientes.model';
import { Ruta } from 'src/app/models/rutas.model';
import { User } from 'src/app/models/users.model';
import { ClientesService } from 'src/app/services/clientes.service';
import { RutasService } from 'src/app/services/rutas.service';
import { UsersService } from 'src/app/services/users.service';
import { WatiService } from 'src/app/services/wati.service';
import { WhatsappService } from 'src/app/services/whatsapp.service';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// EXCEL
import * as XLSX from 'xlsx';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {

  public user!: User;

  constructor(  private clientsService: ClientesService,
                private fb: FormBuilder,
                private rutasService: RutasService,
                private usersService: UsersService,
                private watiService: WatiService,
                private whatsappService: WhatsappService,
  ){
    this.user = usersService.user;
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadRutas();

    if (this.user.wati) {
      this.loadTemplates();
    }
  }

  /** ======================================================================
     * LOAD RUTAS
    ====================================================================== */
    public rutas: Ruta[] = []
    public totalRutas: number = 0;
    loadRutas(){
  
    let query: any = {
      status: true
    };

    if (this.user.role === 'ADMIN') {
      query.admin = this.user.uid;
    }else{
      query.admin = this.user.admin?.uid;
    }

    this.rutasService.loadRutas(query)
        .subscribe( ({rutas, total}) => {  
          
          this.totalRutas = total;
          this.rutas = rutas;
        });
  }

  /** ======================================================================
   * LOAD CLIENTES
  ====================================================================== */
  public clients: Client[] = [];
  public total: number = 0;
  public query: any = {
    desde: 0,
    hasta: 50,
    sort: {
      fecha: -1
    }
  }

  loadClients(){

    this.clientsService.loadClientes(this.query)
      .subscribe( ({clientes, total}) => {
        this.clients = clientes;
        this.total = total;
      }, (err) => {
        console.log(err);
        Swal.fire('Error', err.error.msg, 'error');          
      })

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
    
    this.loadClients();
    
  }
  
  /** ================================================================
   *   CHANGE LIMITE
  ==================================================================== */
  limiteChange( cantidad: any ){  

    this.query.hasta = Number(cantidad);    
    this.loadClients();

  }

  /** ================================================================
   *   CHANGE ORDEN
  ==================================================================== */
  ordenChange( orden: any ){  

    if (orden === 'ultimos') {
      this.query.sort = { fecha: -1 }      
    } else if(orden === 'primeros'){
      this.query.sort = { fecha: 1 }
    } else if(orden === 'nombre'){
      this.query.sort = { nombre: 1 }
    }

    this.loadClients();

  }

  /** ================================================================
   *   ADD CLIENT
  ==================================================================== */
  addClient(cliente: Client){
    this.clients.push(cliente)
  }

  /** ======================================================================
   * SET FORM UPDATE
  ====================================================================== */
  public clienteSelect!: Client;
  setForm(cliente: Client){

    this.clienteSelect = cliente;

    this.updateForm.setValue({
      nombre: cliente.nombre,
      codigo: cliente.codigo,
      telefono: cliente.telefono,
      cedula: cliente.cedula,
      direccion: cliente.direccion,
      correo: cliente.correo,
      ruta: cliente.ruta._id!,
      cid: cliente.cid!
    })

  }

  /** ======================================================================
   * DELETE ALERT
  ====================================================================== */
  deleteAlerts(){

    this.clientsService.updateCliente({alerts: ''}, this.clienteSelect.cid!)
        .subscribe( ({cliente}) => {

          this.clienteSelect.alerts = cliente.alerts;
          Swal.fire('Estupendo', 'la advertencia fue eliminada exitosamente!', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');
          
        })

  }
    
  
  /** ======================================================================
   * UPDATE
  ====================================================================== */
  public formSubmit: boolean = false;
  public updateForm = this.fb.group({
    nombre: ['', [Validators.required]],
    codigo: ['58', [Validators.required]],
    telefono: ['', [Validators.required]],
    cedula: ['', [Validators.required]],
    direccion: ['', [Validators.required]],
    correo: ['', [Validators.required]],
    ruta: ['', [Validators.required]],
    cid: ['', [Validators.required]]
  })

  update(){

    this.formSubmit = true;
    
    if (this.updateForm.invalid) {
      this.formSubmit = false;
      return;
    }
    
    this.clientsService.updateCliente(this.updateForm.value, this.updateForm.value.cid!)
    .subscribe( ({cliente}) => {

        this.clients.map((c) => {
          if (c.cid === cliente.cid) {
            c.nombre = cliente.nombre;
            c.codigo = cliente.codigo;
            c.telefono = cliente.telefono;
            c.cedula = cliente.cedula;
            c.direccion = cliente.direccion;
            c.correo = cliente.correo;
            c.ruta = cliente.ruta         
          }
        })

        this.formSubmit = false;
        Swal.fire({
          toast: true,
          timer: 2000,
          position: 'top-right',
          text: 'Se ha actualizado el cliente existosamente!',
          icon: 'success',
          showConfirmButton: false
        })
      
      }, (err) => {
          this.formSubmit = false;
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');
                    
        })

  }

  /** ================================================================
     *   EXPORTAR EXCEL
    ==================================================================== */
    exportar(){
  
      let clientes: any[] = [];
  
      for (const clie of this.clients) {
          
        let cli: any = {
          nombre: clie.nombre,
          codigo: clie.codigo,
          telefono: clie.telefono,
          cedula: clie.cedula,
          direccion: clie.direccion,
          correo: clie.correo,
          ruta: (clie.ruta)? clie.ruta.name : 'Sin ruta'           
        }
        
        clientes.push(cli);  
      }
  
      /* generate a worksheet */
      var ws = XLSX.utils.json_to_sheet(clientes);
        
      /* add to workbook */
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tickets");
  
      /* title */
      let title = `clientes.xls`;
  
      /* write workbook and force a download */
      XLSX.writeFile(wb, title);
  
  
    }

  /** ======================================================================
   * VALIDATE
  ====================================================================== */
  validate(campo: string): boolean{
    return (this.formSubmit && this.updateForm.get(campo)?.invalid)? true: false; 
  }

  public codigoSeleccionado: any = '';
  public paises: any = [
    {
    "nameES": "Alemania",
    "nameEN": "Germany",
    "iso2": "DE",
    "iso3": "DEU",
    "phoneCode": "49"
    },    
    {
    "nameES": "Argentina",
    "nameEN": "Argentina",
    "iso2": "AR",
    "iso3": "ARG",
    "phoneCode": "54"
    },    
    {
    "nameES": "Aruba",
    "nameEN": "Aruba",
    "iso2": "AW",
    "iso3": "ABW",
    "phoneCode": "297"
    },    
    {
    "nameES": "Bolivia",
    "nameEN": "Bolivia",
    "iso2": "BO",
    "iso3": "BOL",
    "phoneCode": "591"
    },
    
    {
    "nameES": "Brasil",
    "nameEN": "Brazil",
    "iso2": "BR",
    "iso3": "BRA",
    "phoneCode": "55"
    },
    
    {
    "nameES": "Canadá",
    "nameEN": "Canada",
    "iso2": "CA",
    "iso3": "CAN",
    "phoneCode": "1"
    },
    
    {
    "nameES": "Chile",
    "nameEN": "Chile",
    "iso2": "CL",
    "iso3": "CHL",
    "phoneCode": "56"
    },
    
    {
    "nameES": "Colombia",
    "nameEN": "Colombia",
    "iso2": "CO",
    "iso3": "COL",
    "phoneCode": "57"
    },
    
    {
    "nameES": "Costa Rica",
    "nameEN": "Costa Rica",
    "iso2": "CR",
    "iso3": "CRI",
    "phoneCode": "506"
    },
    
    {
    "nameES": "Curazao",
    "nameEN": "Curaçao",
    "iso2": "CW",
    "iso3": "CWU",
    "phoneCode": "5999"
    },
    {
    "nameES": "Dinamarca",
    "nameEN": "Denmark",
    "iso2": "DK",
    "iso3": "DNK",
    "phoneCode": "45"
    },
    
    {
    "nameES": "Ecuador",
    "nameEN": "Ecuador",
    "iso2": "EC",
    "iso3": "ECU",
    "phoneCode": "593"
    },
    
    {
    "nameES": "El Salvador",
    "nameEN": "El Salvador",
    "iso2": "SV",
    "iso3": "SLV",
    "phoneCode": "503"
    },
    
    {
    "nameES": "España",
    "nameEN": "Spain",
    "iso2": "ES",
    "iso3": "ESP",
    "phoneCode": "34"
    },
    {
    "nameES": "Estados Unidos de América",
    "nameEN": "United States of America",
    "iso2": "US",
    "iso3": "USA",
    "phoneCode": "1"
    },
    
    {
    "nameES": "Francia",
    "nameEN": "France",
    "iso2": "FR",
    "iso3": "FRA",
    "phoneCode": "33"
    },
    
    {
    "nameES": "Guatemala",
    "nameEN": "Guatemala",
    "iso2": "GT",
    "iso3": "GTM",
    "phoneCode": "502"
    },
    {
    "nameES": "Guayana Francesa",
    "nameEN": "French Guiana",
    "iso2": "GF",
    "iso3": "GUF",
    "phoneCode": "594"
    },
    
    {
    "nameES": "Guyana",
    "nameEN": "Guyana",
    "iso2": "GY",
    "iso3": "GUY",
    "phoneCode": "592"
    },
    {
    "nameES": "Haití",
    "nameEN": "Haiti",
    "iso2": "HT",
    "iso3": "HTI",
    "phoneCode": "509"
    },
    {
    "nameES": "Honduras",
    "nameEN": "Honduras",
    "iso2": "HN",
    "iso3": "HND",
    "phoneCode": "504"
    },
    
    {
    "nameES": "Israel",
    "nameEN": "Israel",
    "iso2": "IL",
    "iso3": "ISR",
    "phoneCode": "972"
    },
    {
    "nameES": "Italia",
    "nameEN": "Italy",
    "iso2": "IT",
    "iso3": "ITA",
    "phoneCode": "39"
    },
    
    {
    "nameES": "México",
    "nameEN": "Mexico",
    "iso2": "MX",
    "iso3": "MEX",
    "phoneCode": "521"
    },
    
    {
    "nameES": "Nicaragua",
    "nameEN": "Nicaragua",
    "iso2": "NI",
    "iso3": "NIC",
    "phoneCode": "505"
    },
    
    {
    "nameES": "Panamá",
    "nameEN": "Panama",
    "iso2": "PA",
    "iso3": "PAN",
    "phoneCode": "507"
    },
    
    {
    "nameES": "Paraguay",
    "nameEN": "Paraguay",
    "iso2": "PY",
    "iso3": "PRY",
    "phoneCode": "595"
    },
    {
    "nameES": "Perú",
    "nameEN": "Peru",
    "iso2": "PE",
    "iso3": "PER",
    "phoneCode": "51"
    },
    
    {
    "nameES": "Portugal",
    "nameEN": "Portugal",
    "iso2": "PT",
    "iso3": "PRT",
    "phoneCode": "351"
    },
    {
    "nameES": "Puerto Rico",
    "nameEN": "Puerto Rico",
    "iso2": "PR",
    "iso3": "PRI",
    "phoneCode": "1"
    },
    
    {
    "nameES": "Reino Unido",
    "nameEN": "United Kingdom",
    "iso2": "GB",
    "iso3": "GBR",
    "phoneCode": "44"
    },
    
    {
    "nameES": "República Dominicana",
    "nameEN": "Dominican Republic",
    "iso2": "DO",
    "iso3": "DOM",
    "phoneCode": "1 809"
    },
    
    {
    "nameES": "Rusia",
    "nameEN": "Russia",
    "iso2": "RU",
    "iso3": "RUS",
    "phoneCode": "7"
    },
    
    {
    "nameES": "Trinidad y Tobago",
    "nameEN": "Trinidad and Tobago",
    "iso2": "TT",
    "iso3": "TTO",
    "phoneCode": "1 868"
    },
    
    {
    "nameES": "Uruguay",
    "nameEN": "Uruguay",
    "iso2": "UY",
    "iso3": "URY",
    "phoneCode": "598"
    },
    
    {
    "nameES": "Venezuela",
    "nameEN": "Venezuela",
    "iso2": "VE",
    "iso3": "VEN",
    "phoneCode": "58"
    }
  ]

  /** ======================================================================
   * SEARCH
  ====================================================================== */
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

    this.loadClients();

  }

  /** ======================================================================
   * CHANGE RUTA
  ====================================================================== */
  changeRuta(ruta: string){

    if (ruta === 'none') {
      delete this.query.ruta;
    }else{
      this.query.ruta = ruta;
    }

    this.loadClients();
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
  
      // Construir estructura receivers
      for (const cliente of this.clients) {

        const number = cliente.codigo + cliente.telefono.trim().replace(/\s/g, '').replace(/[^\d]/g, '');
  
        // Construir parámetros personalizados (basado en la plantilla seleccionada)
        const customParams = this.templateSelected.customParams.map((param: any) => {
          let value = '';
  
          switch (param.paramName) {
            case 'nombre':
            case 'name':
              value = cliente.nombre || '';
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
        

    // Recorrer los grupos por número
    for (const cliente of this.clients) {
                
      let mensaje = this.message;
      const number = cliente.codigo + cliente.telefono.trim().replace(/\s/g, '').replace(/[^\d]/g, '');
    
      if (mensaje.includes('@name')) {
        mensaje = mensaje.replace(/@name/g, '*' + cliente.nombre + '*');
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
     *   DESCARGAR PLANTILLA DE EXCEL
    ==================================================================== */
    plantilla(){
  
      let clientes = [{
          nombre: 'Pedro Perez',
          codigo: '58',
          telefono: '4240001234',
          cedula: '11111111',
          direccion: 'direccion 1',
          correo: 'pedroperez@gmail.com',
          ruta: 'nombre de la ruta',
        },
        {
          nombre: 'Fulano',
          codigo: '58',
          telefono: '4240001234',
          cedula: '2222222',
          direccion: 'direccion 2',
          correo: 'fulano@gmail.com',
          ruta: 'nombre de la ruta',
      
        }
      ];
  
      /* generate a worksheet */
      var ws = XLSX.utils.json_to_sheet(clientes);
  
      /* add to workbook */
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "clientes");
  
      /* title */
      let title = 'plantilla-clientes.xls';
  
      /* write workbook and force a download */
      XLSX.writeFile(wb, title);
    }

    /** ================================================================
     *   IMPORTAR CLIENTES CON EXCEL
    ==================================================================== */
    public arrayExceltUpdate:any;
    public excelUpdate!:File;
    public clientsMasivesJson: any[] = [];
    public sendExcel: boolean = false;
  
    selectFileExcel(event: any){
      this.excelUpdate= event.target.files[0]; 
    }
  
    UploadExcel() {
  
      this.clientsMasivesJson = [];
  
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
            
            this.clientsMasivesJson = XLSX.utils.sheet_to_json(worksheet,{raw:true});
  
            this.clientsService.saveClientMasive({clients: this.clientsMasivesJson})
                .subscribe( ({msg, noCreados, rutasSinCoincidencia}) => {
  
                  this.query = {
                    desde: 0,
                    hasta: 1000,
                    sort: {numero: 1}
                  }
                  this.loadClients();
  
                  Swal.fire('Estupendo', `${msg} ${(noCreados.length > 0)? `, Clientes no creados: ${noCreados.length}`: ''} ${(rutasSinCoincidencia.length > 0)? `, Rutas no encontradas ${rutasSinCoincidencia.length}`: ''} `, 'success');                
                  this.sendExcel = false;
                  
                }, (err) => {
                  this.sendExcel = false;
                  console.log(err);
                  Swal.fire('Error', err.error.msg, 'error');                
                })
            
  
        }
        
        fileReader.readAsArrayBuffer(this.excelUpdate);
    };

}
