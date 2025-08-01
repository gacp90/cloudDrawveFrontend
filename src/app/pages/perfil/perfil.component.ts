import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { User } from 'src/app/models/users.model';

import { UsersService } from 'src/app/services/users.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { BluetoothService } from 'src/app/services/bluetooth.service';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { environment } from '../../../environments/environment'; 

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  public client = environment.client || false;

  constructor(  private activatedRoute: ActivatedRoute,
                private usersService: UsersService,
                private router: Router,
                private fileUploadService: FileUploadService,
                private bluetoothService: BluetoothService,
                private fb: FormBuilder){
                  this.user = usersService.user;
                }

  ngOnInit(): void {
    
    this.activatedRoute.params
        .subscribe( ({id}) => {

          if ( this.user.uid !== id ) { 
            if (this.user.role === 'ADMIN') { 
              this.loadUser(id);  
            }else{
              Swal.fire('Atención', 'No tienes los privilegios para estar aqui', 'warning');
              this.router.navigateByUrl('/');
              return;              
            } 
          }else{
            this.getForm();
          }   

        }); 
  }
              
  /** ================================================================
   *  CARGAR USUARIO
  ==================================================================== */
  public user!: User;

  loadUser(id:string){

    this.usersService.loadUserId(id)
        .subscribe( ({user}) => {

          this.user = user;    
          this.getForm();  

        });

  }
              
  /** ================================================================
   *  GET FORM
  ==================================================================== */
  getForm(){

    console.log(this.user);
    

    this.formUpdate.reset({
      email: this.user.email,
      name: this.user.name,
      phone: this.user.phone,
      password: '',
      repassword: ''
    });

    this.formWati.reset({
      wati: this.user.wati || false,
      watilink: (this.user.watilink)? this.user.watilink : 'empty',
      watitoken: (this.user.watitoken)? this.user.watitoken : 'empty'
    })

  }
              
  /** ================================================================
   *  ACTUALIZAR USUARIO
  ==================================================================== */
  public formUpdateSubmitted: boolean = false;
  public formUpdate = this.fb.group({
    email: ['', [Validators.required, Validators.minLength(2)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    password: ['', [Validators.minLength(6)]],
    repassword: ['', [Validators.minLength(6)]],
  });

  updateUser(){

    this.formUpdateSubmitted = true;

    if (this.formUpdate.invalid) {
      return;
    }

    if (this.formUpdate.value.password === '') {
      
      this.formUpdate.reset({
        email: this.formUpdate.value.email,
        name: this.formUpdate.value.name
      });
      
    }

    this.usersService.updateUser(this.formUpdate.value, this.user.uid!)
        .subscribe( ({user}) => {

          this.user = user;

          this.activatedRoute.params
          .subscribe( ({id}) =>{

            if (this.usersService.user.uid === id) {

              this.usersService.user.name = this.user.name;
              this.usersService.user.email = this.user.email;
              
            }

            Swal.fire('Estupendo', 'Se ha actualizado el perfil exitosamente!', 'success');

          }, (err) => {
            console.log(err);
            Swal.fire('Error', err.error.msg, 'error');            
          });

        });

  }
              
  /** ======================================================================
   * VALIDATE FORM EDIT
  ====================================================================== */
  validateEditForm( campo:string ): boolean{

    if ( this.formUpdate.get(campo)?.invalid && this.formUpdateSubmitted ) {      
      return true;
    }else{
      return false;
    }

  }

  /** ================================================================
   *   ACTUALIZAR IMAGEN
  ==================================================================== */
  public imgTemp: any = null;
  public subirImagen!: any;
  cambiarImage(file: any): any{    

    this.subirImagen = file.target.files[0];
    
    if (!this.subirImagen) { return this.imgTemp = null }    
    
    const reader = new FileReader();
    const url64 = reader.readAsDataURL(file.target.files[0]);
        
    reader.onloadend = () => {
      this.imgTemp = reader.result;      
    }

  }
      
  /** ================================================================
   *  SUBIR IMAGEN fileImg
  ==================================================================== */
  @ViewChild('fileImg') fileImg!: ElementRef;
  public imgProducto: string = 'no-image';
  subirImg(){
    
    this.fileUploadService.updateImage( this.subirImagen, 'user', this.user.uid!)
    .then( (resp:{ date: Date, nombreArchivo: string, ok: boolean }) => {

      this.user.img = resp.nombreArchivo;
      this.usersService.user.img = resp.nombreArchivo;
      this.fileImg.nativeElement.value = '';
      this.imgProducto = 'no-image';
      this.imgTemp = null;
    
    });    
    
  }

  /** ================================================================
   *  ACTUALIZAR NOMBRE DE LA EMPRESA
  ==================================================================== */
  updateEmpresa(empresa: string){

    if (empresa.length === 0) {
      Swal.fire('Atención', 'Debes de asignar un nombre a tu empresa', 'warning');
      return;
    }

    this.usersService.updateUser({empresa}, this.user.uid!)
        .subscribe( ({user}) => {

          this.user.empresa = user.empresa;
          Swal.fire('Estupendo', 'Se ha actualizado el nombre de la empresa exitosamente', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ================================================================
   *  CLIPBOARD
  ==================================================================== */
  copyToClipboard() {
    document.addEventListener('copy', (e: ClipboardEvent) => {
      e.clipboardData!.setData('text/plain', (`https://cloud.rifari.com/registrarme?referCode=${this.user.referralCode}`));
      e.preventDefault();
      document.removeEventListener('copy', null!);
    });
    document.execCommand('copy');
  }

  /** ================================================================
   *   IMPRESORA BLUETOOTH
  ==================================================================== */
  devices: any[] = [];
  selectedDevice: { address: string, name: string, type: 'ESC' | 'TSPL' } | null = null;
  // 🔍 Escanear dispositivos Bluetooth
  scanDevices() {
    this.bluetoothService.discoverDevices().then(devices => {
      this.devices = devices.map(d => ({
        address: d.address,
        name: d.name,
        type: d.name?.toUpperCase().includes('TSC') ? 'TSPL' : 'ESC'  // Detección básica
      }));
      console.log('Dispositivos encontrados:', devices);
    }).catch(error => {
      console.error('Error al escanear dispositivos:', error);
    });
  }

  // 🔗 Conectar a una impresora
  connectPrinter(type: any) {
  if (this.selectedDevice) {
      this.selectedDevice.type = type;
      localStorage.setItem('typePrinter', type);
      this.bluetoothService.connectToDevice(this.selectedDevice.address).then(msg => {
        console.log(msg);
      }).catch(error => {
        console.error('Error al conectar con la impresora:', error);
      });
    }
  }
  // connectPrinter() {
  //   if (this.selectedDevice) {
  //     this.bluetoothService.connectToDevice(this.selectedDevice).then(msg => {
  //       console.log(msg);
  //     }).catch(error => {
  //       console.error('Error al conectar con la impresora:', error);
  //     });
  //   }
  // }

  // 🖨️ Enviar texto a imprimir
  printReceipt(): Promise<string> {
  return new Promise((resolve, reject) => {
    const device = this.selectedDevice;
    if (!device) {
      reject('No hay impresora seleccionada');
      return;
    }

    const dataToPrint = device.type === 'ESC'
      ? this.generateReceipt()
      : this.generateTsplReceipt();

    bluetoothSerial.write(dataToPrint,
      () => resolve('Factura impresa correctamente'),
      (error: any) => reject(error)
    );
  });
}
  // printReceipt(): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     const receiptText = this.generateReceipt();
  //     bluetoothSerial.write(receiptText,
  //       () => resolve('Factura impresa correctamente'),
  //       (error: any) => reject(error)
  //     );
  //   });
  // }

  // 🔵 Función para generar el texto de la factura
  generateReceipt(): string {
    let receipt = '';

    receipt += '\n       Prueba de impresion exitosa\n';

    return receipt;
  }

  generateTsplReceipt(): string {
  return `
    SIZE 58 mm, 10 mm
    OFFSET 0
    DENSITY 10
    SPEED 4
    DIRECTION 1
    REFERENCE 0,0
    CLS
    TEXT 10,10,"3",0,1,1,"Hola mundo"
    TEXT 10,35,"3",0,1,1,"Esto es una prueba"
    TEXT 10,60,"3",0,1,1,"Impresión Exitosa"
    TEXT 10,85,"3",0,1,1,"Gracias"
    PRINT 1,1
    `;
  }

  /** ================================================================
   *  WATI
  ==================================================================== */
  public formWatiSubmited: boolean = false;
  public formWati = this.fb.group({
    wati: false,
    watilink: ['', [Validators.required]],
    watitoken: ['', [Validators.required]]
  })

  updateWati(){

    this.formWatiSubmited = true;

    if (this.formWati.invalid) {
      return;
    }

    this.usersService.updateUser(this.formWati.value, this.user.uid!)
        .subscribe( ({ user }) => {

          this.user.wati = user.wati;
          this.user.watilink = user.watilink;
          this.user.watitoken = user.watitoken;
          Swal.fire('Estupendo!', 'Se ha actualizado wati exitosamente', 'success');

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }

  /** ================================================================
   *  VALIDATE WATI
  ==================================================================== */
  validateWati(campo: string): boolean  {

    return (this.formWatiSubmited && this.formWati.get(campo)?.invalid)? true: false;

  }


}
