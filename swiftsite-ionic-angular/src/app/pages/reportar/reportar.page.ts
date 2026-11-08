import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../shared/icon.component';
import { PedidosService } from '../../core/pedidos.service';
import { ReportesService } from '../../core/reportes.service';
import { SessionService } from '../../core/session.service';
import { httpError } from '../../core/api.interceptor';
import { PedidoApi, PedidoVista, aVista, numeroPedido } from '../pedidos/pedidos';
import { CosaReportada, DESCRIPCION_MAX, MOTIVOS, MotivoReporte, ReporteApi, contactoDe, cosaDelPedido, ejemploDe, estadoFormulario, fechaCorta, limpiarDescripcion, numeroReporte, preguntaGuia, reporteAbierto, reporteResuelto } from './reportar';

/** Reportar un problema de un pedido finalizado (/reportar/:id). Al enviar, la misma pantalla muestra la confirmación. */
@Component({
  selector: 'app-reportar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IconComponent],
  templateUrl: './reportar.page.html',
  styleUrls: ['./reportar.page.scss'],
})
export class ReportarPage {
  private route = inject(ActivatedRoute);
  private pedidos = inject(PedidosService);
  private reportes = inject(ReportesService);
  private session = inject(SessionService);

  readonly motivos = MOTIVOS;
  readonly max = DESCRIPCION_MAX;
  readonly numeroPedido = numeroPedido;
  readonly numeroReporte = numeroReporte;
  readonly fechaCorta = fechaCorta;

  pedido: PedidoApi | null = null;
  /** Reporte de este pedido que sigue abierto: si existe, se avisa en vez de mostrar el formulario. */
  previo: ReporteApi | null = null;
  /** Último reporte resuelto de este pedido: se muestra la respuesta del equipo. */
  resuelto: ReporteApi | null = null;
  vista: PedidoVista | null = null;
  cargando = true;
  errorCarga = '';

  motivo: MotivoReporte | null = null;
  descripcion = '';
  enviando = false;
  errorEnvio = '';
  /** Reporte ya enviado (muestra la pantalla de confirmación). */
  enviado: ReporteApi | null = null;

  get formulario() { return estadoFormulario(this.motivo, this.descripcion); }
  get cosa(): CosaReportada { return cosaDelPedido(this.pedido?.lineas ?? []); }
  get guia(): string { return preguntaGuia(this.motivo, this.cosa); }
  get ejemplo(): string { return ejemploDe(this.motivo, this.cosa); }
  get largo(): number { return limpiarDescripcion(this.descripcion).length; }
  get contacto(): string {
    const u = this.session.usuario();
    return contactoDe(u?.telefono, u?.correo);
  }

  ionViewWillEnter(): void { void this.cargar(); }

  async cargar(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargando = true;
    this.errorCarga = '';
    this.enviado = null;
    this.previo = null;
    this.resuelto = null;
    this.errorEnvio = '';
    if (!Number.isInteger(id) || id <= 0) { this.errorCarga = 'No encontramos ese pedido.'; this.cargando = false; return; }
    try {
      const [pedido, reportes] = await Promise.all([
        firstValueFrom(this.pedidos.uno(id)),
        // Si no se puede leer la lista, igual se deja intentar: el servidor es quien impide el duplicado.
        firstValueFrom(this.reportes.mios()).catch((): ReporteApi[] => []),
      ]);
      this.pedido = pedido;
      this.previo = reporteAbierto(reportes, pedido.id_pedido);
      this.resuelto = reporteResuelto(reportes, pedido.id_pedido);
      this.vista = aVista(this.pedido);
      if (this.pedido.estado !== 'Finalizado') this.errorCarga = 'Solo puedes reportar un problema cuando el pedido ya está finalizado.';
    } catch (error) {
      this.pedido = null;
      this.vista = null;
      this.errorCarga = httpError(error);
    } finally { this.cargando = false; }
  }

  private async revisarPrevio(): Promise<void> {
    if (!this.pedido) return;
    try { this.previo = reporteAbierto(await firstValueFrom(this.reportes.mios()), this.pedido.id_pedido); } catch { /* el mensaje del servidor ya se muestra */ }
  }

  elegir(motivo: MotivoReporte): void { this.motivo = motivo; this.errorEnvio = ''; }

  async enviar(): Promise<void> {
    if (!this.pedido || !this.motivo || !this.formulario.valido || this.enviando) return;
    this.enviando = true;
    this.errorEnvio = '';
    try {
      this.enviado = await firstValueFrom(this.reportes.enviar({
        id_pedido: this.pedido.id_pedido,
        motivo: this.motivo,
        descripcion: limpiarDescripcion(this.descripcion),
      }));
    } catch (error) {
      this.errorEnvio = httpError(error);
      // Si el servidor dice que ya hay uno abierto (por ejemplo, se envió desde otro lado), vuelve a consultar y muestra el aviso.
      if (error instanceof HttpErrorResponse && error.status === 422) void this.revisarPrevio();
    } finally { this.enviando = false; }
  }
}
