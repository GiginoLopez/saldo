
import { enableProdMode, LOCALE_ID } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

registerLocaleData(localeIt);

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic([{ provide: LOCALE_ID, useValue: 'it-IT' }])
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
