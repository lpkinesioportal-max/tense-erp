const { createClient } = require('@supabase/supabase-js')

// Valores proporcionados por el usuario
const supabaseUrl = 'https://vbzhuhahtugiwtjfytep.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiemh1aGFodHVnaXd0amZ5dGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Mzg4ODYsImV4cCI6MjA4MDUxNDg4Nn0.cyTxchM3SsElN1u9g9C9XJ8jMSA0UJDyxrhEo5Tp6Go'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    console.log('Intentando conectar a Supabase...')

    try {
        // Intentamos un query simple a la tabla 'liquidaciones_diarias'
        const { data, error, count } = await supabase
            .from('liquidaciones_diarias')
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.error('❌ Error de conexión:', error.message)
            console.error('Detalles:', error)
            process.exit(1)
        }

        console.log('✅ ¡Conexión exitosa!')
        console.log('Se pudo acceder a la tabla "liquidaciones_diarias".')
        console.log('Total de registros encontrados:', count)
        process.exit(0)
    } catch (err) {
        console.error('❌ Error inesperado:', err.message)
        process.exit(1)
    }
}

testConnection()
