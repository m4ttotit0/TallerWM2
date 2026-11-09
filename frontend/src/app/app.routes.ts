import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { DashboardComponent } from './pages/dashboard/dashboard';
<<<<<<< HEAD
import { ItemsComponent } from './pages/items/items';

import { authGuard } from './guards/auth.guard';
=======
>>>>>>> 7ec4cfe (Actualizacion de login y registro)

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'feed',
    component: DashboardComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
<<<<<<< HEAD

  {
    path: 'login',
    component: Login
  },

  {
    path: 'register',
    component: Register
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  {
    path: 'items',
    component: ItemsComponent,
    canActivate: [authGuard]
  },

=======
>>>>>>> 7ec4cfe (Actualizacion de login y registro)
  {
    path: '**',
    redirectTo: 'login'
  }
];