import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom, forkJoin } from 'rxjs';
import { CatalogosService, Categoria, Cotizacion, Tarifa, Zona } from '../../core/catalogos.service';
import { AuthService } from '../../core/auth.service';
import { ListaCotizacionService } from '../../core/lista-cotizacion.service';
import { httpError } from '../../core/api.interceptor';
import { IconComponent } from '../../shared/icon.component';
import { whatsappUrl } from '../../data';
import {
  CANTIDAD_MAX, CANTIDAD_MIN, ConfigCategoria, Estructura, LineaLista, Tipo,
  acotarCantidad, configDe, detalleLinea, dinero, estiloDeTipos, estructura, iconoValido, importe, itemsApi, nombreExtra, normalizar, precio, subtotalLocal, tituloLinea, unitario,
} from './calculadora';
import { Departamento, ZonaInfo, agruparPorDepartamento, infoZona, listaDistritos, zonasVigentes } from './zonas';

type Vista = 'categorias' | 'detalle' | 'lista';

/**
 * Cotización: catálogo y totales 100 % del servidor
 * (GET categorías/tarifas/zonas + POST /cotizaciones/preliminar). No crea pedidos.
 */
@Component({
  selector: 'app-quote',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IconComponent],
  templateUrl: './quote.page.html',
  styleUrls: ['./quote.page.scss'],
})
export class QuotePage {
  private api = inject(CatalogosService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private lista = inject(ListaCotizacionService);

  readonly dinero = dinero;
  readonly min = CANTIDAD_MIN;
  /** Enlace de WhatsApp (null si el número aún es el de ejemplo). */
  readonly asesorUrl = whatsappUrl();

  /** Pasos que ve la persona arriba; el 3.º (agenda) ocurre en la pantalla de pedido. */
  readonly pasos = ['Elige', 'Zona y total', 'Agenda'];
  vista: Vista = 'categorias';
  categorias: Categoria[] = [];
  private tarifas: Tarifa[] = [];
  zonas: Zona[] = [];
  departamentos: Departamento[] = [];
  departamentoSel = '';
  loading = false;
  ready = false;
  error = '';

  // ----- Detalle de una categoría -----
  categoria: Categoria | null = null;
  cfg: ConfigCategoria | null = null;
  est: Estructura = { tipos: [], extras: [] };
  tipo: Tipo | null = null;
  variante: Tarifa | null = null;
  extrasSel: number[] = [];
  cantidad = CANTIDAD_MIN;

  // ----- Lista y resultado del servidor -----
  idZona: number | null = null;
  resultado: Cotizacion | null = null;
  calculando = false;
  errorCalculo = '';
  cuentaAbierta = false;
  deptoAbierto = false;
  private secuencia = 0;

  ionViewWillEnter(): void { void this.load(); }

  // ----- Carga -----
  async load(): Promise<void> {
    this.loading = true;
    this.ready = false;
    this.error = '';
    try {
      const data = await firstValueFrom(forkJoin({ categorias: this.api.categorias(), tarifas: this.api.tarifas(), zonas: this.api.zonas() }));
      const conTarifas = new Set(data.tarifas.map((t: Tarifa) => t.id_categoria));
      this.categorias = data.categorias.filter((c: Categoria) => conTarifas.has(c.id_categoria));
      this.tarifas = data.tarifas.filter((t: Tarifa) => this.categorias.some((c) => c.id_categoria === t.id_categoria));
      this.zonas = zonasVigentes(data.zonas);
      this.lista.actualizar(this.tarifas);
      this.departamentos = agruparPorDepartamento(this.zonas);
      const guardada = this.lista.idZona();
      const inicial = this.zonas.find((z) => z.id_zona === (this.idZona ?? guardada)) ?? this.zonas.find((z) => Number(z.recargo) === 0) ?? this.zonas[0];
      this.idZona = inicial?.id_zona ?? null;
      this.departamentoSel = inicial ? infoZona(inicial).departamento : '';
      this.ready = this.categorias.length > 0 && this.zonas.length > 0;
      if (!this.ready) this.error = 'Todavía no hay servicios o zonas disponibles.';
      else this.abrirDesdeUrl();
    } catch (error) { this.error = httpError(error); }
    finally { this.loading = false; }
  }

  /** /cotizar?categoria=sillas abre directo esa categoría (para enlaces desde otras pantallas). */
  private abrirDesdeUrl(): void {
    if (this.vista !== 'categorias') return;
    if (this.route.snapshot.queryParamMap.get('vista') === 'lista' && this.lineas.length > 0) { this.verLista(); return; }
    const pedida = this.route.snapshot.queryParamMap.get('categoria');
    if (!pedida) return;
    const cat = this.categorias.find((c) => normalizar(c.nombre) === normalizar(pedida));
    if (cat) this.elegirCategoria(cat);
  }

  // ----- Datos derivados -----
  get paso(): number { return this.vista === 'lista' ? 2 : 1; }
  get lineas(): LineaLista[] { return this.lista.lineas(); }
  get zonaActual(): Zona | undefined { return this.zonas.find((z) => z.id_zona === this.idZona); }
  get zonaGratis(): boolean { return !!this.zonaActual && Number(this.zonaActual.recargo) === 0; }
  get infoZonaActual(): ZonaInfo | null { return this.zonaActual ? infoZona(this.zonaActual) : null; }
  get zonasDelDepartamento(): ZonaInfo[] { return this.departamentos.find((d) => d.nombre === this.departamentoSel)?.zonas ?? []; }
  listaDistritos = listaDistritos;
  get copiaCantidad(): { pregunta: string; etiqueta: string } { return { pregunta: this.cfg?.preguntaCantidad ?? '', etiqueta: this.cfg?.etiquetaCantidad ?? '' }; }
  /** Tope de unidades: lo define cada servicio (por defecto 99). */
  get max(): number { return this.cfg?.cantidadMax ?? CANTIDAD_MAX; }
  get estiloTipo(): 'chips' | 'tarjetas' { return estiloDeTipos(this.est.tipos.length); }
  get lineaActual(): LineaLista | null {
    if (!this.categoria || !this.cfg || !this.variante) return null;
    return {
      id_categoria: this.categoria.id_categoria, categoria: this.categoria.nombre, icono: this.cfg.icono,
      tarifa: this.variante, extras: this.est.extras.filter((e) => this.extrasSel.includes(e.id_tarifa)), cantidad: this.cantidad,
    };
  }
  get unitarioSel(): number { const l = this.lineaActual; return l ? unitario(l) : 0; }
  get importeSel(): number { const l = this.lineaActual; return l ? importe(l) : 0; }
  get subtotalLista(): number { return subtotalLocal(this.lineas); }
  get cantidadMin(): boolean { return this.cantidad <= CANTIDAD_MIN; }
  get cantidadMax(): boolean { return this.cantidad >= this.max; }
  get conVariantes(): boolean { return (this.tipo?.variantes.length ?? 0) > 1; }

  iconoDe(c: Categoria): ConfigCategoria['icono'] { return configDe(c).icono; }
  iconoLinea = (l: LineaLista) => iconoValido(l.icono);
  desdeDe(c: Categoria): number {
    const precios = this.tarifas.filter((t) => t.id_categoria === c.id_categoria && !t.tipo_item.toLowerCase().startsWith('extra:')).map((t) => precio(t));
    return precios.length ? Math.min(...precios) : 0;
  }
  etiquetaExtra(e: Tarifa): string { const n = nombreExtra(e); return n.charAt(0).toUpperCase() + n.slice(1); }
  tituloDe = tituloLinea;
  detalleDe = detalleLinea;
  importeDe = importe;

  // ----- Navegación entre vistas -----
  atras(): void {
    if (this.vista === 'categorias') { void this.router.navigateByUrl('/inicio'); return; }
    this.vista = 'categorias';
  }
  verLista(): void { this.vista = 'lista'; void this.calcular(); }

  elegirCategoria(c: Categoria): void {
    this.categoria = c;
    this.cfg = configDe(c);
    this.est = estructura(c.id_categoria, this.tarifas);
    this.extrasSel = [];
    this.cantidad = CANTIDAD_MIN;
    this.elegirTipo(this.est.tipos[0] ?? null);
    this.vista = 'detalle';
  }
  elegirTipo(t: Tipo | null): void {
    this.tipo = t;
    // Si el material/tamaño elegido existe en el nuevo tipo se conserva; si no, se parte de la opción más barata.
    const previo = this.variante?.material ?? null;
    this.variante = t ? (t.variantes.find((v) => v.material === previo) ?? t.variantes[0] ?? null) : null;
  }
  elegirVariante(v: Tarifa): void { this.variante = v; }
  alternarExtra(id: number): void {
    this.extrasSel = this.extrasSel.includes(id) ? this.extrasSel.filter((e) => e !== id) : [...this.extrasSel, id];
  }
  cambiarCantidad(delta: number): void { this.cantidad = acotarCantidad(this.cantidad + delta, this.max); }

  agregarALista(): void {
    const linea = this.lineaActual;
    if (!linea) return;
    this.lista.agregar(linea);
    this.lista.fijarZona(this.idZona);
    this.verLista();
  }
  quitar(indice: number): void {
    this.lista.quitar(indice);
    if (this.lineas.length === 0) { this.resultado = null; this.vista = 'categorias'; return; }
    void this.calcular();
  }

  // ----- Servidor: total confirmado -----
  async calcular(): Promise<void> {
    if (this.idZona === null || this.lineas.length === 0) return;
    const turno = ++this.secuencia;
    this.calculando = true;
    this.errorCalculo = '';
    try {
      const r = await firstValueFrom(this.api.cotizarItems(this.idZona, itemsApi(this.lineas)));
      if (turno === this.secuencia) this.resultado = r;
    } catch (error) {
      if (turno === this.secuencia) { this.resultado = null; this.errorCalculo = httpError(error); }
    } finally { if (turno === this.secuencia) this.calculando = false; }
  }
  elegirDepartamento(nombre: string): void {
    this.departamentoSel = nombre;
    const primera = this.zonasDelDepartamento[0];
    if (primera) this.elegirZona(primera.zona.id_zona);
  }
  elegirZona(id: number): void {
    if (id === this.idZona) return;
    this.idZona = id;
    this.lista.fijarZona(id);
    this.resultado = null;
    void this.calcular();
  }

  // ----- Pedir -----
  async pedir(): Promise<void> {
    let conSesion = false;
    try { conSesion = await this.auth.verify(); } catch { conSesion = false; }
    if (conSesion) void this.router.navigateByUrl('/cotizar/pedido');
    else this.cuentaAbierta = true;
  }
  cerrarCuenta(): void { this.cuentaAbierta = false; }
}
