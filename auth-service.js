import { supabase, tables } from './supabase-client.js'

export class AuthService {
    static async signIn(email, password, userData) {
        try {
            // Pokušaj sign up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            })

            if (authError && authError.message !== 'User already registered') {
                return { error: authError }
            }

            // Ako je user već registrovan, pokušaj sign in
            if (authError && authError.message === 'User already registered') {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })

                if (signInError) return { error: signInError }
                
                // Proveri da li user postoji u našoj mag_users tabeli
                await this.ensureUserProfile(signInData.user, userData)
                return { data: signInData }
            }

            // Kreiraj user profil za novog korisnika
            if (authData.user) {
                await this.createUserProfile(authData.user, userData)
            }

            return { data: authData }
        } catch (error) {
            return { error }
        }
    }

    static async createUserProfile(authUser, userData) {
        const { error } = await supabase
            .from(tables.USERS)
            .insert([{
                name: userData.name,
                role: userData.role,
                personal_code: userData.personal_code,
                email: authUser.email
            }])

        return { error }
    }

    static async ensureUserProfile(authUser, userData) {
        // Proveri da li user profil postoji
        const { data: existingUser } = await supabase
            .from(tables.USERS)
            .select('*')
            .eq('email', authUser.email)
            .single()

        if (!existingUser) {
            await this.createUserProfile(authUser, userData)
        }
    }

    static async signOut() {
        const { error } = await supabase.auth.signOut()
        return { error }
    }

    static async getCurrentSession() {
        const { data: { session }, error } = await supabase.auth.getSession()
        return { session, error }
    }

    static async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser()
        return { user, error }
    }

    static async getCurrentUserProfile() {
        const { user } = await this.getCurrentUser()
        if (!user) return { data: null, error: 'No user' }

        const { data, error } = await supabase
            .from(tables.USERS)
            .select('*')
            .eq('email', user.email)
            .single()

        return { data, error }
    }

    static onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback)
    }
}