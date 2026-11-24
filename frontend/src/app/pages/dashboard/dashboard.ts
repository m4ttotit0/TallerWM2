import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import * as QRCode from 'qrcode';
import {
  BarcodeScanner,
  BarcodeFormat
} from '@capacitor-mlkit/barcode-scanning';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8000';

  photos = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  currentUser = signal<any>(null);
  qrImage = signal<string>('');

  perfilEncontrado = signal<any>(null);
  errorQR = signal<string>('');

  ngOnInit() {
    this.cargarFotos();
    this.cargarUsuario();
  }

  // CARGAR PUBLICACIONES
  cargarFotos() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>(`${this.apiUrl}/items/`, { headers }).subscribe({
      next: (data) => {
        this.photos.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error de carga', err);
        this.errorMessage.set(
          'No se pudieron cargar las publicaciones.'
        );
        this.isLoading.set(false);
      }
    });
  }

  // CARGAR DATOS DEL USUARIO Y GENERAR QR
  cargarUsuario() {
    this.http.get<any>(`${this.apiUrl}/users/me`).subscribe({
      next: async (user) => {
        this.currentUser.set(user);

        const contenidoQR = `PHOTOFLOW_USER:${user.id}`;

        try {
          const imagen = await QRCode.toDataURL(contenidoQR, {
            width: 220,
            margin: 2
          });

          this.qrImage.set(imagen);

        } catch (error) {
          console.error('Error al generar QR', error);
        }
      },
      error: (err) => {
        console.error('Error al obtener usuario', err);
      }
    });
  }

  // ESCANEAR QR
  async escanearQR() {
    this.errorQR.set('');
    this.perfilEncontrado.set(null);

    try {
      // Comprobar si el escáner está disponible
      const { available } =
        await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();

      if (!available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule();

        this.errorQR.set(
          'Se está instalando el módulo de escaneo. Intenta nuevamente en unos momentos.'
        );

        return;
      }

      // Abrir el escáner
      const resultado = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode]
      });

      if (resultado.barcodes.length === 0) {
        this.errorQR.set('No se detectó ningún código QR.');
        return;
      }

      const contenido = resultado.barcodes[0].rawValue;

      // Comprobar que el QR tenga contenido
      if (!contenido) {
        this.errorQR.set('No se pudo leer el contenido del código QR.');
        return;
      }

      // Comprobar que sea un QR de PhotoFlow
      const coincidencia = contenido.match(/^PHOTOFLOW_USER:(\d+)$/);

      if (!coincidencia) {
        this.errorQR.set('Este código QR no pertenece a PhotoFlow.');
        return;
      }

      const userId = Number(coincidencia[1]);

      // Buscar el perfil en el backend
      this.http.get<any>(
        `${this.apiUrl}/users/${userId}/profile`
      ).subscribe({
        next: (perfil) => {
          this.perfilEncontrado.set(perfil);
        },
        error: (err) => {
          console.error('Error al buscar perfil', err);
          this.errorQR.set('No se pudo encontrar este usuario.');
        }
      });

    } catch (error) {
      console.error('Error al escanear QR', error);
      this.errorQR.set(
        'No se pudo abrir el escáner. Revisa los permisos y vuelve a intentarlo.'
      );
    }
  }

  // CERRAR PERFIL ENCONTRADO
  cerrarPerfil() {
    this.perfilEncontrado.set(null);
  }
}
