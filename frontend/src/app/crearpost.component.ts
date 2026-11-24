import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceSensorsService } from './services/device-sensors.service';

@Component({
  selector: 'app-crear-post',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sensor-panel">
      <button type="button" (click)="capturarUbicacion()">Obtener ubicación GPS</button>

      @if (sensors.coordenadas(); as coords) {
        <p>Ubicación: {{ coords.lat | number:'1.4-4' }}, {{ coords.lng | number:'1.4-4' }}</p>
      }

      @if (sensors.agitado()) {
        <p>¡Movimiento detectado! Filtro o modo aleatorio activado.</p>
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

  async ngOnInit(): Promise<void> {
    await this.sensors.iniciarSensorAcelerometro(() => {
      // Ejemplo de flujo integrado: agitar para limpiar o alternar estado en la creación/feed
      console.log('Acelerómetro activado en PhotoFlow');
    });
  }

  async capturarUbicacion(): Promise<void> {
    const coords = await this.sensors.obtenerUbicacion();
    if (coords) {
      // Aquí incluyes coords.lat y coords.lng en el payload que envías a FastAPI
      console.log('Listo para enviar a FastAPI:', coords);
    }
  }

  async ngOnDestroy(): Promise<void> {
    await this.sensors.detenerSensorAcelerometro();
  }
}