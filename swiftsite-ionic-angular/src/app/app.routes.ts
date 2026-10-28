import { Routes } from '@angular/router';
import { clienteGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage) },
  { path: 'registro', data: { register: true }, loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage) },
  { path: 'privacidad', loadComponent: () => import('./pages/privacy/privacy.page').then(m => m.PrivacyPage) },
  { path: '', loadComponent: () => import('./pages/shell/shell.page').then(m => m.ShellPage), children: [
    { path: 'inicio', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
    { path: 'cotizar', loadComponent: () => import('./pages/quote/quote.page').then(m => m.QuotePage) },
    { path: 'pedidos', canActivate: [clienteGuard], data: { pedidos: true }, loadComponent: () => import('./pages/account/account.page').then(m => m.AccountPage) },
    { path: 'perfil', canActivate: [clienteGuard], loadComponent: () => import('./pages/account/account.page').then(m => m.AccountPage) },
    { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  ] },
  { path: '**', redirectTo: 'inicio' },
];
