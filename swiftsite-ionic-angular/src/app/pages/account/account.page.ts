import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import { PerfilService } from '../../core/perfil.service';
import { PedidosService } from '../../core/pedidos.service';
import { ReportesService } from '../../core/reportes.service';
import { ValoracionesService } from '../../core/valoraciones.service';
import { httpError } from '../../core/api.interceptor';
import { IconComponent } from '../../shared/icon.component';
import { whatsappMensaje, whatsappUrl } from '../../data';
import { Tema, elegirTema, temaActual } from '../../core/tema';
import { PREGUNTAS_FRECUENTES } from './faq';
import { LEGAL_VERSION } from '../legal/legal';
import {
  ErroresClave, ErroresDatos, EstadisticasPerfil, direccionesUsadas, estadisticas, evaluarClave,
  hayErrores, iniciales, validarCambioClave, validarDatos,
} from './perfil';

type Vista = 'perfil' | 'editar' | 'clave' | 'direcciones' | 'faq' | 'eliminar';

@Component({
  selector: 'app-account', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IconComponent],
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
})
export class AccountPage {
  readonly auth = inject(AuthService);
  private perfil = inject(PerfilService);
  private pedidosApi = inject(PedidosService);
  private reportesApi = inject(ReportesService);
  private valoracionesApi = inject(ValoracionesService);
  private router = inject(Router);

  readonly version = LEGAL_VERSION;
  readonly whatsapp = whatsappUrl();
  readonly reportar = whatsappMensaje('Hola SwiftSite Clean 👋\nQuiero reportar un problema con mi servicio.');
  readonly preguntas = PREGUNTAS_FRECUENTES;
  readonly iniciales = iniciales;
  readonly evaluarClave = evaluarClave;

  vista: Vista = 'perfil';
  stats: EstadisticasPerfil | null = null;
  direcciones: string[] = [];
  oscuro = temaActual() === 'oscuro';
  valoraciones: number | null = null;
  reportes: number | null = null;
  busy = false;
  error = '';
  ok = '';

  // Editar
  datos = { nombre: '', telefono: '' };
  erroresDatos: ErroresDatos = {};

  // Cambiar contraseña
  clave = { actual: '', nueva: '', confirmacion: '' };
  erroresClave: ErroresClave = {};
  verClave = false;

  // Eliminar cuenta
  passwordEliminar = '';

  get usuario() { return this.auth.session.usuario(); }

  /** Ionic reutiliza las pestañas: refresca las cifras cada vez que se vuelve a entrar. */
  ionViewWillEnter(): void {
    this.oscuro = temaActual() === 'oscuro';
    this.cerrarVista();
    this.stats = null;
    this.direcciones = [];
    this.valoraciones = this.reportes = null;
    const owner = this.usuario?.id_usuario;
    this.pedidosApi.mios().subscribe({
      next: pedidos => {
        if (this.usuario?.id_usuario !== owner) return;
        this.stats = estadisticas(pedidos); this.direcciones = direccionesUsadas(pedidos);
      },
      error: () => { this.stats = null; this.direcciones = []; },
    });
    this.reportesApi.mios().subscribe({
      next: reportes => { if (this.usuario?.id_usuario === owner) this.reportes = reportes.length; },
      error: () => { this.reportes = null; },
    });
    this.valoracionesApi.mias().subscribe({
      next: valoraciones => { if (this.usuario?.id_usuario === owner) this.valoraciones = valoraciones.length; },
      error: () => { this.valoraciones = null; },
    });
  }

  abrir(vista: Vista): void {
    this.error = ''; this.ok = '';
    this.erroresDatos = {}; this.erroresClave = {};
    this.verClave = false;
    this.clave = { actual: '', nueva: '', confirmacion: '' };
    this.passwordEliminar = '';
    if (vista === 'editar') this.datos = { nombre: this.usuario?.nombre ?? '', telefono: this.usuario?.telefono ?? '' };
    this.vista = vista;
  }

  cerrarVista(): void { this.abrir('perfil'); }

  cambiarTema(): void {
    const tema: Tema = this.oscuro ? 'claro' : 'oscuro';
    elegirTema(tema);
    this.oscuro = tema === 'oscuro';
  }

  async guardarDatos(): Promise<void> {
    if (this.busy) return;
    this.erroresDatos = validarDatos(this.datos.nombre, this.datos.telefono);
    if (hayErrores(this.erroresDatos)) return;
    await this.ejecutar(async () => {
      await this.perfil.actualizar(this.datos.nombre, this.datos.telefono);
      this.cerrarVista();
      this.ok = 'Tus datos se guardaron.';
    });
  }

  async guardarClave(): Promise<void> {
    if (this.busy) return;
    this.erroresClave = validarCambioClave(this.clave.actual, this.clave.nueva, this.clave.confirmacion);
    if (hayErrores(this.erroresClave)) return;
    await this.ejecutar(async () => {
      await this.perfil.cambiarClave(this.clave.actual, this.clave.nueva, this.clave.confirmacion);
      this.cerrarVista();
      this.ok = 'Tu contraseña se actualizó. Cerramos tus otras sesiones.';
    });
  }

  async eliminarCuenta(): Promise<void> {
    if (this.busy) return;
    if (!this.passwordEliminar) { this.error = 'Escribe tu contraseña para confirmar.'; return; }
    await this.ejecutar(async () => {
      await this.perfil.eliminar(this.passwordEliminar);
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    });
  }

  async logout(): Promise<void> {
    await this.ejecutar(async () => {
      await this.auth.logout();
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    });
  }

  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    this.busy = true;
    this.error = '';
    try { await accion(); }
    catch (error) { this.error = httpError(error); }
    finally { this.busy = false; }
  }
}
