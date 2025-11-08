import { supabase, tables } from './supabase-client.js'

export class RealtimeService {
    static subscriptions = new Map()

    static subscribeToTable(tableName, callback) {
        if (this.subscriptions.has(tableName)) {
            this.unsubscribeFromTable(tableName)
        }

        const subscription = supabase
            .channel(`public:${tableName}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: tableName
                },
                callback
            )
            .subscribe()

        this.subscriptions.set(tableName, subscription)
        return subscription
    }

    static unsubscribeFromTable(tableName) {
        const subscription = this.subscriptions.get(tableName)
        if (subscription) {
            supabase.removeChannel(subscription)
            this.subscriptions.delete(tableName)
        }
    }

    static unsubscribeAll() {
        this.subscriptions.forEach((subscription, tableName) => {
            supabase.removeChannel(subscription)
        })
        this.subscriptions.clear()
    }

    // Specifične pretplate za naše mag_ tabele
    static subscribeToArticles(callback) {
        return this.subscribeToTable(tables.ARTICLES, callback)
    }

    static subscribeToReservations(callback) {
        return this.subscribeToTable(tables.RESERVATIONS, callback)
    }

    static subscribeToPickups(callback) {
        return this.subscribeToTable(tables.PICKUPS, callback)
    }

    static subscribeToEntries(callback) {
        return this.subscribeToTable(tables.ENTRIES, callback)
    }

    static subscribeToUsers(callback) {
        return this.subscribeToTable(tables.USERS, callback)
    }
}