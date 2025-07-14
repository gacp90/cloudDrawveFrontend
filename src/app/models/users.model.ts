import { environment } from "../../environments/environment"

const base_url = environment.base_url;

export class User {

    constructor (

        public email: string,
        public name: string,
        public phone: string,
        public empresa: string,
        public password: string,
        public role: 'ADMIN' | 'STAFF',
        public img: string,
        public status: boolean,
        public admin: User,
        public fecha: Date,
        public referralCode: string,
        public referredBy: string,
        public walletBalance: number,
        public whatsapp?: boolean,
        public wp?: string,
        public wati?: boolean,
        public watilink?: string,
        public watitoken?: string,
        public uid?: string,
        public _id?: string
        
    ){}

    /** ================================================================
    *   GET IMAGE
    ==================================================================== */    
    get getImage(){        
        
        if (this.img) {            
            return `${base_url}/uploads/user/${this.img}`;
        }else{
            return `${base_url}/uploads/user/no-image`;
        }
    }
    
}