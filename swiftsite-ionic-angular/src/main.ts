import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouteReuseStrategy, withHashLocation } from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { apiInterceptor } from './app/core/api.interceptor';
import { iniciarTema } from './app/core/tema';

iniciarTema();
bootstrapApplication(AppComponent, { providers: [provideHttpClient(withInterceptors([apiInterceptor])), provideIonicAngular(), { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, provideRouter(routes, withHashLocation())] }).catch(console.error);
