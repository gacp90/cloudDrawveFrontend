import { Rifa } from "./rifas.model";
import { User } from "./users.model";

export class Movimiento{

    constructor(
        public monto: number,
        public descripcion: string,
        public type: string,
        public user: User,
        public rifa: Rifa,
        public status: Boolean,
        public fecha: Date,
        public moid?: string,
        public _id?: string,
    ){}

}