import { User } from "./users.model";

export interface _metodos{
    name: string,
    descripcion: string,
    cuenta: string,
    tasa: number,
    min: number,
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

export interface _montos{
    monto: number,
    qty?: number,
    _id?: string
}

export interface _botones{
    name?: string,
    monto?: number,
    qty?: number,
    color?: string,
    fondo?: string,    
    _id?: string
}

export class Rifa{

    constructor(

        public name: string,
        public monto: number,
        public promocion: number,
        public montos: _montos[],
        public comision: number,
        public numeros: number,
        public loteria: string,
        public fecha: Date,
        public descripcion: string,
        public metodos: _metodos[],
        public premios: _premios[],
        public estado: string,
        public admin: User,
        public visible: boolean,
        public lista: boolean,
        public botones: _botones[],
        public min: number,
        public max: number,
        public status: boolean,
        public abierta: boolean,
        public img: _img[],
        public portada: _img,
        public _id?: string,
        public rifid?: string,

    ){}

}