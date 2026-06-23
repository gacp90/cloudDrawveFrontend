import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/users.model';
import { MetodosService } from 'src/app/services/metodos.service';
import { PaymentsService } from 'src/app/services/payments.service';
import { RifasService } from 'src/app/services/rifas.service';
import { RutasService } from 'src/app/services/rutas.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {

  // Listas de datos
  public rifasList: any[] = [];
  public vendedoresList: any[] = [];
  public rutasList: any[] = [];
  public metodosList: any[] = [];
  public reporteData: any[] = [];
  
  // Variables calculadas para el resumen global
  public granTotalUSD: number = 0;
  public totalTransacciones: number = 0;

  // Filtros de búsqueda específicos para contabilidad
  public filtros: any = {
    rifa: '',
    vendedor: '',
    ruta: '',
    method: '',
    desde: '',
    hasta: ''
  };

  public user!: User;

  constructor(
     private rifasService: RifasService,
     private paymentsService: PaymentsService,
     private metodosService: MetodosService,
     private rutasService: RutasService,
     private usersService: UsersService,
  ) { 
    this.user = usersService.user;
  }

  ngOnInit(): void {
    this.cargarListasSelects();
    this.cargarReporte();
  }

  cargarListasSelects() {
    // Ejemplo:
    this.rifasService.loadRifas({abierta: true, admin: (this.user.role === 'ADMIN')? this.user.uid! : this.user.admin }).subscribe((res: any) => this.rifasList = res.rifas);
    this.usersService.loadUsers({status: true}).subscribe((res: any) => this.vendedoresList = res.users);
    this.metodosService.loadMetodos({status: true, hasta: 1000}).subscribe((res: any) => this.metodosList = res.metodos);
    this.rutasService.loadRutas({status: true, admin: (this.user.role === 'ADMIN')? this.user.uid! : this.user.admin }).subscribe((res: any) => this.rutasList = res.rutas);
    
  }

  cargarReporte() {
    // 1. Limpieza del payload
    const payloadQuery: any = {};
    
    Object.keys(this.filtros).forEach(key => {
      // Validamos que no esté vacío, exceptuando las fechas que tratamos aparte
      if (key !== 'desde' && key !== 'hasta' && this.filtros[key] !== '') {
        payloadQuery[key] = this.filtros[key];
      }
    });
    
    // Solo enviamos fechas si ambas están seleccionadas para evitar rangos rotos
    if (this.filtros.desde && this.filtros.hasta) {
      payloadQuery.desde = this.filtros.desde;
      payloadQuery.hasta = this.filtros.hasta;
    }    

    // 2. Consumo del endpoint
    this.paymentsService.loadPaymentsReport(payloadQuery).subscribe((res: any) => {

      
      this.reporteData = res.reporte;
      this.calcularGranTotal();
    }, err => {
      console.log(err);
    });
  }

  calcularGranTotal() {
    this.granTotalUSD = 0;
    this.totalTransacciones = 0;

    // Sumamos la equivalencia y la cantidad de cada tarjeta (método)
    this.reporteData.forEach(item => {
      this.granTotalUSD += item.totalEquivalenciaUSD;
      this.totalTransacciones += item.cantidadTransacciones;
    });

    // Limpiamos errores de decimales en JS
    this.granTotalUSD = Number(this.granTotalUSD.toFixed(2));
  }

  limpiarFiltros() {
    this.filtros = {
      rifa: '',
      desde: '',
      hasta: ''
    };
    this.cargarReporte();
  }

}
