import { Injectable, signal } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Motion, AccelListenerEvent } from '@capacitor/motion';

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
  private readonly umbralAgite = 18;

  private obtenerPosicionWeb(): Promise<Coordenadas> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Este navegador no soporta geolocalización.'));
        return;
      }

      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        reject(
          new Error('La geolocalización web requiere HTTPS o localhost. Prueba en localhost o en el APK.')
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error('Permiso de ubicación denegado en el navegador.'));
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            reject(new Error('Ubicación no disponible en este momento.'));
          } else if (err.code === err.TIMEOUT) {
            reject(new Error('Se agotó el tiempo de espera del GPS.'));
          } else {
            reject(new Error(err.message || 'No se pudo obtener la ubicación web.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  async obtenerUbicacion(): Promise<Coordenadas | null> {
    this.errorMensaje.set(null);

    try {
      if (!Capacitor.isNativePlatform()) {
        const coordsWeb = await this.obtenerPosicionWeb();
        this.coordenadas.set(coordsWeb);
        return coordsWeb;
      }

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