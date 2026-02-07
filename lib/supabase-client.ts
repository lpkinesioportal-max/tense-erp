import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Using localStorage fallback.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Helper to check if Supabase is available
export const isSupabaseConfigured = () => {
    return Boolean(supabaseUrl && supabaseAnonKey)
}
