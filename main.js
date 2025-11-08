import { AuthService } from './auth-service.js';
import { DataService } from './data-service.js';
import { RealtimeService } from './realtime-service.js';
import { initExcelExport } from './excel-export.js';
import { initPdfExport } from './pdf-export.js';

// Inicijalizacija kada se stranica učita
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplikacija se pokreće...');
    
    // Inicijalizacija export funkcionalnosti
    setTimeout(() => {
        if (typeof initExcelExport === 'function') {
            initExcelExport();
        }
        if (typeof initPdfExport === 'function') {
            initPdfExport();
        }
    }, 100);
});