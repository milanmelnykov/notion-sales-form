const { supabase } = require('../config/supabase');

class SupabaseOrderService {
    async createOrder(orderData, files, clientId) {
        // Handle file uploads (simplified - store as JSON for now)
        let designs = null;
        if (files && files.length > 0) {
            designs = files.map(file => ({
                name: file.originalname,
                size: file.size,
                type: file.mimetype
                // In production, upload to Supabase Storage and store URLs
            }));
        }

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                client_id: clientId,
                notes: orderData.notes,
                designs: designs
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = orderData.items.map(item => ({
            item_name: `${item.productName} - ${item.color} - ${item.size}`,
            order_id: order.id,
            product_id: item.productId,
            color: item.color,
            size: item.size,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // Update order totals using functions
        const { error: updateError } = await supabase
            .rpc('update_order_totals', { order_uuid: order.id });

        // If function doesn't exist, calculate manually
        if (updateError) {
            const { data: items } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    clothing_products(price)
                `)
                .eq('order_id', order.id);

            const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
            const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.clothing_products.price), 0);

            await supabase
                .from('orders')
                .update({
                    total_count: totalCount,
                    total_price: totalPrice
                })
                .eq('id', order.id);
        }

        return { success: true, orderId: order.id };
    }

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

module.exports = new SupabaseOrderService();
