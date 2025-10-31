import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Ruta } from 'src/app/models/rutas.model';
import { User } from 'src/app/models/users.model';
import { ClientesService } from 'src/app/services/clientes.service';
import { RutasService } from 'src/app/services/rutas.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-newclient',
  templateUrl: './newclient.component.html',
  styleUrls: ['./newclient.component.css']
})
export class NewclientComponent implements OnInit {

  public user!: User;
  @Output() actualizar: EventEmitter<any> = new EventEmitter();

  constructor(  private clientesService: ClientesService,
                private fb: FormBuilder,
                private rutasService: RutasService,
                private userService: UsersService
  ){
    this.user = userService.user;
  }

  ngOnInit(): void {

    // LOAD RUTAS
    this.loadRutas();
    
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
   * CREATE
  ====================================================================== */
  public formSubmit: boolean = false;
  public createForm = this.fb.group({
    nombre: ['', [Validators.required]],
    codigo: ['58', [Validators.required]],
    telefono: ['', [Validators.required]],
    cedula: ['', [Validators.required]],
    direccion: ['', [Validators.required]],
    correo: ['', [Validators.required]],
    ruta: ['', [Validators.required]]
  })

  create(){

    this.formSubmit = true;

    if (this.createForm.invalid) {
      this.formSubmit = false;
      return;
    }

    this.clientesService.createCliente(this.createForm.value)
        .subscribe( ({cliente}) => {

          this.formSubmit = false;
          this.createForm.reset();
          this.actualizar.emit(cliente);

          Swal.fire({
            text: 'Se ha creado el cliente exitosamente',
            icon: 'success',
            toast: true,
            timer: 2000,
            showConfirmButton: false,
            position: 'top-right'
          })

        }, (err) => {
          this.formSubmit = false;
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ======================================================================
   * VALIDATE
  ====================================================================== */
  validate(campo: string): boolean{
    return (this.formSubmit && this.createForm.get(campo)?.invalid)? true: false; 
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

}
