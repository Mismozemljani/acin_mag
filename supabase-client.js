import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://ndaimaqhdwiqhexdhpcw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYWltYXFoZHdpcWhleGRocGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDI2OTQsImV4cCI6MjA3NjQ3ODY5NH0.KF0t7Hp9c8gCEuDF2cRODqec7Lvlu4xPIyIepFeFhAc'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper funkcije sa mag_ prefiksom
export const tables = {
    ARTICLES: 'mag_articles',
    USERS: 'mag_users',
    RESERVATIONS: 'mag_reservations',
    PICKUPS: 'mag_pickups',
    ENTRIES: 'mag_entries'
}