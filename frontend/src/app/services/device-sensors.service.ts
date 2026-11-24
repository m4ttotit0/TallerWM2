import { Injectable, signal } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Motion, AccelListenerEvent } from '@capacitor/motion';
import { PluginListenerHandle } from '@capacitor/core';

export interface Coordenadas {
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceSensorsService {
  coordenadas = signal<Coordenadas | null>(null);
  agitado = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  private motionListener: PluginListenerHandle | null = null;
  private readonly umbralAgite = 18; // Ajustable según sensibilidad deseada

  async obtenerUbicacion(): Promise<Coordenadas | null> {
    this.errorMensaje.set(null);

    try {
      let permisos = await Geolocation.checkPermissions();

      if (permisos.location === 'denied') {
        this.errorMensaje.set(
          'El permiso de ubicación fue denegado. Actívalo en los ajustes de Android para asociar el lugar a tu foto.'
        );
        return null;
      }

      if (permisos.location !== 'granted') {
        permisos = await Geolocation.requestPermissions();
        if (permisos.location !== 'granted') {
          this.errorMensaje.set(
            'No se otorgó permiso de GPS. Puedes publicar la foto sin ubicación o reintentar.'
          );
          return null;
        }
      }

      const posicion: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const coords: Coordenadas = {
        lat: posicion.coords.latitude,
        lng: posicion.coords.longitude
      };

      this.coordenadas.set(coords);
      return coords;
    } catch (err: any) {
      const detalle = err?.message || 'Error desconocido al obtener la ubicación.';
      this.errorMensaje.set(`GPS no disponible o sin señal: ${detalle}`);
      return null;
    }
  }

  async iniciarSensorAcelerometro(onShake?: () => void): Promise<void> {
    this.errorMensaje.set(null);
    await this.detenerSensorAcelerometro();

    try {
      this.motionListener = await Motion.addListener('accel', (event: AccelListenerEvent) => {
        const { x = 0, y = 0, z = 0 } = event.acceleration || {};
        const magnitud = Math.sqrt(x * x + y * y + z * z);

        if (magnitud > this.umbralAgite) {
          this.agitado.set(true);
          if (onShake) {
            onShake();
          }
        }
      });
    } catch (err: any) {
      this.errorMensaje.set(
        'El sensor de acelerómetro no está disponible o fue bloqueado en este dispositivo.'
      );
    }
  }

  async detenerSensorAcelerometro(): Promise<void> {
    if (this.motionListener) {
      await this.motionListener.remove();
      this.motionListener = null;
    }
  }
}