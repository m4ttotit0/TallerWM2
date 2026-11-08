import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' }) //Singleton
export class AuthService {
  private http = inject(HttpClient); //FastAPI
  private router = inject(Router); //Esto es sólo para rederigir
  
  private apiUrl = 'http://localhost:8000';
  
  // Signal de estado global para el token / usuario
  token = signal<string | null>(localStorage.getItem('token'));

//Inicio sesion
  login(credentials: any) {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`,formData).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        this.token.set(res.access_token);
      })
    );
  }

//Cerrar sesión
  logout() {
    localStorage.removeItem('token');
    this.token.set(null);
    this.router.navigate(['/login']);
  }

//Esto es sólo para verificar
  isAuthenticated(): boolean {
    return !!this.token(); //El !! convierte cualquier valor a booleano
  }
}