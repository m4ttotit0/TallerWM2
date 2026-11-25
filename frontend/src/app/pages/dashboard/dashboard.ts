import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Capacitor } from '@capacitor/core';
import * as QRCode from 'qrcode';
import jsQR from 'jsqr';

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
export class DashboardComponent implements OnInit, OnDestroy {

  private http = inject(HttpClient);

  private apiUrl = 'http://192.168.1.12:8000';

  photos = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  currentUser = signal<any>(null);
  qrImage = signal<string>('');

  perfilEncontrado = signal<any>(null);
  errorQR = signal<string>('');
  escaneandoWeb = signal<boolean>(false);

  private streamWeb: MediaStream | null = null;
  private rafId: number | null = null;

  ngOnInit() {
    this.cargarFotos();
    this.cargarUsuario();
  }

  ngOnDestroy() {
    this.detenerEscaneoWeb();
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
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(`${this.apiUrl}/users/me`, { headers }).subscribe({
      next: async (user) => {
        this.currentUser.set(user);

        const contenidoQR = `PHOTOFLOW_USER:${user.id}`;

        try {
          const imagen = await QRCode.toDataURL(contenidoQR, {
            width: 250,
            margin: 2,
            color: {
              dark: '#542583',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
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

  // ASEGURAR PERMISO DE CÁMARA EN DISPOSITIVO NATIVO
  private async asegurarPermisoCamaraNativo(): Promise<boolean> {
    const { camera } = await BarcodeScanner.checkPermissions();

    if (camera === 'granted' || camera === 'limited') {
      return true;
    }

    if (camera === 'denied') {
      this.errorQR.set(
        'El permiso de cámara fue denegado. Actívalo en los ajustes de Android para escanear códigos QR.'
      );
      return false;
    }

    const solicitado = await BarcodeScanner.requestPermissions();
    const concedido =
      solicitado.camera === 'granted' || solicitado.camera === 'limited';

    if (!concedido) {
      this.errorQR.set(
        'No se otorgó permiso de cámara. Intenta nuevamente y acepta el permiso.'
      );
    }

    return concedido;
  }

  // PROCESAR CONTENIDO DEL QR Y BUSCAR PERFIL
  private procesarContenidoQR(contenido: string | undefined) {
    if (!contenido) {
      this.errorQR.set('No se pudo leer el contenido del código QR.');
      return;
    }

    const coincidencia = contenido.match(/^PHOTOFLOW_USER:(\d+)$/);

    if (!coincidencia) {
      this.errorQR.set('Este código QR no pertenece a PhotoFlow.');
      return;
    }

    const userId = Number(coincidencia[1]);
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(
      `${this.apiUrl}/users/${userId}/profile`,
      { headers }
    ).subscribe({
      next: (perfil) => {
        this.perfilEncontrado.set(perfil);
      },
      error: (err) => {
        console.error('Error al buscar perfil', err);
        this.errorQR.set('No se pudo encontrar este usuario.');
      }
    });
  }

  // ESCANEAR QR EN WEB CON CÁMARA DEL NAVEGADOR
  private async escanearQRWeb(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.errorQR.set('Este navegador no soporta acceso a la cámara.');
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      this.errorQR.set(
        'El acceso a la cámara web requiere HTTPS o localhost.'
      );
      return;
    }

    this.detenerEscaneoWeb();
    this.escaneandoWeb.set(true);

    try {
      this.streamWeb = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      const video = document.createElement('video');
      video.srcObject = this.streamWeb;
      video.setAttribute('playsinline', 'true');
      await video.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const tick = () => {
        if (!this.escaneandoWeb()) {
          return;
        }

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const codigo = jsQR(imageData.data, imageData.width, imageData.height);

          if (codigo?.data) {
            this.detenerEscaneoWeb();
            this.procesarContenidoQR(codigo.data);
            return;
          }
        }

        this.rafId = requestAnimationFrame(tick);
      };

      this.rafId = requestAnimationFrame(tick);
    } catch (err: any) {
      this.detenerEscaneoWeb();
      console.error('Error de cámara web:', err);
      this.errorQR.set(
        'No se pudo acceder a la cámara del navegador. Revisa los permisos.'
      );
    }
  }

  detenerEscaneoWeb() {
    this.escaneandoWeb.set(false);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.streamWeb) {
      this.streamWeb.getTracks().forEach((track) => track.stop());
      this.streamWeb = null;
    }
  }

  // ESCANEAR QR (NATIVO O WEB)
  async escanearQR() {
    this.errorQR.set('');
    this.perfilEncontrado.set(null);

    if (!Capacitor.isNativePlatform()) {
      await this.escanearQRWeb();
      return;
    }

    try {
      const tienePermiso = await this.asegurarPermisoCamaraNativo();
      if (!tienePermiso) {
        return;
      }

      const { available } =
        await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();

      if (!available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule();

        this.errorQR.set(
          'Se está instalando el módulo de escaneo. Intenta nuevamente en unos momentos.'
        );

        return;
      }

      const resultado = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode]
      });

      if (resultado.barcodes.length === 0) {
        this.errorQR.set('No se detectó ningún código QR.');
        return;
      }

      this.procesarContenidoQR(resultado.barcodes[0].rawValue);

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