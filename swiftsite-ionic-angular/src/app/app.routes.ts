import { Routes } from '@angular/router';
import { clienteGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'recuperar-password', loadComponent: () => import('./pages/auth/recovery.page').then(m => m.RecoveryPage) },
  { path: 'login', loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage) },
  { path: 'registro', data: { register: true }, loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage) },
  { path: 'terminos', data: { tipo: 'terminos' }, loadComponent: () => import('./pages/legal/legal.page').then(m => m.LegalPage) },
  { path: 'privacidad', data: { tipo: 'privacidad' }, loadComponent: () => import('./pages/legal/legal.page').then(m => m.LegalPage) },
  { path: '', loadComponent: () => import('./pages/shell/shell.page').then(m => m.ShellPage), children: [
    { path: 'inicio', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
    { path: 'cotizar/pedido', canActivate: [clienteGuard], loadComponent: () => import('./pages/cotizar/cotizar.page').then(m => m.CotizarPage) },
    { path: 'cotizar/pasos', redirectTo: 'cotizar', pathMatch: 'full' },
    { path: 'cotizar', loadComponent: () => import('./pages/quote/quote.page').then(m => m.QuotePage) },
    { path: 'pedidos', canActivate: [clienteGuard], loadComponent: () => import('./pages/pedidos/pedidos.page').then(m => m.PedidosPage) },
    { path: 'reportar/:id', canActivate: [clienteGuard], loadComponent: () => import('./pages/reportar/reportar.page').then(m => m.ReportarPage) },
    { path: 'valorar/:id', canActivate: [clienteGuard], loadComponent: () => import('./pages/valorar/valorar.page').then(m => m.ValorarPage) },
    { path: 'perfil', canActivate: [clienteGuard], loadComponent: () => import('./pages/account/account.page').then(m => m.AccountPage) },
    { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  ] },
  { path: '**', redirectTo: 'inicio' },
];
