import { Component } from '@angular/core';
import { Template } from 'src/app/models/template.model';
import { TemplatesService } from 'src/app/services/templates.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css']
})
export class TemplatesComponent {
  
  public internalApiKey: string = 'none';
  vistaActual: 'lista' | 'crear' = 'lista'; // Iniciamos en 'crear' para probar directo
  
  nuevaPlantilla = {
    name: '',
    category: 'MARKETING',
    language: 'es',
    headerType: 'NONE', // 'NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'
    headerText: '',
    bodyText: '',
    footerText: '',
    quickReplies: [] as { text: string }[]
  };

  // Variable para el input independiente de respuestas rápidas
  nuevaRespuesta: string = '';
  
  constructor(  private templatesService: TemplatesService,
                private userService: UsersService
  ) { 
    this.internalApiKey = this.userService.user.internalApiKey!;
  }

  ngOnInit(): void { 
    this.loadTemplates();
  }

  // ==========================================
  // LOAD TEMPLATES
  // ==========================================
  public templates: Template[] = [];
  public total: number = 0;
  public cargandoLista: boolean = false;
  public sincronizando: boolean = false;
  public autoSyncRealizado: boolean = false;
  public query: any = {
    desde: 0,
    hasta: 50,
    sort: {
      createdAt: -1
    }
  }
  loadTemplates(){

    this.cargandoLista = true;

    console.log(this.internalApiKey);
    

    this.templatesService.loadTemplates(this.internalApiKey, this.query)
      .subscribe({
        next: ({ok, templates, total}) => {
          this.templates = templates;
          this.total = total;
          this.cargandoLista = false;
          // LA MAGIA: Verificamos si hay alguna pendiente
          const hayPendientes = this.templates.some(p => p.status === 'PENDING');
          
          // Si hay pendientes y no hemos sincronizado en esta carga de pantalla...
          if (hayPendientes && !this.autoSyncRealizado) {
            this.autoSyncRealizado = true; // Marcamos para no entrar en bucle
            this.sincronizarConMeta(true); // true = modo silencioso
          }
        },
        error: (err) => {
          console.error('Error al cargar templates:', err);
          this.cargandoLista = false;
        }
      })

  }

  sincronizarConMeta(silencioso: boolean = false) {
    this.sincronizando = true;
    
    this.templatesService.syncTemplates(this.internalApiKey).subscribe({
      next: (res: any) => {
        this.sincronizando = false;
        
        // Si no fue silencioso (el usuario hizo clic), mostramos alerta
        if (!silencioso) {
          alert('¡Sincronización con Meta completada!');
        }
        
        // Recargamos la tabla para ver si los estados PENDING cambiaron
        // Pasamos autoSyncRealizado a true para evitar bucles
        this.autoSyncRealizado = true; 
        this.loadTemplates(); 
      },
      error: (err) => {
        console.error('Error sincronizando', err);
        this.sincronizando = false;
      }
    });
  }



