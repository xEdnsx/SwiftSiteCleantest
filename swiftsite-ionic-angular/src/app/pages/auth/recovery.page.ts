import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { httpError } from '../../core/api.interceptor';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-recovery', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IconComponent],
  templateUrl: './recovery.page.html',
  styleUrls: ['./auth.page.scss', './recovery.page.scss'],
})
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
