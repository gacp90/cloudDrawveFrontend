import { Component, OnInit } from '@angular/core';

declare function customInitFunction(): any;
declare function chatFunction(): any;
declare function scrollbarFunction(): any;

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
    chatFunction();

  }

}
