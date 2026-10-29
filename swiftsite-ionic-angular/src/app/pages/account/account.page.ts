import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import { httpError } from '../../core/api.interceptor';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-account', standalone: true, imports: [CommonModule, IonContent, IconComponent],
  styleUrls: ['./account.page.scss'],
  template: `<ion-content>
    <main class="screen">
      <ng-container *ngIf="pedidos; else perfil"><h1>Mis pedidos</h1><p class="nota">El seguimiento de pedidos se implementará en el Sprint 3. Todavía no hay un listado conectado.</p></ng-container>
      <ng-template #perfil>
        <h1>Mi perfil</h1>
        <section class="perfil">
          <div class="avatar" aria-hidden="true"><ssc-icon name="profile" [size]="36" /></div>
          <p class="nombre">{{ auth.session.usuario()?.nombre }}</p>
          <p class="dato">{{ auth.session.usuario()?.correo }}</p>
          <p class="dato" *ngIf="auth.session.usuario()?.telefono">{{ auth.session.usuario()?.telefono }}</p>
        </section>
        <p *ngIf="error" class="error" role="alert">{{ error }}</p>
        <button class="btn-logout" [disabled]="busy" (click)="logout()">Cerrar sesión</button>
      </ng-template>
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
