import { User } from "./users.model";

export class Metodo {

    constructor(
        public moneda: string,
        public nombre: string,
        public cuenta: string,
        public tasa: number,
        public saldo: number,
        public comision: number,
        public admin: User,
        public status: boolean,
        public fecha: Date,
        public _id?: string,
        public metid?: string
    ){}

}