import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import { httpError } from '../../core/api.interceptor';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-auth', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IconComponent],
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  register = this.route.snapshot.data['register'] === true;
  datos = { nombre: '', correo: '', telefono: '', password: '', password_confirmation: '', acepta_terminos: false };
  busy = false;
  error = '';
  verClave = false;
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
      await this.router.navigateByUrl(target === '/pedidos' || target === '/perfil' || target === '/cotizar/pedido' ? target : '/perfil', { replaceUrl: true });
    } catch (error) { this.error = httpError(error); }
    finally { this.busy = false; }
  }
}
