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
  selector: 'app-register',

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

  templateUrl: './register.html',

  styleUrl: './register.scss'
})
export class Register {

  private fb = inject(FormBuilder);

  private authService = inject(AuthService);

  private router = inject(Router);

  private snackBar = inject(MatSnackBar);


  isLoading = false;


  registerForm = this.fb.nonNullable.group({

    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],

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
        Validators.required,
        Validators.minLength(6)
      ]
    ],

    confirmPassword: [
      '',
      [
        Validators.required
      ]
    ]

  });


  register() {

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

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
      this.registerForm.getRawValue();


    if (
      formValue.password !==
      formValue.confirmPassword
    ) {

      this.snackBar.open(
        'Las contraseñas no coinciden',
        'Cerrar',
        {
          duration: 3000
        }
      );

      return;
    }


    this.isLoading = true;


    this.authService.register({

      username: formValue.username,

      email: formValue.email,

      password: formValue.password

    }).subscribe({

      next: () => {

        this.isLoading = false;

        this.snackBar.open(
          'Usuario registrado correctamente',
          'Cerrar',
          {
            duration: 3000
          }
        );

        this.router.navigate(['/login']);

      },

      error: (error) => {

        this.isLoading = false;

        const message =
          error?.error?.detail ??
          'No fue posible registrar el usuario';


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