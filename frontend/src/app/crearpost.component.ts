import { Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DeviceSensorsService } from './services/device-sensors.service';

@Component({
  selector: 'app-crear-post',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  styles: [`
    .sensor-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .gps-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      background: #eef6ee;
      color: #1b5e20;
      font-size: 0.875rem;
      width: fit-content;
    }
    .error-box {
      padding: 8px 12px;
      border-radius: 8px;
      background: #fdecea;
      color: #b71c1c;
      font-size: 0.875rem;
    }
  `],
  template: `
    <div class="sensor-panel">
      <button mat-stroked-button type="button" (click)="capturarUbicacion()">
        <mat-icon>my_location</mat-icon>
        Obtener ubicación GPS
      </button>

      @if (mostrarCoordenadas() && sensors.coordenadas(); as coords) {
        <div class="gps-badge">
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">location_on</mat-icon>
          <span>Ubicación: {{ coords.lat | number:'1.4-4' }}, {{ coords.lng | number:'1.4-4' }}</span>
        </div>
      } @else if (!mostrarCoordenadas() && sensors.coordenadas()) {
        <div class="gps-badge">
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">check_circle</mat-icon>
          <span>Ubicación adjunta</span>
        </div>
      }

      @if (sensors.agitado()) {
        <div class="gps-badge">
          <span>¡Movimiento detectado! Filtro o modo aleatorio activado.</span>
        </div>
      }

      @if (sensors.errorMensaje(); as error) {
        <div class="error-box" role="alert">
          {{ error }}
        </div>
      }
    </div>
  `
})
export class CrearPostComponent implements OnInit, OnDestroy {
  protected sensors = inject(DeviceSensorsService);
  mostrarCoordenadas = input<boolean>(false);

  async ngOnInit(): Promise<void> {
    await this.sensors.iniciarSensorAcelerometro(() => {
      console.log('Acelerómetro activado en PhotoFlow');
    });
  }

  async capturarUbicacion(): Promise<void> {
    const coords = await this.sensors.obtenerUbicacion();
    if (coords) {
      console.log('Listo para enviar a FastAPI:', coords);
    }
  }

  async ngOnDestroy(): Promise<void> {
    await this.sensors.detenerSensorAcelerometro();
  }
}