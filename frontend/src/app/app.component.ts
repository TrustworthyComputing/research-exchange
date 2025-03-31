import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from "./components/footer/footer.component";
import {NavbarComponent} from "./components/navbar/navbar.component";
import {setTheme} from "ngx-bootstrap/utils";
import {AccordionModule} from "ngx-bootstrap/accordion";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FooterComponent, NavbarComponent, AccordionModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {
    setTheme('bs5')
  }
}
