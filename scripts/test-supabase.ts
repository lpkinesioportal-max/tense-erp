import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno manualmente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Faltan variables de entorno en .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    console.log('Intentando conectar a Supabase...')
    console.log('URL:', supabaseUrl)

    try {
        // Intentamos listar las tablas o hacer un query simple
        // Usamos 'liquidaciones_diarias' que sabemos que existe por el código anterior
        const { data, error } = await supabase
            .from('liquidaciones_diarias')
            .select('count', { count: 'exact', head: true })

        if (error) {
            console.error('Error al conectar con Supabase:', error.message)
            process.exit(1)
        }

        console.log('✅ Conexión exitosa!')
        console.log('Se pudo acceder a la tabla "liquidaciones_diarias".')
        process.exit(0)
    } catch (err) {
        console.error('Error inesperado:', err)
        process.exit(1)
    }
}

testConnection()
