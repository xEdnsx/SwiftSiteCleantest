import { Injectable, signal } from '@angular/core';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: { nombre_rol: string };
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly usuario = signal<Usuario | null>(null);
  get token(): string | null { return sessionStorage.getItem('swiftsite.cliente.token'); }
  save(token: string): void { sessionStorage.setItem('swiftsite.cliente.token', token); }
  clear(): void {
    sessionStorage.removeItem('swiftsite.cliente.token');
    this.usuario.set(null);
  }
}
