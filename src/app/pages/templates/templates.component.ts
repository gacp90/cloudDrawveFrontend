import { Component, OnInit } from '@angular/core';
import { Template } from 'src/app/models/template.model';
import { TemplatesService } from 'src/app/services/templates.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css']
})
export class TemplatesComponent implements OnInit {
  
  public internalApiKey: string = 'none';
  
  // Variables de la tabla
  public templates: any[] = []; // Usamos any o tu modelo extendido para leer los botones y headerContent
  public total: number = 0;
  public cargandoLista: boolean = false;
  public sincronizando: boolean = false;
  public autoSyncRealizado: boolean = false;
  
  // Variables para la Vista Previa (Modal)
  public plantillaSeleccionada: any = null;
  public mostrarModalPreview: boolean = false;

  public query: any = {
    desde: 0,
    hasta: 50,
    active: true,
    sort: {
      createdAt: -1
    }
  }
  
  constructor(  
    private templatesService: TemplatesService,
    private userService: UsersService
  ) { 
    this.internalApiKey = this.userService.user.internalApiKey!;
  }

  ngOnInit(): void { 
    this.loadTemplates();
  }

  // ==========================================
  // CARGAR PLANTILLAS
  // ==========================================
  loadTemplates() {
    this.cargandoLista = true;

    this.templatesService.loadTemplates(this.internalApiKey, this.query)
      .subscribe({
        next: (res: any) => {
          this.templates = res.templates;
          this.total = res.total;
          this.cargandoLista = false;

          // Verificamos si hay alguna pendiente para auto-sincronizar
          const hayPendientes = this.templates.some(p => p.status === 'PENDING');
          
          if (hayPendientes && !this.autoSyncRealizado) {
            this.autoSyncRealizado = true; 
            this.sincronizarConMeta(true); // Silencioso
          }
        },
        error: (err) => {
          console.error('Error al cargar templates:', err);
          this.cargandoLista = false;
        }
      });
  }

  // ==========================================
  // SINCRONIZAR CON META
  // ==========================================
  sincronizarConMeta(silencioso: boolean = false) {
    this.sincronizando = true;
    
    this.templatesService.syncTemplates(this.internalApiKey).subscribe({
      next: (res: any) => {
        this.sincronizando = false;
        
        if (!silencioso) {
          Swal.fire({
            icon: 'success',
            title: 'Sincronización completada',
            text: `Se han actualizado los estados desde Meta.`,
            timer: 2000,
            showConfirmButton: false
          });
        }
        
        this.autoSyncRealizado = true; 
        this.loadTemplates(); 
      },
      error: (err) => {
        console.error('Error sincronizando', err);
        this.sincronizando = false;
        if (!silencioso) {
          Swal.fire('Error', 'No se pudo sincronizar con Meta en este momento.', 'error');
        }
      }
    });
  }

  // ==========================================
  // ACTIVAR / DESACTIVAR
  // ==========================================
  toggleActiva(plantilla: any) {
    const estadoAnterior = !plantilla.active; 

    this.templatesService.toggleTemplateActive(this.internalApiKey, plantilla._id, plantilla.active)
      .subscribe({
        next: (res) => {
          // Toast sutil en lugar de un alert intrusivo
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          Toast.fire({
            icon: 'success',
            title: `Plantilla ${plantilla.active ? 'activada' : 'desactivada'}`
          });
        },
        error: (err) => {
          console.error('Error al cambiar estado', err);
          Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
          plantilla.active = estadoAnterior; // Revertir visualmente
        }
      });
  }

  // ==========================================
  // ELIMINAR PLANTILLA
  // ==========================================
  /* eliminarPlantilla(plantilla: any) {
    Swal.fire({
      title: `¿Eliminar '${plantilla.name}'?`,
      text: "Se borrará de tu base de datos local. Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.templatesService.deleteTemplate(this.internalApiKey, plantilla.name).subscribe({
          next: () => {
            Swal.fire('Eliminada', 'La plantilla ha sido borrada.', 'success');
            this.loadTemplates();
          },
          error: (err) => Swal.fire('Error', 'No se pudo eliminar la plantilla.', 'error')
        });
      }
    });
  } */

  // ==========================================
  // VISTA PREVIA (MODAL)
  // ==========================================
  abrirVistaPrevia(plantilla: any) {
    this.plantillaSeleccionada = plantilla;
    this.mostrarModalPreview = true;
  }

  cerrarVistaPrevia() {
    this.mostrarModalPreview = false;
    this.plantillaSeleccionada = null;
  }

  /** ================================================================
   *   CHANGE LIMITE
  ==================================================================== */
  limiteChange( cantidad: any ){  

    this.query.hasta = Number(cantidad);    
    this.loadTemplates();

  }

  /** ================================================================
   *   CHANGE ORDEN
  ==================================================================== */
  statusChange( orden: any ){  

    if (orden === 'Activos') {
      this.query.active = true      
    } else {
      this.query.active = false;
    } 

    this.loadTemplates();

  }


}