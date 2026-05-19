import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TemplatesService } from 'src/app/services/templates.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-template-create',
  templateUrl: './template-create.component.html',
  styleUrls: ['./template-create.component.css']
})
export class TemplateCreateComponent {
  
  public internalApiKey: string = '';
  public sendTemplate: boolean = false;

  // El modelo base
  nuevaPlantilla = {
    name: '',
    category: 'MARKETING',
    language: 'es',
    headerType: 'NONE', // 'NONE', 'TEXT', 'IMAGE', 'VIDEO'
    headerText: '',
    bodyText: '',
    footerText: '',
    quickReplies: [] as { text: string }[]
  };

  // Multimedia
  archivoSeleccionado: File | null = null;
  vistaPreviaUrl: string | ArrayBuffer | null = null;

  // Variables y Respuestas Rápidas
  nuevaRespuesta: string = '';
  variablesDetectadas: string[] = [];
  ejemplosVariables: { [key: string]: string } = {};

  constructor(
    private templatesService: TemplatesService,
    private userService: UsersService,
    private router: Router
  ) {
    this.internalApiKey = this.userService.user.internalApiKey!;
  }

  // ==========================================
  // MULTIMEDIA: SELECCIÓN Y VISTA PREVIA
  // ==========================================
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) {
      this.limpiarArchivo();
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (this.nuevaPlantilla.headerType === 'IMAGE' && !isImage) {
      Swal.fire('Error', 'Seleccionaste "Imagen" pero subiste otro formato.', 'error');
      this.limpiarArchivo();
      return;
    }

    if (this.nuevaPlantilla.headerType === 'VIDEO' && !isVideo) {
      Swal.fire('Error', 'Seleccionaste "Video" pero subiste otro formato.', 'error');
      this.limpiarArchivo();
      return;
    }

    // Validación de peso estricta (MegaBytes)
    const maxSizeMB = isVideo ? 16 : 5;
    if (file.size / (1024 * 1024) > maxSizeMB) {
      Swal.fire('Archivo muy pesado', `El límite para ${isVideo ? 'videos es de 16MB' : 'imágenes es de 5MB'}.`, 'warning');
      this.limpiarArchivo();
      return;
    }

    this.archivoSeleccionado = file;

    // Generar vista previa
    if (isImage) {
      const reader = new FileReader();
      reader.onload = e => this.vistaPreviaUrl = reader.result;
      reader.readAsDataURL(file);
    } else {
      this.vistaPreviaUrl = null; 
    }
  }

  limpiarArchivo() {
    this.archivoSeleccionado = null;
    this.vistaPreviaUrl = null;
    if (['IMAGE', 'VIDEO'].includes(this.nuevaPlantilla.headerType)) {
      // Limpiamos el input file si existe en el DOM
      const fileInput = document.getElementById('mediaInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  cambioHeaderType() {
    this.limpiarArchivo();
    this.nuevaPlantilla.headerText = '';
  }

  // ==========================================
  // CUERPO DEL MENSAJE Y VARIABLES
  // ==========================================
  insertarVariable(variable: string, inputElement: HTMLTextAreaElement) {
    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;
    const textoActual = this.nuevaPlantilla.bodyText;

    this.nuevaPlantilla.bodyText = textoActual.substring(0, start) + variable + textoActual.substring(end);
    
    this.actualizarVariables(); 

    setTimeout(() => {
      inputElement.focus();
      inputElement.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }

  actualizarVariables() {
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    const encontradas = new Set<string>(); 

    while ((match = regex.exec(this.nuevaPlantilla.bodyText)) !== null) {
      encontradas.add(match[1]);
    }

    this.variablesDetectadas = Array.from(encontradas);

    this.variablesDetectadas.forEach(v => {
      if (!this.ejemplosVariables[v]) this.ejemplosVariables[v] = '';
    });
  }

  // ==========================================
  // RESPUESTAS RÁPIDAS
  // ==========================================
  agregarRespuestaRapida() {
    const textoLimpio = this.nuevaRespuesta.trim();
    if (!textoLimpio) return;
    
    if (this.nuevaPlantilla.quickReplies.length >= 3) {
      Swal.fire('Límite alcanzado', 'Meta solo permite un máximo de 3 respuestas rápidas.', 'warning');
      return;
    }

    this.nuevaPlantilla.quickReplies.push({ text: textoLimpio });
    this.nuevaRespuesta = ''; 
  }

  eliminarRespuestaRapida(index: number) {
    this.nuevaPlantilla.quickReplies.splice(index, 1);
  }

  // ==========================================
  // GUARDAR Y ENVIAR AL BACKEND
  // ==========================================
  async guardarYEnviar() {
    // 1. Validaciones
    if (!this.nuevaPlantilla.name || !this.nuevaPlantilla.bodyText) {
      Swal.fire('Campos obligatorios', 'El nombre y el mensaje principal son obligatorios.', 'warning');
      return;
    }

    const faltanEjemplos = this.variablesDetectadas.some(v => !this.ejemplosVariables[v]?.trim());
    if (faltanEjemplos) {
      Swal.fire('Faltan ejemplos', 'Meta exige un texto de ejemplo para cada variable dinámica.', 'warning');
      return;
    }

    if (['IMAGE', 'VIDEO'].includes(this.nuevaPlantilla.headerType) && !this.archivoSeleccionado) {
      Swal.fire('Falta archivo', 'Seleccionaste un encabezado multimedia pero no adjuntaste ningún archivo.', 'warning');
      return;
    }

    this.sendTemplate = true;

    // 2. Extraer el ORDEN EXACTO de las variables
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    const ordenVariables: string[] = [];
    while ((match = regex.exec(this.nuevaPlantilla.bodyText)) !== null) {
      ordenVariables.push(match[1]); 
    }
    const metaExamplesArray = ordenVariables.map(variable => this.ejemplosVariables[variable]);

    // 3. Armar el Payload limpio
    const payload = {
      name: this.nuevaPlantilla.name.trim().toLowerCase().replace(/\s+/g, '_'),
      language: this.nuevaPlantilla.language,
      category: this.nuevaPlantilla.category,
      headerType: this.nuevaPlantilla.headerType,
      headerText: this.nuevaPlantilla.headerText,
      bodyText: this.nuevaPlantilla.bodyText,
      footerText: this.nuevaPlantilla.footerText,
      quickReplies: this.nuevaPlantilla.quickReplies.map(qr => qr.text),
      exampleBodyText: metaExamplesArray.length > 0 ? [ metaExamplesArray ] : []
    };    

    // 4. Decidir la ruta: Multimedia (FormData) vs Texto (JSON)
    let request$;
    if (['IMAGE', 'VIDEO'].includes(this.nuevaPlantilla.headerType)) {
      const formData = new FormData();
      formData.append('file', this.archivoSeleccionado!);
      formData.append('templateData', JSON.stringify(payload));

      console.log(formData);
      
      
      // Asume que agregaste createMediaTemplate a tu templates.service.ts
      request$ = this.templatesService.crearPlantillaMedia(this.internalApiKey, formData);
    } else {
      request$ = this.templatesService.createTemplate(this.internalApiKey, payload);
    }

    // 5. Enviar Petición
    request$.subscribe({
      next: (response: any) => {
        Swal.fire({
          icon: 'success',
          title: '¡Plantilla enviada a revisión!',
          text: 'La plantilla ha sido registrada en Meta exitosamente.',
          confirmButtonText: 'Ver mis plantillas'
        }).then(() => {
          this.router.navigate(['/dashboard/plantillas']); // Regresa al listado
        });
        this.sendTemplate = false;
      },
      error: (err: any) => {
        console.error('Error al enviar plantilla:', err);
        Swal.fire('Error', err.error.msg, 'error');
        this.sendTemplate = false;
      }
    });
  }

  // ==========================================
  // FUNCION DE EMOJIS
  // ==========================================
  mostrarEmojis: boolean = false;

  // Función para inyectar el emoji en la posición exacta del cursor
  addEmoji(event: any, inputElement: HTMLTextAreaElement) {
    const emoji = event.emoji.native; // Obtenemos el emoji real (ej: 😀)
    
    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;
    const textoActual = this.nuevaPlantilla.bodyText;

    // Inyectamos el emoji en el texto
    this.nuevaPlantilla.bodyText = textoActual.substring(0, start) + emoji + textoActual.substring(end);
    
    this.actualizarVariables();

    // Devolvemos el foco al textarea para que el usuario siga escribiendo fluidamente
    setTimeout(() => {
      inputElement.focus();
      inputElement.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  }

  // Opcional: Cerrar el panel si hace clic fuera o cuando termina
  toggleEmojis() {
    this.mostrarEmojis = !this.mostrarEmojis;
  }
}