import { supabase, tables } from './supabase-client.js'

export class DataService {
    // ARTICLES
    static async getArticles() {
        const { data, error } = await supabase
            .from(tables.ARTICLES)
            .select('*')
            .order('created_at', { ascending: false })

        return { data, error }
    }

    static async getArticle(id) {
        const { data, error } = await supabase
            .from(tables.ARTICLES)
            .select('*')
            .eq('id', id)
            .single()

        return { data, error }
    }

    static async createArticle(article) {
        const { data, error } = await supabase
            .from(tables.ARTICLES)
            .insert([{
                ...article,
                available: article.quantity - (article.reserved || 0)
            }])
            .select()

        return { data, error }
    }

    static async updateArticle(id, updates) {
        if (updates.quantity !== undefined || updates.reserved !== undefined) {
            updates.available = (updates.quantity || 0) - (updates.reserved || 0)
        }

        const { data, error } = await supabase
            .from(tables.ARTICLES)
            .update(updates)
            .eq('id', id)
            .select()

        return { data, error }
    }

    static async deleteArticle(id) {
        const { error } = await supabase
            .from(tables.ARTICLES)
            .delete()
            .eq('id', id)

        return { error }
    }

    // RESERVATIONS
    static async getReservations() {
        const { data, error } = await supabase
            .from(tables.RESERVATIONS)
            .select(`
                *,
                mag_articles (code, name),
                mag_users (name)
            `)
            .order('created_at', { ascending: false })

        return { data, error }
    }

    static async createReservation(reservationData) {
        const { data, error } = await supabase
            .from(tables.RESERVATIONS)
            .insert([reservationData])
            .select(`
                *,
                mag_articles (code, name),
                mag_users (name)
            `)

        return { data, error }
    }

    // PICKUPS
    static async getPickups() {
        const { data, error } = await supabase
            .from(tables.PICKUPS)
            .select(`
                *,
                mag_articles (code, name),
                mag_users (name)
            `)
            .order('created_at', { ascending: false })

        return { data, error }
    }

    static async createPickup(pickupData) {
        const { data, error } = await supabase
            .from(tables.PICKUPS)
            .insert([pickupData])
            .select(`
                *,
                mag_articles (code, name),
                mag_users (name)
            `)

        return { data, error }
    }

    // USERS
    static async getUsers() {
        const { data, error } = await supabase
            .from(tables.USERS)
            .select('*')
            .order('name')

        return { data, error }
    }

    static async getUsersByRole(role) {
        const { data, error } = await supabase
            .from(tables.USERS)
            .select('*')
            .eq('role', role)
            .order('name')

        return { data, error }
    }

    // ENTRIES
    static async getEntries() {
        const { data, error } = await supabase
            .from(tables.ENTRIES)
            .select(`
                *,
                mag_articles (code, name)
            `)
            .order('entry_date', { ascending: false })

        return { data, error }
    }

    static async createEntry(entryData) {
        const { data, error } = await supabase
            .from(tables.ENTRIES)
            .insert([entryData])
            .select(`
                *,
                mag_articles (code, name)
            `)

        return { data, error }
    }

    // Brisanje operacije
    static async deleteReservation(id) {
        const { error } = await supabase
            .from(tables.RESERVATIONS)
            .delete()
            .eq('id', id)
        return { error }
    }

    static async deletePickup(id) {
        const { error } = await supabase
            .from(tables.PICKUPS)
            .delete()
            .eq('id', id)
        return { error }
    }

    static async deleteEntry(id) {
        const { error } = await supabase
            .from(tables.ENTRIES)
            .delete()
            .eq('id', id)
        return { error }
    }

    static async deleteUser(id) {
        const { error } = await supabase
            .from(tables.USERS)
            .delete()
            .eq('id', id)
        return { error }
    }

    // Dodatne helper metode
    static async getUserByEmail(email) {
        const { data, error } = await supabase
            .from(tables.USERS)
            .select('*')
            .eq('email', email)
            .single()

        return { data, error }
    }
}