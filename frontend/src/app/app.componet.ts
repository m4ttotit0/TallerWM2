import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, RouterLink],
  template: `
    <mat-toolbar color="primary">
      <span>📸AuLog📸</span>
      <span style="flex: 1.1;"></span>
      <button mat-button routerLink="/feed">Feed</button>
      <button mat-button routerLink="/upload">Subir Foto</button>
      <button mat-button color="warn" routerLink="/login">Cerrar Sesión</button>
    </mat-toolbar>
  `
})
export class NavbarComponent {}