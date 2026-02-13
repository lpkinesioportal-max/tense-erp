
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkConfig() {
    const { data, error } = await supabase
        .from('clinical_form_configs')
        .select('*')
        .eq('form_type', 'nutrition_recipe')
        .single()

    if (error) {
        console.error('Error fetching config:', error)
    } else {
        console.log('Current Config in DB:', JSON.stringify(data, null, 2))

        // Check if it has the new meal_plan field
        const hasNewField = data?.fields?.some((f: any) => f.type === 'meal_plan')
        console.log('Has meal_plan field?', hasNewField)
    }
}

checkConfig()
