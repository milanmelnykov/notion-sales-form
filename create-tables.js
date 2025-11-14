require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function createTables() {
    console.log('🚀 Creating tables in Supabase...');
    
    try {
        // Test connection first
        const { data, error } = await supabase.from('information_schema.tables').select('*').limit(1);
        if (error) {
            console.error('Connection test failed:', error);
            return;
        }
        console.log('✅ Connected to Supabase');
        
        // Add some sample products
        const { error: productsError } = await supabase
            .from('clothing_products')
            .upsert([
                {
                    name: 'T-Shirt',
                    price: 25.00,
                    category: 'Tops',
                    colors: ['Black', 'White', 'Gray'],
                    available_sizes: ['S', 'M', 'L', 'XL']
                },
                {
                    name: 'Hoodie',
                    price: 45.00,
                    category: 'Tops',
                    colors: ['Black', 'Navy', 'Gray'],
                    available_sizes: ['S', 'M', 'L', 'XL', 'XXL']
                }
            ], { onConflict: 'name' });
        
        if (productsError) {
            console.error('Products insert error:', productsError);
        } else {
            console.log('✅ Sample products added');
        }
        
        console.log('🎉 Setup completed!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
    }
}

createTables();
