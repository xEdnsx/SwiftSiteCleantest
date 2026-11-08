import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { NuevoPedido, PedidoApi } from '../pages/pedidos/pedidos';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);

  /** Guarda el pedido. El servidor recalcula los montos con los precios vigentes. */
  crear(pedido: NuevoPedido) {
    return this.http.post<PedidoApi>(`${environment.apiUrl}/pedidos`, pedido);
  }

  /** Pedidos de la persona con sesión iniciada, del más reciente al más antiguo. */
  mios() {
    return this.http.get<PedidoApi[]>(`${environment.apiUrl}/mis-pedidos`);
  }

  /** Un pedido de la persona (404 si no existe o es de otra persona). */
  uno(id: number) {
    return this.http.get<PedidoApi>(`${environment.apiUrl}/mis-pedidos/${id}`);
  }
}
