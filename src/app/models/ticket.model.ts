import { Rifa } from "./rifas.model";
import { Ruta } from "./rutas.model";
import { User } from "./users.model";

export interface _pagos{
    descripcion: string,
    monto: number,
    estado: string,
    user?: any,
    fecha?: Date,
    name?: string,
    _id?: string
}

export class Ticket{

    constructor(

        public numero: string,
        public monto: number,
        public nombre: string,
        public telefono: string,
        public cedula: string,
        public direccion: string,
        public ruta: Ruta,
        public rifa: Rifa,
        public estado: string,
        public vendedor: User,
        public pagos: _pagos[],
        public nota: string,
        public status: boolean,
        public disponible: boolean,
        public ganador: boolean,
        public _id?: string,
        public tid?: string,

    ){}

}