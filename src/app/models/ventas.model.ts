import { Rifa } from "./rifas.model";
import { Ticket } from "./ticket.model";

interface _item{
    name: string,
    size: string,
    color: string,
    price: number,
    qty: number,
    _id?: string,
}

export class Venta{
    constructor(
        public tickets: any[],
        public monto: number,
        public nombre: string,
        public codigo: string,
        public telefono: string,
        public cedula: string,
        public pais: string,
        public departamento: string,
        public ciudad: string,
        public direccion: string,
        public guia: string,
        public correo: string,
        public signature: string,
        public amountInCents: number,
        public rifa: Rifa,
        public wompi: boolean,
        public wompi_id: string,
        public estado: string,
        public item: _item,
        public nota: string,
        public donar: boolean,
        public status: boolean,
        public fecha: Date,
        public showTickets?: boolean,
        public vid?: string,
        public _id?: string,
    ){}
}