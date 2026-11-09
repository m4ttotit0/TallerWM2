import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
    @if (isLoading()) {
      <mat-spinner diameter="40"></mat-spinner>
    } @else {
      @for (photo of photos(); track photo.id) {
        <mat-card class="photo-card" style="margin-bottom: 20px; max-width: 400px;">
          <mat-card-header>
            <mat-card-title>{{ photo.user?.username || 'Usuario' }}</mat-card-title>
          </mat-card-header>
          <img mat-card-image [src]="photo.image_url" [alt]="photo.description" style="width: 100%;">
          <mat-card-content>
            <p>{{ photo.description }}</p>
          </mat-card-content>
        </mat-card>
      }
    }
  `,
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  
  photos = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.cargarFotos();
  }

  cargarFotos() {
    this.isLoading.set(true);
    this.http.get<any[]>('http://localhost:8000/api/photos').subscribe({
      next: (data) => {
        this.photos.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar fotos:', err);
        this.isLoading.set(false);
      }
    });
  }
}