"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const createSupabaseServerClient = () => {
    const cookieStore = cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options) {
                    cookieStore.set(name, value, options)
                },
                remove(name: string, options) {
                    cookieStore.delete(name)
                },
            },
        }
    )
}

// For service role operations (bypasses RLS)
export const createSupabaseServiceClient = () => {
    const { createClient } = require('@supabase/supabase-js')

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
