import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/users.model';
import { SpidiService } from 'src/app/services/spidi.service';
import { UsersService } from 'src/app/services/users.service';
import { WhatsappService } from 'src/app/services/whatsapp.service';
import Swal from 'sweetalert2';

declare var FB: any;
interface channel {
  creditosRifari: number,
  telefono: string,
  estadoLinea: string,
  calidad: string,
  limiteDiario: string,
}

@Component({
  selector: 'app-whatsapp-settings',  
  styleUrls: ['./whatsapp-settings.component.css'],
  templateUrl: './whatsapp-settings.component.html'
})
export class WhatsappSettingsComponent implements OnInit {
  
  public user!: User;
  esDominioOficial: boolean = false;
  constructor(  private whatsappService: WhatsappService,
                private usersService: UsersService,
                private spidiService: SpidiService, // <-- NUEVO
                private route: ActivatedRoute
  ) { 
    this.user = this.usersService.user;
  }


  ngOnInit(): void {
    this.verificarDominio();

    if (this.user.internalApiKey) {
      this.loadHealt();
    }

    if (this.esDominioOficial) {
      this.loadFacebookSDK();
    }
  }

  verificarDominio() {
    // Agregamos 'localhost' por si necesitas hacer pruebas en tu computadora
    const dominiosPermitidos = ['demo.rifari.com', 'cloud.rifari.com', 'www.demo.rifari.com', 'www.cloud.rifari.com', 'localhost'];
    const dominioActual = window.location.hostname;
    
    // Si el dominio actual está en la lista, esDominioOficial será true
    this.esDominioOficial = dominiosPermitidos.includes(dominioActual);
  }

  contactarSoporte() {
    const numero = '584247064335';
    const mensaje = encodeURIComponent('Hola, deseo vincular mi número de WhatsApp Business a la API oficial de whatsapp.');
    const url = `https://wa.me/${numero}?text=${mensaje}`;
    
    window.open(url, '_blank'); // Abre en una pestaña nueva
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
  business_id: string = '';
  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (!event.origin.endsWith('facebook.com')) return;

    try {
      const payloadMeta = JSON.parse(event.data);
      
      if (payloadMeta.type === 'WA_EMBEDDED_SIGNUP') {
        console.log('Progreso del registro: ', payloadMeta);
        
        // ¡LA PIEZA CLAVE!: Si el evento es FINISH, guardamos los IDs FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING
        if (payloadMeta.event === 'FINISH' || payloadMeta.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' && payloadMeta.data) {
          this.wabaIdRecibido = payloadMeta.data.waba_id;
          this.telefonoIdRecibido = payloadMeta.data.phone_number_id;
          if (payloadMeta.data.business_id) {
            this.business_id = payloadMeta.data.business_id
          }
          console.log('✅ IDs capturados exitosamente en Angular');
        }

      } else if (payloadMeta.type === 'WA_SIGNUP_SUCCESS') {
        console.log('Registro exitoso: ', payloadMeta);
      }else{
        console.log('Que fue lo q paso: ', payloadMeta);
        
      }
      
    } catch (e) {
      // Ignoramos si no es JSON
    }
  }

