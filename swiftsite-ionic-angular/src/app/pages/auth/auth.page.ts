import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import { httpError } from '../../core/api.interceptor';

@Component({
  selector: 'app-auth', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonHeader, IonToolbar],
  template: `<ion-header><ion-toolbar><a routerLink="/inicio" class="client-back">SwiftSite Clean · Inicio</a></ion-toolbar></ion-header>
  <ion-content><main class="client-panel"><h1>{{ register ? 'Crear cuenta' : 'Iniciar sesion' }}</h1>
    <p>Aplicacion exclusiva para clientes.</p>
    <form #form="ngForm" (ngSubmit)="submit()">
      <label *ngIf="register">Nombre<input name="nombre" [(ngModel)]="datos.nombre" required maxlength="120" autocomplete="name"></label>
      <label *ngIf="register">Telefono (opcional)<input name="telefono" [(ngModel)]="datos.telefono" maxlength="25" autocomplete="tel" type="tel"></label>
      <label>Correo<input type="email" name="correo" [(ngModel)]="datos.correo" required email maxlength="150" autocomplete="username"></label>
      <label>Contrasena<input type="password" name="password" [(ngModel)]="datos.password" required [minlength]="register ? 8 : 1" maxlength="72" [attr.autocomplete]="register ? 'new-password' : 'current-password'"></label>
      <label *ngIf="register">Confirmar contrasena<input type="password" name="confirmacion" [(ngModel)]="datos.password_confirmation" required autocomplete="new-password"></label>
      <p *ngIf="error" role="alert" class="client-error">{{ error }}</p>
      <button type="submit" [disabled]="busy || form.invalid">{{ busy ? 'Conectando...' : register ? 'Registrarme' : 'Entrar' }}</button>
    </form>
    <p><a [routerLink]="register ? '/login' : '/registro'">{{ register ? 'Ya tengo cuenta' : 'Crear una cuenta' }}</a></p>
    <a routerLink="/inicio">Continuar como invitado</a>
  </main></ion-content>`,
})
export class AuthPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  register = this.route.snapshot.data['register'] === true;
  datos = { nombre: '', correo: '', telefono: '', password: '', password_confirmation: '' };
  busy = false;
  error = '';
  ionViewDidLeave(): void { this.datos.password = this.datos.password_confirmation = ''; }
  async submit(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      if (this.register) await this.auth.register(this.datos);
      else await this.auth.login(this.datos.correo, this.datos.password);
      this.datos.password = this.datos.password_confirmation = '';
      const target = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(target === '/pedidos' || target === '/perfil' ? target : '/perfil', { replaceUrl: true });
    } catch (error) { this.error = httpError(error); }
    finally { this.busy = false; }
  }
}
