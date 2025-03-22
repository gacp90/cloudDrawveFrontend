import { Injectable } from '@angular/core';
import { App } from '@capacitor/app';

declare var bluetoothSerial: any;

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {

  constructor() { }

  private connectedDevice: string | null = null;

  startReconnectInterval() {
    setInterval(() => {
      bluetoothSerial.isConnected(
        () => console.log('🔵 Impresora conectada'),
        () => {
          console.log('⚠️ Impresora desconectada. Intentando reconectar...');
          if (this.connectedDevice) {
            this.connectToDevice(this.connectedDevice).catch(err => console.error(err));
          }
        }
      );
    }, 5000); // Verifica cada 5 segundos
  }

  

  // 🔵 Escanear dispositivos Bluetooth cercanos
  discoverDevices(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      bluetoothSerial.list(
        (devices: any[]) => resolve(devices),
        (error: any) => reject(error)
      );
    });
  }

  // 🔵 Conectar a una impresora Bluetooth por su dirección MAC
  connectToDevice(address: string): Promise<string> {
    this.connectedDevice = address;
    return new Promise((resolve, reject) => {
      bluetoothSerial.connect(address, 
        () => resolve('Conectado correctamente'),
        (error: any) => reject(error)
      );
    });
  }

  // 🔵 Enviar datos a la impresora (imprimir)
  printText(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bluetoothSerial.write(text + '\n',
        () => resolve('Impresión enviada'),
        (error: any) => reject(error)
      );
    });
  }

  // 🔵 Desconectar la impresora
  disconnectDevice(): Promise<string> {
    return new Promise((resolve, reject) => {
      bluetoothSerial.disconnect(
        () => resolve('Desconectado correctamente'),
        (error: any) => reject(error)
      );
    });
  }

}