  // 3. Ejecutar la ventana emergente con todas las banderas
  launchWhatsAppSignup() {
    FB.login((response: any) => {

      console.log('respuesta de FB: ', response);
      

      if (response.authResponse) {

        const codigoMeta = response.authResponse.code;

        // Armamos el Body con el Code y los IDs que atrapó el HostListener
        const payloadBackend = {
          code: codigoMeta,
          wabaId: this.wabaIdRecibido,
          phoneNumberId: this.telefonoIdRecibido,
          business_id: (this.business_id.length > 0)? this.business_id: ''
        };

        console.log('Payload para wp:', payloadBackend);
        

        // Disparamos la petición a tu endpoint
        this.whatsappService.checkTokenAndRegister(payloadBackend)
          .subscribe({
            next: (respuestaBackend: any) => {
              
              console.log('¡Microservicio respondió con éxito!', respuestaBackend);
      
              // 1. Extraemos los datos del canal devuelto por NestJS
              const canal = respuestaBackend.data;
              const internalApiKey = canal.internalApiKey;

              // 2. Disparamos la actualización hacia tu Backend Principal de Rifari
              this.usersService.updateUser({internalApiKey: internalApiKey, gsm: true}, this.user.uid!).subscribe({
                next: (userUpdateResponse: any) => {
                  
                  // 3. Actualizamos el estado global de la app en Angular (Memoria/LocalStorage)
                  // Esto asume que tienes un método similar en tu servicio de auth
                  this.usersService.user.internalApiKey = internalApiKey;
                  this.user.internalApiKey = internalApiKey;

                  // 4. Lanzamos la alerta de éxito final
                  Swal.fire({
                    icon: 'success',
                    title: '¡Vinculación exitosa!',
                    text: '¡WhatsApp ha sido conectado a tu cuenta de Rifari!',
                    confirmButtonColor: '#3085d6'
                  });

                  this.loadHealt();

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
          "sessionInfoVersion": "3"
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

  // HEALT
  public channelHealth!: channel;
  loadHealt(){

    if (this.user.internalApiKey) {
      this.whatsappService.healt(this.user.internalApiKey)
        .subscribe({ 
          next: (resp: any) =>{
            
            
            this.channelHealth = resp.data;
            this.usersService.chanel = resp.data;
            if (resp.data.status === 'PENDING') {
                this.channelHealth.limiteDiario = '0'; // O algún valor que no active ningún box
                this.channelHealth.calidad = 'UNKNOWN';
            } else if (resp.data.limiteDiario) {
                // Si viene 'TIER_250', lo limpia. Si viene 'UNLIMITED', lo deja igual.
                this.channelHealth.limiteDiario = resp.data.limiteDiario.includes('TIER_') 
                    ? resp.data.limiteDiario.split('TIER_')[1] 
                    : resp.data.limiteDiario;
            }            
            
          }
        })
    }

  }

  // ==========================================
  // VARIABLES PARA EL MODAL DE RECARGA
  // ==========================================
  mostrarModalRecarga: boolean = false;
  cantidadARecargar: number = 25; // Monto por defecto
  cargandoPago: boolean = false;

  // Ajusta estos precios a la tasa real (en USDT) que vas a cobrar en Rifari
  preciosMeta = {
    marketing: 0.080,
    utilidad: 0.015, 
    servicio: 0.015  
  };

  // ==========================================
  // LÓGICA DEL MODAL Y PAGOS
  // ==========================================
  abrirModalRecarga() {
    this.mostrarModalRecarga = true;
  }

  cerrarModalRecarga() {
    this.mostrarModalRecarga = false;
  }

  seleccionarMonto(monto: number) {
    this.cantidadARecargar = monto;
  }

  // Getters para calcular estimaciones dinámicas en el HTML
  get estimacionMarketing() { return Math.floor(this.cantidadARecargar / this.preciosMeta.marketing); }
  get estimacionUtilidad() { return Math.floor(this.cantidadARecargar / this.preciosMeta.utilidad); }
  get estimacionServicio() { return Math.floor(this.cantidadARecargar / this.preciosMeta.servicio); }

  iniciarPagoSpidi() {
    if (this.cantidadARecargar < 0.1) {
      Swal.fire('Monto mínimo', 'La recarga mínima es de 5 USDT.', 'warning');
      return;
    }
    
    this.cargandoPago = true;

    // Llamamos al microservicio
    this.spidiService.crearCheckout(this.cantidadARecargar, this.user.name || 'Cliente Rifari', this.user.internalApiKey!).subscribe({
      next: (res: any) => {
        if (res.ok && res.url) {
          window.location.href = res.url; // Redirige a Spidi
        }
      },
      error: (err) => {
        console.error('Error al generar checkout', err);
        Swal.fire('Error', 'No se pudo conectar con la pasarela de pagos.', 'error');
        this.cargandoPago = false;
      }
    });
  }

}
