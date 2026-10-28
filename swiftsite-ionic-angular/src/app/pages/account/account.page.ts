import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import { httpError } from '../../core/api.interceptor';

@Component({
  selector: 'app-account', standalone: true, imports: [CommonModule, IonContent, IonHeader, IonToolbar],
  template: `<ion-header><ion-toolbar><span class="client-back">{{ pedidos ? 'Mis pedidos' : 'Mi perfil' }}</span></ion-toolbar></ion-header>
    <ion-content><main class="client-panel">
      <ng-container *ngIf="pedidos; else perfil"><h1>Mis pedidos</h1><p>El seguimiento de pedidos se implementara en el Sprint 3. Todavia no hay un listado conectado.</p></ng-container>
      <ng-template #perfil><h1>{{ auth.session.usuario()?.nombre }}</h1><p>{{ auth.session.usuario()?.correo }}</p><p>{{ auth.session.usuario()?.telefono }}</p>
      <p *ngIf="error" class="client-error" role="alert">{{ error }}</p><button [disabled]="busy" (click)="logout()">Cerrar sesion</button></ng-template>
    </main></ion-content>`,
})
export class AccountPage {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  pedidos = inject(ActivatedRoute).snapshot.data['pedidos'] === true;
  busy = false;
  error = '';
  async logout(): Promise<void> {
    this.busy = true;
    try { await this.auth.logout(); await this.router.navigateByUrl('/inicio', { replaceUrl: true }); }
    catch (error) { this.error = httpError(error); }
    finally { this.busy = false; }
  }
}
