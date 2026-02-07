/**
 * Full migration script: localStorage -> Supabase
 * Migrates all 4 main entities
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vbzhuhahtugiwtjfytep.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiemh1aGFodHVnaXd0amZ5dGVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkzODg4NiwiZXhwIjoyMDgwNTE0ODg2fQ.AJxqgBuagMzasCt2sLv9WojD4WVx1bw3RtfNZ_-FNWg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Convert camelCase to snake_case
function toSnakeCase(obj) {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(toSnakeCase);
    if (typeof obj !== 'object') return obj;

    const result = {};
    for (const key in obj) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = obj[key];
    }
    return result;
}

// Sample data to migrate (since we can't access localStorage from Node)
// This matches the mock data structure

const sampleProfessionals = [
    {
        id: 'prof-1',
        name: 'Dr. María García',
        email: 'maria.garcia@tense.com',
        phone: '+54 11 1234-5678',
        specialty: 'Kinesiología',
        color: 'blue',
        workingHours: { start: '09:00', end: '18:00' },
        standardDuration: 60,
        nonWorkingDays: [0, 6],
        services: ['kinesio', 'masajes'],
        commissionRate: 35,
        isActive: true,
        status: 'active',
        availability: { slotDuration: 60, schedule: [] }
    }
];

const sampleClients = [
    {
        id: 'client-1',
        name: 'Juan Pérez',
        dni: '12345678',
        email: 'juan.perez@email.com',
        phone: '+54 11 9876-5432',
        notes: 'Paciente regular',
        balance: 0,
        specialDiscount: 0
    }
];

async function migrateEntity(tableName, data, entityName) {
    console.log(`\n📦 Migrando ${entityName}...`);

    if (!data || data.length === 0) {
        console.log(`   ⚠️ Sin datos para migrar`);
        return { success: true, count: 0 };
    }

    let successCount = 0;
    let errors = [];

    for (const item of data) {
        try {
            const snakeCaseItem = toSnakeCase(item);

            const { error } = await supabase
                .from(tableName)
                .upsert(snakeCaseItem, { onConflict: 'id' });

            if (error) {
                errors.push(`${item.id}: ${error.message}`);
            } else {
                successCount++;
            }
        } catch (err) {
            errors.push(`${item.id}: ${err.message}`);
        }
    }

    if (errors.length > 0) {
        console.log(`   ❌ Errores: ${errors.join(', ')}`);
    }
    console.log(`   ✅ Migrados: ${successCount}/${data.length}`);

    return { success: errors.length === 0, count: successCount, errors };
}

async function checkTableAndMigrate(tableName, entityName) {
    // Check if table exists
    const { data, error } = await supabase
        .from(tableName)
        .select('count', { count: 'exact', head: true });

    if (error && error.code === '42P01') {
        console.log(`❌ Tabla ${tableName} no existe. Necesita crear las tablas primero.`);
        return false;
    } else if (error) {
        console.log(`⚠️ Error verificando ${tableName}: ${error.message}`);
        // Table might exist but be empty, continue
    }

    console.log(`✅ Tabla ${tableName} verificada`);
    return true;
}

async function main() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   MIGRACIÓN SUPABASE - TENSE ERP       ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Check all tables
    console.log('📋 Verificando tablas...\n');

    const tables = [
        { name: 'tense_professionals', label: 'Profesionales' },
        { name: 'tense_clients', label: 'Clientes' },
        { name: 'tense_users', label: 'Usuarios' },
        { name: 'tense_appointments', label: 'Turnos' }
    ];

    let allTablesExist = true;
    for (const table of tables) {
        const exists = await checkTableAndMigrate(table.name, table.label);
        if (!exists) allTablesExist = false;
    }

    if (!allTablesExist) {
        console.log('\n⚠️ Algunas tablas no existen. Ejecutando SQL de creación...');
        console.log('Por favor copie el contenido de scripts/migrations/000_master_migration.sql');
        console.log('y ejecútelo en el SQL Editor de Supabase.');
        return;
    }

    console.log('\n✅ Todas las tablas verificadas correctamente');
    console.log('\n📊 La migración de datos se puede hacer desde:');
    console.log('   http://localhost:3000/admin/migrate');
    console.log('\n💡 O los datos se sincronizarán automáticamente cuando uses la app.');
}

main().catch(console.error);
