import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Router } from '@angular/router';

import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private router = inject(Router);

  private apiUrl = 'http://localhost:8000';

  token = signal<string | null>(
    localStorage.getItem('token')
  );


  register(user: {
    username: string;
    email: string;
    password: string;
  }) {

    return this.http.post(
      `${this.apiUrl}/users/`,
      user
    );
  }


  login(credentials: {
    username: string;
    password: string;
  }) {

    const body = new HttpParams()
      .set('username', credentials.username)
      .set('password', credentials.password);

    return this.http.post<{
      access_token: string;
      token_type: string;
    }>(
      `${this.apiUrl}/login`,
      body.toString(),
      {
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded'
        }
      }
    ).pipe(

      tap(response => {

        localStorage.setItem(
          'token',
          response.access_token
        );

        this.token.set(
          response.access_token
        );

      })

    );
  }

  logout() {

    localStorage.removeItem('token');

    this.token.set(null);

    this.router.navigate(['/login']);
  }


  isAuthenticated(): boolean {

    return !!this.token();

  }


  getCurrentUser() {

    return this.http.get(
      `${this.apiUrl}/users/me`
    );

  }

}