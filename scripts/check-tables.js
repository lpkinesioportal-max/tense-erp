/**
 * Execute SQL migration directly on Supabase using pg connection
 * This uses the postgres connection string to run SQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://vbzhuhahtugiwtjfytep.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiemh1aGFodHVnaXd0amZ5dGVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkzODg4NiwiZXhwIjoyMDgwNTE0ODg2fQ.AJxqgBuagMzasCt2sLv9WojD4WVx1bw3RtfNZ_-FNWg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTablesViaSql() {
    console.log('=== Creating Supabase Tables ===\n');

    // We'll create tables one by one using the Supabase client
    // Since we can't run raw SQL, we'll check if table exists by trying to select

    const tables = ['tense_professionals', 'tense_clients', 'tense_users', 'tense_appointments'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });

        if (error && error.code === '42P01') {
            console.log(`❌ Table ${table} does not exist. Please run SQL migration manually.`);
        } else if (error) {
            console.log(`⚠️ Table ${table}: ${error.message}`);
        } else {
            console.log(`✅ Table ${table} exists!`);
        }
    }

    console.log('\n=== Table Check Complete ===');
    console.log('\nIf tables do not exist, copy the content of:');
    console.log('scripts/migrations/000_master_migration.sql');
    console.log('And paste it in the Supabase SQL Editor at:');
    console.log('https://vbzhuhahtugiwtjfytep.supabase.co/project/vbzhuhahtugiwtjfytep/sql');
}

createTablesViaSql().catch(console.error);
