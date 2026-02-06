import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {AuthBootstrapService} from './core/services/AuthBootstrapService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('synapse-ui');
  constructor(private authBootstrap: AuthBootstrapService) {
    if (typeof window !== 'undefined') {
      this.authBootstrap.init(); // runs only in browser
    }
  }
}
