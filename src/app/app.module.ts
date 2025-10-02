// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SpeseComponent } from './spese/spese.component';
import { EntrateComponent } from './entrate/entrate.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SaldiComponent } from './saldi/saldi.component';

@NgModule({
  declarations: [ AppComponent, SpeseComponent, EntrateComponent, DashboardComponent, SaldiComponent ],
  imports: [ BrowserModule, FormsModule, ReactiveFormsModule, AppRoutingModule ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
