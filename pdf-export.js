import { DataService } from './data-service.js'

export function initPdfExport() {
    const exportPdfBtn = document.getElementById('exportPdfBtn')
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPdf)
    }
}

async function exportToPdf() {
    try {
        const { data: articles, error } = await DataService.getArticles()
        
        if (error) {
            alert(`Greška pri učitavanju podataka: ${error.message}`)
            return
        }

        if (!articles || articles.length === 0) {
            alert('Nema podataka za izvoz!')
            return
        }

        // Proveri da li su jsPDF i autoTable dostupni
        if (typeof window.jspdf === 'undefined') {
            alert('PDF biblioteka nije učitana!')
            return
        }

        const { jsPDF } = window.jspdf
        
        // Kreiraj PDF dokument
        const doc = new jsPDF()
        
        // Naslov
        doc.setFontSize(20)
        doc.setTextColor(40, 40, 40)
        doc.text('IZVEŠTAJ O ARTIKLIMA U MAGACINU', 105, 15, { align: 'center' })
        
        // Datum
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Datum izveštaja: ${new Date().toLocaleDateString('sr-RS')}`, 14, 25)
        
        // Tabela
        doc.autoTable({
            startY: 30,
            head: [
                ['Šifra', 'Naziv', 'Lokacija', 'Stanje', 'Rezervisano', 'Dostupno', 'Cena']
            ],
            body: articles.map(article => [
                article.code,
                article.name,
                article.location,
                article.quantity.toString(),
                article.reserved.toString(),
                article.available.toString(),
                `${article.price ? article.price.toFixed(2) : '0.00'} RSD`
            ]),
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [44, 62, 80],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 45 },
                2: { cellWidth: 20 },
                3: { cellWidth: 20 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 },
                6: { cellWidth: 25 }
            }
        })
        
        // Sačuvaj PDF
        doc.save(`magacin_izvestaj_${new Date().toISOString().split('T')[0]}.pdf`)
        
        alert('PDF izveštaj uspešno generisan!')
    } catch (error) {
        console.error('Greška pri generisanju PDF-a:', error)
        alert('Došlo je do greške pri generisanju PDF izveštaja!')
    }
}