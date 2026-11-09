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
  templateUrl: './dashboard.html',
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
        console.error('Error de carga', err);
        this.isLoading.set(false);
      }
    });
  }
}