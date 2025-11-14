const { supabase } = require('../config/supabase');

class SupabaseProductService {
    async getProducts() {
        const { data, error } = await supabase
            .from('clothing_products')
            .select('*')
            .order('name');

        if (error) throw error;

        return data.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            colors: product.colors || [],
            sizes: product.available_sizes || []
        }));
    }
}

module.exports = new SupabaseProductService();
