import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificamos si está autenticado
  if (authService.isAuthenticated()) {
    return true; //Acceso
  } else {
    // redirige al login
    router.navigate(['/login']);
    return false;
  }
};