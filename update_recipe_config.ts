
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

const newConfig = {
    name: "Recetas / Plan Alimentario",
    description: "Planificación de comidas con opciones y archivos media",
    sections: [
        { id: "general", key: "general", title: "Planificación", order: 0, isActive: true },
    ],
    fields: [
        {
            id: "meal_plan",
            key: "plan_alimentario",
            label: "Plan Alimentario",
            type: "meal_plan",
            section: "general",
            order: 0,
            isActive: true,
            visibleToPatient: true,
            helpText: "Cargá las comidas con sus opciones. Cada opción puede tener video y PDF."
        },
        {
            id: "notes",
            key: "notas_generales",
            label: "Notas Generales",
            type: "textarea",
            section: "general",
            order: 1,
            isActive: true,
            visibleToPatient: true,
            placeholder: "Indicaciones generales para esta semana..."
        }
    ],
    updatedAt: new Date()
}

async function updateConfig() {
    console.log('Updating nutrition_recipe config...')

    const { data, error } = await supabase
        .from('clinical_form_configs')
        .update(newConfig)
        .eq('form_type', 'nutrition_recipe')
        .select()

    if (error) {
        console.error('Error updating config:', error)
    } else {
        console.log('Successfully updated config:', JSON.stringify(data, null, 2))
    }
}

updateConfig()
