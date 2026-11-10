import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../shared/icon.component';
import { whatsappUrl } from '../../data';
import { CatalogosService, Cotizacion, Zona } from '../../core/catalogos.service';
import { ListaCotizacionService } from '../../core/lista-cotizacion.service';
import { PedidosService } from '../../core/pedidos.service';
import { httpError } from '../../core/api.interceptor';
import { LineaLista, detalleLinea, dinero, importe, itemsApi, subtotalLocal, tituloLinea } from '../quote/calculadora';
import { PASOS_PEDIDO, numeroDePaso } from '../quote/pasos';
import { ZonaInfo, infoZona } from '../quote/zonas';
import { fechaISO, franjaDe } from '../pedidos/pedidos';
import { DIRECCION_EJEMPLO, DIRECCION_MAX, EstadoDireccion, estadoDireccion, normalizarDireccion } from './direccion';

interface Dia { etiqueta: string; numero: number; fecha: Date; }

/**
 * Pedido en 2 pasos, a partir de la lista armada en la calculadora (/cotizar):
 *   1. ¿Dónde y cuándo?  (zona ya elegida + dirección exacta + fecha y hora)
 *   2. Resumen            (el total lo confirma el servidor)
 * Al confirmar, el pedido se guarda en la API y la persona pasa a "Mis pedidos".
 */
@Component({
  selector: 'app-cotizar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IconComponent],
  templateUrl: './cotizar.page.html',
  styleUrls: ['./cotizar.page.scss'],
})
export class CotizarPage {
  private api = inject(CatalogosService);
  private lista = inject(ListaCotizacionService);
  private pedidos = inject(PedidosService);
  private router = inject(Router);

  readonly totalPasos = 2;
  /** Los pasos de todo el pedido (los dos primeros se hicieron en «Cotizar»). */
  readonly pasosPedido = PASOS_PEDIDO;
  /** Número de paso del pedido completo (3 = Agenda, 4 = Resumen). */
  get numeroPaso(): number { return numeroDePaso(this.paso); }
  paso = 1;

  readonly dinero = dinero;
  readonly detalleDe = detalleLinea;
  readonly tituloDe = tituloLinea;
  readonly importeDe = importe;

  zonas: Zona[] = [];
  cargando = false;
  errorCarga = '';

  direccion = '';
  readonly direccionEjemplo = DIRECCION_EJEMPLO;
  readonly direccionMax = DIRECCION_MAX;
  readonly dias: Dia[] = this.proximosDias(5);
  dia: Dia = this.dias[2]!;
  readonly horas = ['7:30', '10:00', '12:30', '2:00'];
  hora = '10:00';

  resultado: Cotizacion | null = null;
  calculando = false;
  errorCalculo = '';
  private secuencia = 0;

  enviando = false;
  errorEnvio = '';

  ionViewWillEnter(): void { void this.cargar(); }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.errorCarga = '';
    try { this.zonas = await firstValueFrom(this.api.zonas()); }
    catch (error) { this.errorCarga = httpError(error); }
    finally { this.cargando = false; }
  }

  // ----- Datos derivados -----
  get lineas(): LineaLista[] { return this.lista.lineas(); }
  get zonaActual(): Zona | undefined { return this.zonas.find((z) => z.id_zona === this.lista.idZona()); }
  get infoZona(): ZonaInfo | null { return this.zonaActual ? infoZona(this.zonaActual) : null; }
  get subtotalLocal(): number { return subtotalLocal(this.lineas); }
  get estadoDireccion(): EstadoDireccion { return estadoDireccion(this.direccion); }
  get direccionValida(): boolean { return this.estadoDireccion.valida; }
  get direccionLimpia(): string { return normalizarDireccion(this.direccion); }
  get puedeContinuar(): boolean { return this.direccionValida && !!this.zonaActual; }
  get puedeConfirmar(): boolean { return !!this.resultado && !this.calculando && !this.enviando && this.puedeContinuar; }
  get fechaLarga(): string {
    return this.dia.fecha.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  /** Mensaje para el asesor con lo que la persona ya armó. */
  get whatsapp(): string | null {
    const lista = this.lineas.map((l) => `${l.cantidad} × ${l.tarifa.tipo_item}`).join(', ');
    return whatsappUrl(lista || 'una cotización');
  }

  // ----- Navegación -----
  siguiente(): void {
    if (this.paso === 1 && !this.puedeContinuar) return;
    if (this.paso < this.totalPasos) this.paso++;
    if (this.paso === 2) void this.calcular();
  }
  anterior(): void { if (this.paso > 1) this.paso--; }

  // ----- Total confirmado por el servidor -----
  async calcular(): Promise<void> {
    const zona = this.zonaActual;
    if (!zona || this.lineas.length === 0) return;
    const turno = ++this.secuencia;
    this.calculando = true;
    this.errorCalculo = '';
    this.resultado = null;
    try {
      const r = await firstValueFrom(this.api.cotizarItems(zona.id_zona, itemsApi(this.lineas)));
      if (turno === this.secuencia) this.resultado = r;
    } catch (error) {
      if (turno === this.secuencia) this.errorCalculo = httpError(error);
    } finally { if (turno === this.secuencia) this.calculando = false; }
  }

  // ----- Guardar el pedido -----
  async confirmar(): Promise<void> {
    const zona = this.zonaActual;
    if (!this.puedeConfirmar || !zona) return;
    this.enviando = true;
    this.errorEnvio = '';
    try {
      await firstValueFrom(this.pedidos.crear({
        id_zona: zona.id_zona,
        direccion: this.direccionLimpia,
        fecha_servicio: fechaISO(this.dia.fecha),
        franja_horaria: franjaDe(this.hora),
        items: itemsApi(this.lineas),
      }));
      // Pedido guardado: se limpia todo para el siguiente y se lleva a "Mis pedidos".
      this.lista.vaciar();
      this.lista.fijarZona(null);
      this.direccion = '';
      this.resultado = null;
      this.paso = 1;
      await this.router.navigateByUrl('/pedidos');
    } catch (error) {
      this.errorEnvio = httpError(error);
    } finally { this.enviando = false; }
  }

  private proximosDias(n: number): Dia[] {
    const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return Array.from({ length: n }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i + 1);
      return { etiqueta: nombres[fecha.getDay()]!, numero: fecha.getDate(), fecha };
    });
  }
}
