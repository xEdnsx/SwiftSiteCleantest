import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionService, Usuario } from './session.service';

interface TokenResponse { usuario: Usuario; token: string; }
export interface Registro { nombre: string; correo: string; telefono: string; password: string; password_confirmation: string; acepta_terminos: boolean; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  readonly session = inject(SessionService);
  private pending?: Promise<boolean>;

  async login(correo: string, password: string): Promise<void> {
    this.session.clear();
    const data = await firstValueFrom(this.http.post<TokenResponse>(`${environment.apiUrl}/login`, {
      correo, password, portal: 'cliente', device_name: 'swiftsite-ionic',
    }));
    await this.accept(data);
  }

  async register(form: Registro): Promise<void> {
    this.session.clear();
    const data = await firstValueFrom(this.http.post<TokenResponse>(`${environment.apiUrl}/register`, {
      ...form, telefono: form.telefono || null, device_name: 'swiftsite-ionic',
    }));
    await this.accept(data);
  }

  private async accept(data: TokenResponse): Promise<void> {
    this.session.save(data.token);
    if (data.usuario.rol?.nombre_rol !== 'Cliente') {
      try { await this.logout(); } finally { this.session.clear(); }
      throw new Error('Esta aplicacion es exclusiva para clientes.');
    }
    this.session.usuario.set(data.usuario);
  }

  verify(): Promise<boolean> {
    if (!this.session.token) return Promise.resolve(false);
    if (!this.pending) this.pending = this.verifyUser().finally(() => { this.pending = undefined; });
    return this.pending;
  }

  private async verifyUser(): Promise<boolean> {
    const usuario = await firstValueFrom(this.http.get<Usuario>(`${environment.apiUrl}/me`));
    if (usuario.rol?.nombre_rol !== 'Cliente') {
      this.session.clear();
      throw new Error('Esta aplicacion es exclusiva para clientes.');
    }
    this.session.usuario.set(usuario);
    return true;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/logout`, {}));
    this.session.clear();
  }
}
