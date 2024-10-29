import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { FormBuilder, Validators } from '@angular/forms';
import { User } from 'src/app/models/users.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  public user!: User;

  constructor(  private usersService: UsersService){
                  // CARGAR USER
                  this.user = usersService.user;
                                    
                }

  ngOnInit(): void { }

  /** ==============================================================================
   * LOGOUT
  ================================================================================*/

  logout(){
    this.usersService.logout();
  }

}
