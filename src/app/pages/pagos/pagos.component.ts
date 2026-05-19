import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/models/users.model';
import { SpidiService } from 'src/app/services/spidi.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {

  historialPagos: any[] = [];
  cargando: boolean = true;
  public user!: User;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spidiService: SpidiService,
    private usersService: UsersService
  ) { 
    this.user = usersService.user;
  }

  ngOnInit(): void {
    this.verificarEstadoPago();
    this.cargarHistorial();
  }

  // 1. Verifica si el usuario viene redirigido desde Spidi
  verificarEstadoPago() {
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      
      if (status === 'exito') {
        Swal.fire({
          icon: 'success',
          title: '¡Recarga Exitosa!',
          text: 'Tu pago está siendo procesado y tu saldo se actualizará en 30 minutos aproximadamente.',
          confirmButtonText: 'Entendido'
        });
        // Limpiamos la URL para que no vuelva a salir la alerta si recarga la página
        this.router.navigate(['/dashboard/pagos'], { replaceUrl: true });
        
      } else if (status === 'fallido') {
        Swal.fire({
          icon: 'error',
          title: 'Pago Fallido',
          text: 'La transacción fue cancelada o no se pudo completar.',
          confirmButtonText: 'Cerrar'
        });
        this.router.navigate(['/dashboard/pagos'], { replaceUrl: true });
      }
    });
  }

  // 2. Carga la tabla de transacciones
  cargarHistorial() {
    this.cargando = true;
    this.spidiService.obtenerHistorial(this.user.internalApiKey!).subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.historialPagos = res.data;          
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar el historial:', err);
        Swal.fire('Error', 'No se pudo cargar el historial de pagos.', 'error');
        this.cargando = false;
      }
    });
  }

  // Utilidad para pintar el estado con colores en la tabla
  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'completed': return 'badge bg-success';
      case 'pending': return 'badge bg-warning text-dark';
      case 'failed': return 'badge bg-danger';
      case 'refunded': return 'badge bg-secondary';
      default: return 'badge bg-light text-dark';
    }
  }

  // Traducción visual del estado
  traducirEstado(estado: string): string {
    switch (estado) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      default: return estado;
    }
  }

}
