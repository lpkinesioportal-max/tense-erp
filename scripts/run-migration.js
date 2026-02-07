/**
 * Script to execute SQL migrations on Supabase
 * Uses the Supabase Management API to run SQL directly
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://vbzhuhahtugiwtjfytep.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiemh1aGFodHVnaXd0amZ5dGVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkzODg4NiwiZXhwIjoyMDgwNTE0ODg2fQ.AJxqgBuagMzasCt2sLv9WojD4WVx1bw3RtfNZ_-FNWg';

async function executeSql(sql) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

        // Try using the SQL endpoint directly
        const postData = JSON.stringify({ query: sql });

        const options = {
            hostname: 'vbzhuhahtugiwtjfytep.supabase.co',
            path: '/rest/v1/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer': 'return=representation'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, data });
                } else {
                    resolve({ success: false, error: data, statusCode: res.statusCode });
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function main() {
    console.log('=== Supabase SQL Migration Script ===\n');

    const migrationPath = path.join(__dirname, 'migrations', '000_master_migration.sql');

    if (!fs.existsSync(migrationPath)) {
        console.error('Migration file not found:', migrationPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log('Loaded migration file. Executing...\n');

    try {
        const result = await executeSql(sql);
        if (result.success) {
            console.log('✅ Migration executed successfully!');
            console.log(result.data);
        } else {
            console.log('Migration response:', result);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();
