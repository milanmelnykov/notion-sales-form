const { supabase } = require('../config/supabase');

class SupabaseOrderService {
    async createOrder(orderData, files, clientId) {
        // Handle file uploads to Supabase Storage
        let designs = null;
        if (files && files.length > 0) {
            designs = [];
            
            for (const file of files) {
                try {
                    // Generate unique filename
                    const fileName = `${Date.now()}-${file.originalname}`;
                    const filePath = `designs/${clientId}/${fileName}`;
                    
                    // Upload to Supabase Storage
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('order-designs')
                        .upload(filePath, file.buffer, {
                            contentType: file.mimetype,
                            upsert: false
                        });
                    
                    if (uploadError) {
                        console.error('File upload error:', uploadError);
                        continue;
                    }
                    
                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from('order-designs')
                        .getPublicUrl(filePath);
                    
                    designs.push({
                        name: file.originalname,
                        size: file.size,
                        type: file.mimetype,
                        url: urlData.publicUrl,
                        path: filePath
                    });
                } catch (error) {
                    console.error('Design upload failed:', error);
                }
            }
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
