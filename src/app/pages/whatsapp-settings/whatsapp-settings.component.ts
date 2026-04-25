import { Component, HostListener, OnInit } from '@angular/core';
import { User } from 'src/app/models/users.model';
import { UsersService } from 'src/app/services/users.service';
import { WhatsappService } from 'src/app/services/whatsapp.service';
import Swal from 'sweetalert2';
declare var FB: any;

@Component({
  selector: 'app-whatsapp-settings',  
  styleUrls: ['./whatsapp-settings.component.css'],
  template: `
    <div class="card p-4 text-center" style="background: #1e212b;">
        <h3 class="text-white mb-3">Vincula tu WhatsApp</h3>
        <p class="text-muted mb-4">Conecta tu número para empezar a enviar tickets y notificaciones a tus clientes.</p>
        <button class="btn btn-primary btn-lg" (click)="launchWhatsAppSignup()">
            <i class="bx bxl-whatsapp fs-lg me-2"></i> Conectar con Meta
        </button>
    </div>
  `
})
export class WhatsappSettingsComponent implements OnInit {
  
  public user!: User;
  constructor(  private whatsappService: WhatsappService,
                private usersService: UsersService
  ) { 
    this.user = this.usersService.user;
  }


  ngOnInit(): void {
    this.loadFacebookSDK();
  }

  // 1. Cargar el SDK de Facebook
  loadFacebookSDK() {
    (window as any).fbAsyncInit = function() {
      FB.init({
        appId      : '1797345757607881', 
        cookie     : true,
        autoLogAppEvents: true,            
        xfbml      : true,               
        version    : 'v25.0'             // Apuntando a la versión más reciente
      });
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement; js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }

  // 2. Escuchar los eventos en tiempo real de la ventana emergente (LA NOVEDAD)
  wabaIdRecibido: string = '';
  telefonoIdRecibido: string = '';
  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (!event.origin.endsWith('facebook.com')) return;

    try {
      const payloadMeta = JSON.parse(event.data);
      
      if (payloadMeta.type === 'WA_EMBEDDED_SIGNUP') {
        console.log('Progreso del registro: ', payloadMeta);
        
        // ¡LA PIEZA CLAVE!: Si el evento es FINISH, guardamos los IDs
        if (payloadMeta.event === 'FINISH' && payloadMeta.data) {
          this.wabaIdRecibido = payloadMeta.data.waba_id;
          this.telefonoIdRecibido = payloadMeta.data.phone_number_id;
          console.log('✅ IDs capturados exitosamente en Angular');
        }

      } else if (payloadMeta.type === 'WA_SIGNUP_SUCCESS') {
        console.log('Registro exitoso: ', payloadMeta);
      } 
    } catch (e) {
      // Ignoramos si no es JSON
    }
  }

  // 3. Ejecutar la ventana emergente con todas las banderas
  launchWhatsAppSignup() {
    FB.login((response: any) => {
      if (response.authResponse) {

        const codigoMeta = response.authResponse.code;

        // Armamos el Body con el Code y los IDs que atrapó el HostListener
        const payloadBackend = {
          code: codigoMeta,
          wabaId: this.wabaIdRecibido,
          phoneNumberId: this.telefonoIdRecibido
        };

        // Disparamos la petición a tu endpoint
        this.whatsappService.checkTokenAndRegister(payloadBackend)
          .subscribe({
            next: (respuestaBackend: any) => {
              
              console.log('¡Microservicio respondió con éxito!', respuestaBackend);
      
              // 1. Extraemos los datos del canal devuelto por NestJS
              const canal = respuestaBackend.data;
              const internalApiKey = canal.internalApiKey;

              // 2. Disparamos la actualización hacia tu Backend Principal de Rifari
              this.usersService.updateUser({whatsappApiKey: internalApiKey, gsm: true}, this.user.uid!).subscribe({
                next: (userUpdateResponse: any) => {
                  
                  // 3. Actualizamos el estado global de la app en Angular (Memoria/LocalStorage)
                  // Esto asume que tienes un método similar en tu servicio de auth
                  this.usersService.user.internalApiKey = internalApiKey;
                  this.user.internalApiKey = internalApiKey;

                  // 4. Lanzamos la alerta de éxito final
                  Swal.fire({
                    icon: 'success',
                    title: '¡Vinculación exitosa!',
                    text: '¡WhatsApp ha sido conectado permanentemente a tu cuenta de Rifari!',
                    confirmButtonColor: '#3085d6'
                  });

                },
                error: (errMainBackend) => {
                  console.error('Error al actualizar el usuario en Rifari:', errMainBackend);
                  Swal.fire({
                    icon: 'warning',
                    title: 'Casi listo...',
                    text: 'El canal se creó, pero hubo un problema al actualizar tu perfil. Por favor, contacta a soporte.',
                  });
                }
              });

            },
            error: (err) => {
              console.error('Error en NestJS:', err);
              Swal.fire({
                icon: 'error',
                title: '¡Error en el servidor!',
                text: 'No se pudo vincular tu WhatsApp. Por favor, inténtalo de nuevo.',
              });
            }
          });
        
      } else {
        console.log('El usuario canceló el inicio de sesión o no completó el flujo.');
        Swal.fire({
          icon: 'error',
          title: '¡Vinculación cancelada!',
          text: 'No se pudo vincular tu WhatsApp. Por favor, inténtalo de nuevo.',
        });
      }
    }, {
      // AQUÍ ESTÁ TU ID DE CONFIGURACIÓN REAL
      config_id: '1290484799111322', 
      response_type: 'code',
      override_default_response_type: true,
      "extras": {
          setup: {},
          "featureType": "whatsapp_business_app_onboarding", // set to 'whatsapp_business_app_onboarding'
          "sessionInfoVersion": "3",
          "version": "4"
        }
    });
  }


  launchWhatsAppSignup2() {
    FB.login((response: any) => {
      if (response.authResponse) {
        
        const codigoMeta = response.authResponse.code;
        console.log('¡Éxito! Código listo para NestJS:', codigoMeta);
        
        // Aquí llamaremos a tu servicio HTTP para enviar el código al backend
        // this.whatsappService.enviarCodigo(codigoMeta).subscribe(...);
        
      } else {
        console.log('El usuario canceló el inicio de sesión o no completó el flujo.');
      }
    }, {
      "config_id": '1290484799111322', 
      "response_type": 'code',
      "override_default_response_type": true,
      "extras": {
          setup: {},
          "featureType": "whatsapp_business_app_onboarding", // set to 'whatsapp_business_app_onboarding'
          "sessionInfoVersion": "3",
          "version": "4"
        }
    });
  }


  // 3. Enviar al Backend
  sendTokenToBackend(token: string) {
    // Aquí luego agregaremos tu servicio HttpClient para enviarlo a NestJS
    console.log("Token listo para ser procesado por NestJS:", token);
    alert("¡Token recibido! Revisa la consola.");
  }

}
