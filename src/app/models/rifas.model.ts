import { User } from "./users.model";

interface _metodos{
    name: string,
    descripcion: string,
    cuenta: string,
}

interface _premios{
    name: string,
    descripcion: string,
    fecha: Date,
}

interface _img {
    img: string,
    fecha: Date,
    _id?: string
}

export class Rifa{

    constructor(

        public name: string,
        public monto: number,
        public promocion: number,
        public comision: number,
        public numeros: number,
        public loteria: string,
        public fecha: Date,
        public descripcion: string,
        public metodos: _metodos[],
        public premios: _premios[],
        public estado: string,
        public admin: User,
        public status: boolean,
        public abierta: boolean,
        public img: _img[],
        public _id?: string,
        public rifid?: string,

    ){}

}