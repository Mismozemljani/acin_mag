import { AuthService } from './auth-service.js'
import { DataService } from './data-service.js'
import { RealtimeService } from './realtime-service.js'

class MagacinskiSistem {
    constructor() {
        this.currentUser = null
        this.currentRole = null
        this.init()
    }

    async init() {
        this.setupEventListeners()
        await this.checkAuthState()
    }

    setupEventListeners() {
        // Login
        document.getElementById('loginBtn').addEventListener('click', () => this.login())
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout())

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab))
        })

        // Modal controls
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals())
        })

        // Form submissions
        document.getElementById('articleForm').addEventListener('submit', (e) => this.handleArticleSubmit(e))
        document.getElementById('reservationForm').addEventListener('submit', (e) => this.handleReservationSubmit(e))
        document.getElementById('pickupForm').addEventListener('submit', (e) => this.handlePickupSubmit(e))

        // Action buttons
        document.getElementById('addArticleBtn').addEventListener('click', () => this.openArticleModal())
        document.getElementById('addReservationBtn').addEventListener('click', () => this.openReservationModal())
        document.getElementById('addPickupBtn').addEventListener('click', () => this.openPickupModal())
        document.getElementById('addEntryBtn')?.addEventListener('click', () => this.openEntryModal())
        document.getElementById('addUserBtn')?.addEventListener('click', () => this.openUserModal())
    }

    async checkAuthState() {
        const { user } = await AuthService.getCurrentUser()
        if (user) {
            await this.loadUserProfile(user.email)
            this.showApp()
        } else {
            this.showLogin()
        }
    }

    async loadUserProfile(email) {
        const { data: userProfile, error } = await DataService.getUserByEmail(email)
        
        if (userProfile && !error) {
            this.currentUser = userProfile
            this.currentRole = userProfile.role
            document.getElementById('currentUser').textContent = 
                `${userProfile.name} (${userProfile.role})`
        }
    }

    async login() {
        const username = document.getElementById('username').value
        const password = document.getElementById('password').value
        const role = document.getElementById('role').value

        if (!username || !password) {
            alert('Molimo unesite korisničko ime i lozinku!')
            return
        }

        // Generišemo email i personal code na osnovu username
        const userData = {
            name: username,
            role: role,
            personal_code: this.generatePersonalCode(username)
        }

        const email = `${username.replace(/\s+/g, '').toLowerCase()}@magacin.com`

        const { data, error } = await AuthService.signIn(email, password, userData)

        if (error) {
            alert(`Greška pri prijavi: ${error.message}`)
            return
        }

        await this.loadUserProfile(email)
        this.showApp()
    }

    generatePersonalCode(username) {
        return username.substring(0, 7).toUpperCase().padEnd(7, '0')
    }

    async logout() {
        await AuthService.signOut()
        this.currentUser = null
        this.currentRole = null
        this.showLogin()
        RealtimeService.unsubscribeAll()
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'block'
        document.getElementById('appScreen').style.display = 'none'
        document.getElementById('logoutBtn').style.display = 'none'
    }

    showApp() {
        document.getElementById('loginScreen').style.display = 'none'
        document.getElementById('appScreen').style.display = 'block'
        document.getElementById('logoutBtn').style.display = 'block'
        
        this.setupPermissions()
        this.loadAllData()
        this.setupRealtimeSubscriptions()
    }

    setupPermissions() {
        const ulaziTab = document.getElementById('ulaziTab')
        const korisniciTab = document.getElementById('korisniciTab')
        const addArticleBtn = document.getElementById('addArticleBtn')

        if (this.currentRole === 'MAGACIN_ADMIN') {
            if (ulaziTab) ulaziTab.style.display = 'block'
            if (korisniciTab) korisniciTab.style.display = 'block'
            if (addArticleBtn) addArticleBtn.style.display = 'block'
        } else {
            if (ulaziTab) ulaziTab.style.display = 'none'
            if (korisniciTab) korisniciTab.style.display = 'none'
            if (addArticleBtn) addArticleBtn.style.display = 'none'
        }
    }

    setupRealtimeSubscriptions() {
        // Real-time updates za artikle
        RealtimeService.subscribeToArticles((payload) => {
            console.log('Articles update:', payload)
            this.loadArticles()
        })

        // Real-time updates za rezervacije
        RealtimeService.subscribeToReservations((payload) => {
            console.log('Reservations update:', payload)
            this.loadReservations()
        })

        // Real-time updates za preuzimanja
        RealtimeService.subscribeToPickups((payload) => {
            console.log('Pickups update:', payload)
            this.loadPickups()
        })
    }

    async loadAllData() {
        await this.loadArticles()
        await this.loadReservations()
        await this.loadPickups()
        await this.loadEntries()
        await this.loadUsers()
        this.populateDropdowns()
    }

    async loadArticles() {
        const { data: articles, error } = await DataService.getArticles()
        
        if (error) {
            console.error('Error loading articles:', error)
            return
        }

        const tbody = document.getElementById('articlesTableBody')
        if (!tbody) return
        
        tbody.innerHTML = ''

        articles.forEach(article => {
            const row = document.createElement('tr')
            
            if (article.available <= 0) {
                row.classList.add('status-critical')
            } else if (article.available < 10) {
                row.classList.add('status-low')
            }

            row.innerHTML = `
                <td>${article.code}</td>
                <td>${article.name}</td>
                <td>${article.location}</td>
                <td>${article.project || ''}</td>
                <td>${article.supplier || ''}</td>
                <td>${article.price ? article.price.toFixed(2) : '0.00'}</td>
                <td>${article.quantity}</td>
                <td>${article.reserved}</td>
                <td>${article.available}</td>
                <td>
                    ${this.currentRole === 'MAGACIN_ADMIN' ? 
                      `<button class="btn btn-warning" onclick="app.editArticle('${article.id}')">Izmeni</button>
                       <button class="btn btn-danger" onclick="app.deleteArticle('${article.id}')">Obriši</button>` : 
                      ''}
                </td>
            `
            tbody.appendChild(row)
        })
    }

    async loadReservations() {
        const { data: reservations, error } = await DataService.getReservations()
        
        if (error) {
            console.error('Error loading reservations:', error)
            return
        }

        const tbody = document.getElementById('reservationsTableBody')
        if (!tbody) return
        
        tbody.innerHTML = ''

        reservations.forEach(reservation => {
            const row = document.createElement('tr')
            row.innerHTML = `
                <td>${reservation.mag_articles.code}</td>
                <td>${reservation.mag_articles.name}</td>
                <td>${reservation.quantity}</td>
                <td>${reservation.mag_users.name}</td>
                <td>${new Date(reservation.created_at).toLocaleString('sr-RS')}</td>
                <td>
                    ${this.currentRole === 'MAGACIN_ADMIN' ? 
                      `<button class="btn btn-danger" onclick="app.deleteReservation('${reservation.id}')">Obriši</button>` : 
                      ''}
                </td>
            `
            tbody.appendChild(row)
        })
    }

    async loadPickups() {
        const { data: pickups, error } = await DataService.getPickups()
        
        if (error) {
            console.error('Error loading pickups:', error)
            return
        }

        const tbody = document.getElementById('pickupsTableBody')
        if (!tbody) return
        
        tbody.innerHTML = ''

        pickups.forEach(pickup => {
            const row = document.createElement('tr')
            row.innerHTML = `
                <td>${pickup.mag_articles.code}</td>
                <td>${pickup.mag_articles.name}</td>
                <td>${pickup.quantity}</td>
                <td>${pickup.mag_users.name}</td>
                <td>${new Date(pickup.created_at).toLocaleString('sr-RS')}</td>
                <td>
                    ${this.currentRole === 'MAGACIN_ADMIN' ? 
                      `<button class="btn btn-danger" onclick="app.deletePickup('${pickup.id}')">Obriši</button>` : 
                      ''}
                </td>
            `
            tbody.appendChild(row)
        })
    }

    async loadEntries() {
        if (this.currentRole !== 'MAGACIN_ADMIN') return

        const { data: entries, error } = await DataService.getEntries()
        
        if (error) {
            console.error('Error loading entries:', error)
            return
        }

        const tbody = document.getElementById('entriesTableBody')
        if (!tbody) return
        
        tbody.innerHTML = ''

        entries.forEach(entry => {
            const row = document.createElement('tr')
            row.innerHTML = `
                <td>${entry.mag_articles.code}</td>
                <td>${entry.mag_articles.name}</td>
                <td>${entry.quantity}</td>
                <td>${entry.price.toFixed(2)}</td>
                <td>${entry.supplier}</td>
                <td>${entry.entry_date}</td>
                <td>
                    <button class="btn btn-danger" onclick="app.deleteEntry('${entry.id}')">Obriši</button>
                </td>
            `
            tbody.appendChild(row)
        })
    }

    async loadUsers() {
        if (this.currentRole !== 'MAGACIN_ADMIN') return

        const { data: users, error } = await DataService.getUsers()
        
        if (error) {
            console.error('Error loading users:', error)
            return
        }

        const tbody = document.getElementById('usersTableBody')
        if (!tbody) return
        
        tbody.innerHTML = ''

        users.forEach(user => {
            const row = document.createElement('tr')
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.role}</td>
                <td>${user.personal_code}</td>
                <td>
                    <button class="btn btn-warning" onclick="app.editUser('${user.id}')">Izmeni</button>
                    <button class="btn btn-danger" onclick="app.deleteUser('${user.id}')">Obriši</button>
                </td>
            `
            tbody.appendChild(row)
        })
    }

    async populateDropdowns() {
        await this.populateArticleDropdowns()
        await this.populateUserDropdowns()
    }

    async populateArticleDropdowns() {
        const { data: articles } = await DataService.getArticles()
        if (!articles) return
        
        // Za rezervacije
        const reservationSelect = document.getElementById('reservationArticle')
        if (reservationSelect) {
            reservationSelect.innerHTML = '<option value="">Izaberite artikal</option>'
            
            articles.forEach(article => {
                const option = document.createElement('option')
                option.value = article.id
                option.textContent = `${article.code} - ${article.name} (Dostupno: ${article.available})`
                reservationSelect.appendChild(option)
            })
        }

        // Za preuzimanja
        const pickupSelect = document.getElementById('pickupArticle')
        if (pickupSelect) {
            pickupSelect.innerHTML = '<option value="">Izaberite artikal</option>'
            
            articles.forEach(article => {
                const option = document.createElement('option')
                option.value = article.id
                option.textContent = `${article.code} - ${article.name} (Dostupno: ${article.available})`
                pickupSelect.appendChild(option)
            })
        }
    }

    async populateUserDropdowns() {
        // Za rezervacije
        const { data: reservationUsers } = await DataService.getUsersByRole('REZERVACIJA')
        const reservationSelect = document.getElementById('reservationUser')
        if (reservationSelect && reservationUsers) {
            reservationSelect.innerHTML = '<option value="">Izaberite korisnika</option>'
            
            reservationUsers.forEach(user => {
                const option = document.createElement('option')
                option.value = user.id
                option.textContent = user.name
                reservationSelect.appendChild(option)
            })
        }

        // Za preuzimanja
        const { data: pickupUsers } = await DataService.getUsersByRole('PREUZIMANJE')
        const pickupSelect = document.getElementById('pickupUser')
        if (pickupSelect && pickupUsers) {
            pickupSelect.innerHTML = '<option value="">Izaberite korisnika</option>'
            
            pickupUsers.forEach(user => {
                const option = document.createElement('option')
                option.value = user.id
                option.textContent = user.name
                pickupSelect.appendChild(option)
            })
        }
    }

    // Modal functions
    openArticleModal() {
        document.getElementById('articleModalTitle').textContent = 'Dodaj artikal'
        document.getElementById('articleForm').reset()
        document.getElementById('articleModal').classList.add('active')
    }

    openReservationModal() {
        document.getElementById('reservationForm').reset()
        document.getElementById('reservationModal').classList.add('active')
    }

    openPickupModal() {
        document.getElementById('pickupForm').reset()
        document.getElementById('pickupModal').classList.add('active')
    }

    openEntryModal() {
        // Implementirati kasnije
        alert('Dodavanje ulaza će biti implementirano u narednoj verziji!')
    }

    openUserModal() {
        // Implementirati kasnije
        alert('Dodavanje korisnika će biti implementirano u narednoj verziji!')
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active')
        })
    }

    // Form handlers
    async handleArticleSubmit(e) {
        e.preventDefault()
        
        const articleData = {
            code: document.getElementById('articleCode').value,
            name: document.getElementById('articleName').value,
            location: document.getElementById('articleLocation').value,
            project: document.getElementById('articleProject').value,
            supplier: document.getElementById('articleSupplier').value,
            price: parseFloat(document.getElementById('articlePrice').value) || 0,
            quantity: parseInt(document.getElementById('articleQuantity').value) || 0,
            reserved: 0
        }

        const { error } = await DataService.createArticle(articleData)
        
        if (error) {
            alert(`Greška pri čuvanju artikla: ${error.message}`)
            return
        }

        this.closeModals()
        alert('Artikal uspešno dodat!')
    }

    async handleReservationSubmit(e) {
        e.preventDefault()
        
        const articleId = document.getElementById('reservationArticle').value
        const quantity = parseInt(document.getElementById('reservationQuantity').value)
        const userId = document.getElementById('reservationUser').value
        const reservationCode = document.getElementById('reservationCode').value

        if (reservationCode.length !== 7) {
            alert('Potvrdni kod mora imati tačno 7 karaktera!')
            return
        }

        const reservationData = {
            article_id: articleId,
            quantity: quantity,
            user_id: userId,
            reservation_code: reservationCode
        }

        const { error } = await DataService.createReservation(reservationData)
        
        if (error) {
            alert(`Greška pri rezervaciji: ${error.message}`)
            return
        }

        this.closeModals()
        alert('Rezervacija uspešno kreirana!')
    }

    async handlePickupSubmit(e) {
        e.preventDefault()
        
        const articleId = document.getElementById('pickupArticle').value
        const quantity = parseInt(document.getElementById('pickupQuantity').value)
        const userId = document.getElementById('pickupUser').value
        const pickupCode = document.getElementById('pickupCode').value

        if (pickupCode.length !== 7) {
            alert('Potvrdni kod mora imati tačno 7 karaktera!')
            return
        }

        const pickupData = {
            article_id: articleId,
            quantity: quantity,
            user_id: userId,
            pickup_code: pickupCode
        }

        const { error } = await DataService.createPickup(pickupData)
        
        if (error) {
            alert(`Greška pri preuzimanju: ${error.message}`)
            return
        }

        this.closeModals()
        alert('Preuzimanje uspešno evidentirano!')
    }

    // Tab navigation
    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active')
        })
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active')
        })
        
        const tabElement = document.getElementById(tabName)
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`)
        
        if (tabElement) tabElement.classList.add('active')
        if (tabButton) tabButton.classList.add('active')
    }

    // CRUD operations
    async editArticle(id) {
        alert('Izmena artikla će biti implementirana u narednoj verziji!')
    }

    async deleteArticle(id) {
        if (confirm('Da li ste sigurni da želite da obrišete ovaj artikal?')) {
            const { error } = await DataService.deleteArticle(id)
            if (error) {
                alert(`Greška pri brisanju: ${error.message}`)
            } else {
                alert('Artikal uspešno obrisan!')
            }
        }
    }

    async deleteReservation(id) {
        if (confirm('Da li ste sigurni da želite da obrišete ovu rezervaciju?')) {
            const { error } = await DataService.deleteReservation(id)
            if (error) {
                alert(`Greška pri brisanju: ${error.message}`)
            } else {
                alert('Rezervacija uspešno obrisana!')
            }
        }
    }

    async deletePickup(id) {
        if (confirm('Da li ste sigurni da želite da obrišete ovo preuzimanje?')) {
            const { error } = await DataService.deletePickup(id)
            if (error) {
                alert(`Greška pri brisanju: ${error.message}`)
            } else {
                alert('Preuzimanje uspešno obrisano!')
            }
        }
    }

    async deleteEntry(id) {
        if (confirm('Da li ste sigurni da želite da obrišete ovaj ulaz?')) {
            const { error } = await DataService.deleteEntry(id)
            if (error) {
                alert(`Greška pri brisanju: ${error.message}`)
            } else {
                alert('Ulaz uspešno obrisan!')
            }
        }
    }

    async editUser(id) {
        alert('Izmena korisnika će biti implementirana u narednoj verziji!')
    }

    async deleteUser(id) {
        if (confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) {
            const { error } = await DataService.deleteUser(id)
            if (error) {
                alert(`Greška pri brisanju: ${error.message}`)
            } else {
                alert('Korisnik uspešno obrisan!')
            }
        }
    }
}

// Globalna instanca aplikacije
const app = new MagacinskiSistem()
window.app = app