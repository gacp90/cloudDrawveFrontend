import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/users.model';
import { SmsService } from 'src/app/services/sms.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-mensajes',
  templateUrl: './mensajes.component.html',
  styleUrls: ['./mensajes.component.css']
})
export class MensajesComponent implements OnInit {
  
  public user!: User;
  constructor(  private smsService: SmsService,
                private usersService: UsersService

  ){
    this.user = usersService.user;
  }

  ngOnInit(): void {
    this.loadSms();
  }

  /** ======================================================================
   * LOAD SMS
  ====================================================================== */
  public sms: any[] = [];
  public query: any = {
    desde: 0,
    hasta: 50,
    sort: {
      fecha: -1
    }
  }

  loadSms(){

    this.smsService.loadSmsCloud(this.query)
        .subscribe( ({sms}) => {

          this.sms = sms

          console.log(sms);
          

        }, (err) => {
          console.log(err);
          Swal.fire('Error', err.error.msg, 'error');          
        })

  }


}
