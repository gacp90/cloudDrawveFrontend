import { Rifa } from "./rifas.model";
import { Ticket } from "./ticket.model";

export class Venta{
    constructor(
        public tickets: any[],
        public monto: number,
        public nombre: string,
        public codigo: string,
        public telefono: string,
        public cedula: string,
        public direccion: string,
        public correo: string,
        public signature: string,
        public amountInCents: number,
        public rifa: Rifa,
        public wompi: boolean,
        public wompi_id: string,
        public estado: string,
        public status: boolean,
        public fecha: Date,
        public vid?: string,
        public _id?: string,
    ){}
}