import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import CatalogosView from '../views/CatalogosView.vue'
import AdminLayout from '../views/AdminLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import PedidosView from '../views/PedidosView.vue'
import ClientesView from '../views/ClientesView.vue'
import ReportesView from '../views/ReportesView.vue'
import ValoracionesView from '../views/ValoracionesView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', component: AdminLayout, meta: { requiresAuth: true }, children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: DashboardView },
      { path: 'pedidos', component: PedidosView },
      { path: 'catalogos', component: CatalogosView },
      { path: 'zonas', component: CatalogosView },
      { path: 'clientes', component: ClientesView },
      { path: 'reportes', component: ReportesView },
      { path: 'valoraciones', component: ValoracionesView },
    ] },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  try { await auth.restore() } catch { return to.name === 'login' ? true : { name: 'login' } }
  if (to.meta.requiresAuth && !auth.usuario) return { name: 'login' }
  if (to.name === 'login' && auth.usuario) return { name: 'dashboard' }
})

export default router