  // ==================================================================================================
  // CREAR PLANTILLAS
  // ==================================================================================================
  insertarVariable(variable: string, inputElement: HTMLTextAreaElement) {
    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;
    const textoActual = this.nuevaPlantilla.bodyText;

    this.nuevaPlantilla.bodyText = textoActual.substring(0, start) + variable + textoActual.substring(end);
    
    this.actualizarVariables(); // <--- NUEVO: Actualizamos la detección

    setTimeout(() => {
      inputElement.focus();
      inputElement.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }

  // ==========================================
  // GESTIÓN DE RESPUESTAS RÁPIDAS
  // ==========================================
  agregarRespuestaRapida() {
    const textoLimpio = this.nuevaRespuesta.trim();
    
    if (!textoLimpio) return;
    
    if (this.nuevaPlantilla.quickReplies.length >= 3) {
      alert('Meta solo permite un máximo de 3 respuestas rápidas.');
      return;
    }

    this.nuevaPlantilla.quickReplies.push({ text: textoLimpio });
    this.nuevaRespuesta = ''; // Limpiamos el input
  }

  eliminarRespuestaRapida(index: number) {
    this.nuevaPlantilla.quickReplies.splice(index, 1);
  }

  cambiarVista(vista: 'lista' | 'crear') {
    this.vistaActual = vista;
  }

  // ==========================================
  // CREAR NUEVA PLANTILLA
  // ==========================================
  public sendTemplate: boolean = false;
  async guardarYEnviar() {
    if (!this.nuevaPlantilla.name || !this.nuevaPlantilla.bodyText) {
      alert('El nombre y el mensaje principal son obligatorios.');
      return;
    }

    // 1. Validar que no falten ejemplos
    const faltanEjemplos = this.variablesDetectadas.some(v => !this.ejemplosVariables[v]?.trim());
    if (faltanEjemplos) {
      alert('Por favor, proporciona un texto de ejemplo para todas las variables.');
      return;
    }

    // 2. Extraer el ORDEN EXACTO en el que aparecen las variables en el texto
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    const ordenVariables: string[] = [];
    
    // Leemos el texto de izquierda a derecha
    while ((match = regex.exec(this.nuevaPlantilla.bodyText)) !== null) {
      ordenVariables.push(match[1]); // ej: ['name', 'number']
    }

    // 3. Armar el array de ejemplos en el orden que Meta exige
    const metaExamplesArray = ordenVariables.map(variable => this.ejemplosVariables[variable]);

    this.sendTemplate = true;

    // Enviamos los datos crudos, el backend se encargará de Meta
    const payload = {
      name: this.nuevaPlantilla.name.trim().toLowerCase().replace(/\s+/g, '_'),
      language: this.nuevaPlantilla.language,
      category: this.nuevaPlantilla.category,
      headerType: this.nuevaPlantilla.headerType,
      headerText: this.nuevaPlantilla.headerText,
      bodyText: this.nuevaPlantilla.bodyText, // Viaja crudo: "Hola {{name}}..."
      footerText: this.nuevaPlantilla.footerText,
      quickReplies: this.nuevaPlantilla.quickReplies.map(qr => qr.text),
      exampleBodyText: metaExamplesArray.length > 0 ? [ metaExamplesArray ] : []
    };    

    try {
      await this.templatesService.createTemplate(this.internalApiKey, payload)
        .subscribe({
          next: (response) => {

            console.log('Payload enviado a NestJS:', response);
            Swal.fire({
              icon: 'success',
              title: '¡Plantilla creada y enviada a Meta!',
              text: 'La plantilla se ha enviado a Meta para su aprobación.',
              confirmButtonText: 'Aceptar'
            });
            this.sendTemplate = false;
            this.cambiarVista('lista');
            this.nuevaPlantilla = {
              name: '',
              category: 'MARKETING',
              language: 'es',
              headerType: 'NONE',
              headerText: '',
              bodyText: '',
              footerText: '',
              quickReplies: []
            };  
          },
          error: (err) => {
            console.error('Error al enviar plantilla a NestJS:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error al enviar plantilla',
              text: 'Ocurrió un error al enviar la plantilla a Meta.',
              confirmButtonText: 'Aceptar'
            });
            this.sendTemplate = false;
          }
        })
    } catch (error) {
      this.sendTemplate = false;
      console.error('Error al crear plantilla:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al crear plantilla',
        text: 'Ocurrió un error al crear la plantilla.',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  // Agrega estas nuevas variables en tu clase
  variablesDetectadas: string[] = [];
  ejemplosVariables: { [key: string]: string } = {};

  //

  // MODIFICACIÓN 2: Nueva función que lee el texto y extrae variables únicas
  actualizarVariables() {
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    const encontradas = new Set<string>(); // Usamos Set para no repetir si pone {{name}} dos veces

    while ((match = regex.exec(this.nuevaPlantilla.bodyText)) !== null) {
      encontradas.add(match[1]);
    }

    this.variablesDetectadas = Array.from(encontradas);

    // Inicializamos el objeto de ejemplos si la variable es nueva
    this.variablesDetectadas.forEach(v => {
      if (!this.ejemplosVariables[v]) this.ejemplosVariables[v] = '';
    });
  }

  // TOGGLE ACTIVE/INACTIVE
  toggleActiva(plantilla: any) {
    // Guardamos el estado anterior por si hay un error en el servidor
    const estadoAnterior = !plantilla.active; 

    this.templatesService.toggleTemplateActive(this.internalApiKey, plantilla._id, plantilla.active)
      .subscribe({
        next: (res) => {
          // Todo salió bien en la base de datos
          Swal.fire({
            icon: 'success',
            title: `Plantilla ${plantilla.active ? 'activada' : 'desactivada'}!`,
            text: `La plantilla "${plantilla.name}" ahora está ${plantilla.active ? 'activa' : 'inactiva'}.`,
            confirmButtonText: 'Aceptar'
          });
        },
        error: (err) => {
          console.error('Error al cambiar el estado de la plantilla', err);
          alert('Hubo un error de conexión. No se pudo cambiar el estado.');
          // Revertimos el switch visualmente
          plantilla.active = estadoAnterior;
        }
      });
  }

}
