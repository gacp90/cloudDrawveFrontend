import { Client } from "./clientes.model";
import { Metodo } from "./metodos.model";
import { Rifa } from "./rifas.model";
import { Ruta } from "./rutas.model";
import { Ticket } from "./ticket.model";
import { User } from "./users.model";

export class Payment{
    constructor(
        public descripcion: string,
        public referencia: string,
        public nombre: string,
        public cuenta: string,
        public tasa: number,
        public monto: number,
        public equivalencia: number,
        public img: string,
        public cliente: Client,
        public admin: User,
        public ticket: Ticket,
        public vendedor: User,
        public method: Metodo,
        public rifa: Rifa,
        public ruta: Ruta,
        public estado: string,
        public status: boolean,
        public fecha: Date,
        public payid?: string,
        public _id?: string

    ){}
}