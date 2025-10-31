import { Ruta } from "./rutas.model";
import { User } from "./users.model";

interface _alerts{
    titulo: string,
    msg: string,
    icon: string,
    _id: string
}

export class Client{

    constructor(
        public nombre: string,
        public codigo: string,
        public telefono: string,
        public cedula: string,
        public direccion: string,
        public correo: string,
        public telegram: boolean,
        public admin: User,
        public ruta: Ruta,
        public status: boolean,
        public sms: boolean,
        public alerts: boolean,
        public fecha: Date,
        public _id?: string,
        public cid?: string,
    ){}
}