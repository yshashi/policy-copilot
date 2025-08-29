import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { CheckCircle, Clock, Download, File, FileText, LucideAngularModule, RefreshCw, Send, Trash2, X, XCircle } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    LucideAngularModule.pick({ RefreshCw, FileText, Download, Trash2, CheckCircle, XCircle, File, Clock, Send, X }).providers ?? []
  ]
};
