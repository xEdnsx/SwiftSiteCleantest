import { Routes } from '@angular/router';
import { clienteGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage) },
  { path: 'registro', data: { register: true }, loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage) },
  { path: 'privacidad', loadComponent: () => import('./pages/privacy/privacy.page').then(m => m.PrivacyPage) },
  { path: '', loadComponent: () => import('./pages/shell/shell.page').then(m => m.ShellPage), children: [
    { path: 'inicio', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
    { path: 'cotizar/pasos', loadComponent: () => import('./pages/cotizar/cotizar.page').then(m => m.CotizarPage) },
    { path: 'cotizar', loadComponent: () => import('./pages/quote/quote.page').then(m => m.QuotePage) },
    { path: 'pedidos', canActivate: [clienteGuard], loadComponent: () => import('./pages/pedidos/pedidos.page').then(m => m.PedidosPage) },
    { path: 'valorar', canActivate: [clienteGuard], loadComponent: () => import('./pages/valorar/valorar.page').then(m => m.ValorarPage) },
    { path: 'perfil', canActivate: [clienteGuard], loadComponent: () => import('./pages/account/account.page').then(m => m.AccountPage) },
    { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  ] },
  { path: '**', redirectTo: 'inicio' },
];
