import {
  Component,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  MatCardModule
} from '@angular/material/card';

import {
  MatFormFieldModule
} from '@angular/material/form-field';

import {
  MatInputModule
} from '@angular/material/input';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';

import {
  AuthService
} from '../../services/auth.service';


@Component({
  selector: 'app-login',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink,

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],

  templateUrl: './login.html',

  styleUrl: './login.scss'
})
export class Login {

  private fb = inject(FormBuilder);

  private authService = inject(AuthService);

  private router = inject(Router);

  private snackBar = inject(MatSnackBar);


  isLoading = false;


  loginForm = this.fb.nonNullable.group({

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    password: [
      '',
      [
        Validators.required
      ]
    ]

  });


  login() {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      this.snackBar.open(
        'Completa correctamente el formulario',
        'Cerrar',
        {
          duration: 3000
        }
      );

      return;
    }


    const formValue =
      this.loginForm.getRawValue();


    this.isLoading = true;


    this.authService.login({

      username: formValue.email,

      password: formValue.password

    }).subscribe({

      next: () => {

        this.isLoading = false;

        this.snackBar.open(
          'Inicio de sesión correcto',
          'Cerrar',
          {
            duration: 2000
          }
        );

        this.router.navigate(['/dashboard']);

      },

      error: (error) => {

        this.isLoading = false;

        const message =
          error?.error?.detail ??
          'Correo o contraseña incorrectos';


        this.snackBar.open(
          message,
          'Cerrar',
          {
            duration: 4000
          }
        );

      }

    });

  }

}