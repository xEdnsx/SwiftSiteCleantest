import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { httpError } from '../../core/api.interceptor';
@Component({selector:'app-recovery',standalone:true,imports:[CommonModule,FormsModule,RouterLink,IonContent],styleUrls:['./auth.page.scss'],template:`
<ion-content><main class="screen">
<h1>Recuperar contraseña</h1><p class="lead">Recibe un código por correo. Caduca en 30 minutos.</p>
<form *ngIf="!done" #form="ngForm" (ngSubmit)="send(sent)">
<label for="email">Correo</label><input id="email" class="field" type="email" name="correo" [(ngModel)]="correo" required email maxlength="150" autocomplete="username">
<ng-container *ngIf="sent">
<label for="code">Código del correo</label><input id="code" class="field" name="token" [(ngModel)]="token" required maxlength="256" autocomplete="one-time-code">
<label for="password">Nueva contraseña</label><input id="password" class="field" type="password" name="password" [(ngModel)]="password" required minlength="8" maxlength="72" autocomplete="new-password">
<label for="confirmation">Confirmar contraseña</label><input id="confirmation" class="field" type="password" name="confirmation" [(ngModel)]="confirmation" required minlength="8" maxlength="72" autocomplete="new-password">
</ng-container>
<button class="btn-primary" [disabled]="busy || form.invalid">{{busy?'Procesando...':sent?'Guardar contraseña':'Enviar código'}}</button>
<button *ngIf="sent" type="button" class="btn-secondary" [disabled]="busy || !correo" (click)="send(false)">Reenviar código</button>
</form>
<p *ngIf="message" role="status">{{message}}</p><p *ngIf="error" class="error" role="alert">{{error}}</p>
<a routerLink="/login" class="btn-secondary">Volver al inicio de sesión</a>
</main></ion-content>`})
export class RecoveryPage {
 private http=inject(HttpClient);
 correo=''; token=''; password=''; confirmation=''; message=''; error=''; busy=false; sent=false; done=false;
 ionViewDidLeave():void {this.token=this.password=this.confirmation='';this.sent=this.done=false;this.message=this.error='';}
 async send(reset=false):Promise<void>{
 if(this.busy)return;
 this.busy=true;this.error='';this.message='';
 try{
 const response=await firstValueFrom(this.http.post<{message:string}>(environment.apiUrl+(reset?'/reset-password':'/forgot-password'),reset?{correo:this.correo,token:this.token.trim(),password:this.password,password_confirmation:this.confirmation}:{correo:this.correo}));
 this.message=response.message;this.sent=true;
 if(reset){this.done=true;this.token=this.password=this.confirmation='';}
 }catch(e){this.error=httpError(e);}finally{this.busy=false;}
 }
}
