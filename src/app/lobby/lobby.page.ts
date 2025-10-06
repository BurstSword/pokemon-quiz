import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.page.html',
  styleUrls: ['./lobby.page.scss'],
})
export class LobbyPage implements OnInit {

  routes: any[] = [
    { path: 'tab1', name: 'Juego 1' },
    { path: 'tab2', name: 'Juego 2' },
    { path: 'tab3', name: 'Juego 3' },
    { path: 'tab4', name: 'Juego 4' },
    { path: 'clues', name: 'Juego 5' },
    { path: 'colors', name: 'Juego 6' },];
  constructor() { }

  ngOnInit() {
  }

}
