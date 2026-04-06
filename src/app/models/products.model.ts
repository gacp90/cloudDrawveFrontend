import { Rifa } from "./rifas.model";
import { User } from "./users.model";

interface _img {
    img: string,
    fecha: Date,
    _id?: string
}

export class Product{
    constructor(
        public code: string,
        public name: string,
        public precio: number,
        public qty: number,
        public tipo: string,
        public tallas: string[],
        public colores: string[],
        public rifa: Rifa,
        public admin: User,
        public img: _img[],
        public status: boolean,
        public fecha: Date,
        public _id?: string,
        public pid?: string,

    ){}
}