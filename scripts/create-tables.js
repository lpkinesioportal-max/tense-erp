/**
 * Create tables in Supabase using the pgmeta API
 * This script uses the service role key to create tables via REST
 */

const SUPABASE_URL = 'https://vbzhuhahtugiwtjfytep.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiemh1aGFodHVnaXd0amZ5dGVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkzODg4NiwiZXhwIjoyMDgwNTE0ODg2fQ.AJxqgBuagMzasCt2sLv9WojD4WVx1bw3RtfNZ_-FNWg';

const fs = require('fs');
const path = require('path');

async function executeSql(sql) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ query: sql })
    });

    return {
        ok: response.ok,
        status: response.status,
        data: await response.text()
    };
}

async function main() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   CREANDO TABLAS EN SUPABASE           ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrations', '000_master_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Ejecutando SQL...\n');

    const result = await executeSql(sql);

    console.log('Status:', result.status);
    console.log('Response:', result.data);

    if (!result.ok) {
        console.log('\n⚠️ La API de ejecución SQL no está disponible.');
        console.log('\n📋 INSTRUCCIONES ALTERNATIVAS:');
        console.log('1. Abrí https://supabase.com/dashboard');
        console.log('2. Seleccioná tu proyecto');
        console.log('3. Ir a SQL Editor');
        console.log('4. Pegá el contenido de: scripts/migrations/000_master_migration.sql');
        console.log('5. Ejecutá el SQL');
    }
}

main().catch(console.error);
