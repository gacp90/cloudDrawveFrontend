import { Component, OnInit } from '@angular/core';

declare function customInitFunction(): any;
declare function scrollbarFunction(): any;
declare function waves(): any;
declare function sidebarMenu(): any;
declare function chatFunction(): any;

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styles: []
})
export class PagesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {

    customInitFunction();
    scrollbarFunction();
    waves();
    sidebarMenu();
    chatFunction();

  }

}
