import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { FormBuilder, Validators } from '@angular/forms';
import { User } from 'src/app/models/users.model';
import { WhatsappService } from 'src/app/services/whatsapp.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  public user!: User;
  public channelHealth: any;

  constructor(  private usersService: UsersService,
                private whatssappService: WhatsappService
  ){
                  // CARGAR USER
                  this.user = usersService.user;
                  
                                    
                }

  ngOnInit(): void { 

    if (this.user.internalApiKey) {
      setTimeout( ()=> {
        this.channelHealth = this.whatssappService.channel;
        console.log(this.channelHealth);

      }, 1000)
      
    }
    
  }

  /** ==============================================================================
   * LOGOUT
  ================================================================================*/

  logout(){
    this.usersService.logout();
  }

   /** ================================================================
   *   TOTALIZAR METODOS DE PAGO
  ==================================================================== */
  sanitizeText(text: string) {
    // return text.replace(/\n/g, '<br>');
    ''
  }
  

}
