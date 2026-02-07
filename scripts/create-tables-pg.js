/**
 * Create all Supabase tables using direct PostgreSQL connection
 */

// Disable strict SSL for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgres://postgres.vbzhuhahtugiwtjfytep:pR69BlJF1a9DnW8U@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   CREANDO TABLAS EN SUPABASE           ║');
    console.log('╚════════════════════════════════════════╝\n');

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Conectando a PostgreSQL...');
        await client.connect();
        console.log('✅ Conectado!\n');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'migrations', '000_master_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('Ejecutando migraciones...\n');

        // Split SQL into individual statements and execute
        const statements = sql.split(';').filter(s => s.trim().length > 0);

        let successCount = 0;
        let errorCount = 0;

        for (const statement of statements) {
            const trimmed = statement.trim();
            if (!trimmed) continue;

            try {
                await client.query(trimmed);
                successCount++;

                // Log table creation
                if (trimmed.toUpperCase().includes('CREATE TABLE')) {
                    const match = trimmed.match(/CREATE TABLE[^(]*(\w+)/i);
                    if (match) {
                        console.log(`  ✅ Tabla creada: ${match[1]}`);
                    }
                }
            } catch (err) {
                // Ignore "already exists" errors
                if (err.message.includes('already exists')) {
                    console.log(`  ⏭️ Ya existe: ${err.message.split('"')[1] || 'objeto'}`);
                } else if (err.message.includes('does not exist')) {
                    // Ignore drop errors for non-existent objects
                } else {
                    console.log(`  ⚠️ Error: ${err.message.substring(0, 60)}`);
                    errorCount++;
                }
            }
        }

        console.log('\n════════════════════════════════════════');
        console.log(`✅ Operaciones exitosas: ${successCount}`);
        console.log(`⚠️ Errores: ${errorCount}`);
        console.log('════════════════════════════════════════\n');

        // Verify tables
        console.log('Verificando tablas creadas...\n');
        const tables = ['tense_professionals', 'tense_clients', 'tense_users', 'tense_appointments'];

        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`  ✅ ${table} - OK`);
            } catch (err) {
                console.log(`  ❌ ${table} - No existe`);
            }
        }

    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
    } finally {
        await client.end();
        console.log('\n✅ Conexión cerrada');
    }
}

main().catch(console.error);
