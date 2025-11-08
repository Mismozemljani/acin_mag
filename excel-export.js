import { DataService } from './data-service.js'

export function initExcelExport() {
    const exportExcelBtn = document.getElementById('exportExcelBtn')
    const importExcelBtn = document.getElementById('importExcelBtn')
    const importExcelInput = document.getElementById('importExcel')

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel)
    }
    
    if (importExcelBtn) {
        importExcelBtn.addEventListener('click', triggerImport)
    }
    
    if (importExcelInput) {
        importExcelInput.addEventListener('change', handleExcelImport)
    }
}

async function exportToExcel() {
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

        // Proveri da li je XLSX dostupan
        if (typeof XLSX === 'undefined') {
            alert('Excel biblioteka nije učitana!')
            return
        }

        const ws = XLSX.utils.json_to_sheet(articles.map(article => ({
            Šifra: article.code,
            Naziv: article.name,
            Lokacija: article.location,
            Projekat: article.project,
            Dobavljač: article.supplier,
            Cena: article.price,
            Stanje: article.quantity,
            Rezervisano: article.reserved,
            Dostupno: article.available
        })))
        
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Artikli")
        XLSX.writeFile(wb, "magacin_artikli.xlsx")
        
        alert('Podaci uspešno izvezeni u Excel!')
    } catch (error) {
        console.error('Greška pri izvozu:', error)
        alert('Došlo je do greške pri izvozu podataka!')
    }
}

function triggerImport() {
    const importExcelInput = document.getElementById('importExcel')
    if (importExcelInput) {
        importExcelInput.click()
    }
}

async function handleExcelImport(event) {
    const file = event.target.files[0]
    if (!file) return
    
    try {
        // Proveri da li je XLSX dostupan
        if (typeof XLSX === 'undefined') {
            alert('Excel biblioteka nije učitana!')
            return
        }

        const reader = new FileReader()
        reader.onload = async function(e) {
            try {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, {type: 'array'})
                const worksheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)
                
                if (jsonData.length === 0) {
                    alert('Excel fajl ne sadrži podatke!')
                    return
                }

                // Konvertuj Excel podatke u naš format
                const articles = jsonData.map(item => ({
                    code: item.Šifra || item.code || '',
                    name: item.Naziv || item.name || '',
                    location: item.Lokacija || item.location || '',
                    project: item.Projekat || item.project || '',
                    supplier: item.Dobavljač || item.supplier || '',
                    price: parseFloat(item.Cena || item.price || 0),
                    quantity: parseInt(item.Stanje || item.quantity || 0),
                    reserved: parseInt(item.Rezervisano || item.reserved || 0)
                }))

                // Insertuj artikle u bazu
                let successCount = 0
                for (const article of articles) {
                    const { error } = await DataService.createArticle(article)
                    if (!error) {
                        successCount++
                    }
                }
                
                alert(`Uspešno uveženo ${successCount} od ${articles.length} artikala!`)
                event.target.value = '' // Resetuj input
                
            } catch (error) {
                console.error('Greška pri obradi Excel fajla:', error)
                alert('Došlo je do greške pri obradi Excel fajla!')
            }
        }
        reader.readAsArrayBuffer(file)
    } catch (error) {
        console.error('Greška pri uvozu:', error)
        alert('Došlo je do greške pri uvozu podataka!')
    }
}