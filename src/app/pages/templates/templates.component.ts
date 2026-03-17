import { Component } from '@angular/core';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css']
})
export class TemplatesComponent {

  vistaActual: 'lista' | 'crear' = 'crear'; // Iniciamos en 'crear' para probar directo
  
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

  constructor() { }

  ngOnInit(): void { }

  // ==========================================
  // INSERCIÓN DE VARIABLES EN EL CURSOR
  // ==========================================
  insertarVariable(variable: string, inputElement: HTMLTextAreaElement) {
    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;
    const textoActual = this.nuevaPlantilla.bodyText;

    // Insertamos la variable exactamente donde está el cursor
    this.nuevaPlantilla.bodyText = textoActual.substring(0, start) + variable + textoActual.substring(end);

    // Devolvemos el foco al textarea justo después de la variable insertada
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
  crearPlantilla() {
    console.log('Plantilla creada:', this.nuevaPlantilla);
    alert('¡Plantilla creada con éxito! (Revisa la consola para ver los detalles)');
    // Aquí iría la lógica real para enviar la plantilla al backend
  }

}
