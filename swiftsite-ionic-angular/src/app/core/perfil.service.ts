import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionService, Usuario } from './session.service';

/** Operaciones sobre la cuenta de la persona con sesión (todas contra /api/me). */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);
  private session = inject(SessionService);

  async actualizar(nombre: string, telefono: string): Promise<void> {
    const usuario = await firstValueFrom(this.http.patch<Usuario>(`${environment.apiUrl}/me`, {
      nombre: nombre.trim(), telefono: telefono.trim() || null,
    }));
    this.session.usuario.set(usuario);
  }

  async cambiarClave(actual: string, nueva: string, confirmacion: string): Promise<void> {
    await firstValueFrom(this.http.put(`${environment.apiUrl}/me/password`, {
      current_password: actual, password: nueva, password_confirmation: confirmacion,
    }));
  }

  /** Elimina la cuenta. La API pide la contraseña y rechaza (409) si hay pedidos en curso. */
  async eliminar(password: string): Promise<void> {
    await firstValueFrom(this.http.request('DELETE', `${environment.apiUrl}/me`, { body: { password } }));
    this.session.clear();
  }
}
