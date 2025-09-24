// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// ⬇️ aggiungi ReactiveFormsModule (puoi tenerlo sulla stessa riga del FormsModule)
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SpeseComponent } from './spese/spese.component';
import { EntrateComponent } from './entrate/entrate.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    SpeseComponent,
    EntrateComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,  // ⬅️ necessario per FormBuilder, FormGroup, ecc.
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }