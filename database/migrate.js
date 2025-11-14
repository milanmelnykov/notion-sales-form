const { supabase } = require('../src/config/supabase');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🚀 Starting Supabase migration...');
        
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Executing schema...');
        
        // Execute the full schema at once
        const { data, error } = await supabase
            .rpc('exec_sql', { sql: schema })
            .single();
        
        if (error) {
            console.error('❌ Schema execution failed:', error);
            // Try alternative method
            console.log('Trying alternative execution method...');
            
            // Remove schema creation and use public schema
            const publicSchema = schema
                .replace(/CREATE SCHEMA IF NOT EXISTS ghostlab;/g, '')
                .replace(/SET search_path TO ghostlab, public;/g, '')
                .replace(/DROP TABLE IF EXISTS/g, 'DROP TABLE IF EXISTS public.')
                .replace(/CREATE TABLE /g, 'CREATE TABLE public.')
                .replace(/CREATE INDEX /g, 'CREATE INDEX ')
                .replace(/CREATE OR REPLACE FUNCTION /g, 'CREATE OR REPLACE FUNCTION public.')
                .replace(/CREATE TRIGGER /g, 'CREATE TRIGGER ');
            
            const { data: altData, error: altError } = await supabase
                .rpc('exec_sql', { sql: publicSchema });
            
            if (altError) {
                console.error('❌ Alternative execution also failed:', altError);
                return;
            }
        }
        
        console.log('✅ Schema executed successfully');
        
        // Execute seed data
        const seedPath = path.join(__dirname, 'seed.sql');
        if (fs.existsSync(seedPath)) {
            console.log('🌱 Executing seed data...');
            const seedData = fs.readFileSync(seedPath, 'utf8');
            
            const { data: seedResult, error: seedError } = await supabase
                .rpc('exec_sql', { sql: seedData });
            
            if (seedError) {
                console.error('❌ Seed data failed:', seedError);
            } else {
                console.log('✅ Seed data completed');
            }
        }
        
        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
