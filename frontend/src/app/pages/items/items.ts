import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Sensores y componente de creación con sensores
import { CrearPostComponent } from '../../crearpost.component';
import { DeviceSensorsService } from '../../services/device-sensors.service';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    CrearPostComponent
  ],
  templateUrl: './items.html',
  styleUrls: ['./items.scss']
})
export class ItemsComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  protected sensors = inject(DeviceSensorsService);

  photoForm = new FormGroup({
    image_url: new FormControl('', [Validators.required, Validators.pattern(/https?:\/\/.+/)]),
    description: new FormControl('', [Validators.required, Validators.maxLength(250)])
  });

  onSubmit() {
    if (this.photoForm.valid) {
      const coords = this.sensors.coordenadas();
      const payload = {
        ...this.photoForm.value,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {})
      };

      const token = localStorage.getItem('token');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      // POST con token de autorización
      this.http.post('http://192.168.1.12:8000/items/', payload, { headers }).subscribe({
        next: () => {
          this.snackBar.open('Publicación exitosa :3', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard']); // Redirige feed
        },
        error: (err) => {
          console.error('Error al subir la foto', err);
          this.snackBar.open('Error al publicar la foto, intentelo de nuevo más tarde :3', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}