const { supabase } = require('../config/supabase');

class SupabaseClientService {
    async findClientByEmail(email) {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
        }

        return data;
    }

    async createClient(clientData) {
        // Ensure telegram username has @ prefix
        let telegramUsername = clientData.telegramUsername || '';
        if (telegramUsername && !telegramUsername.startsWith('@')) {
            telegramUsername = '@' + telegramUsername;
        }

        const { data, error } = await supabase
            .from('clients')
            .insert({
                name: clientData.name.trim(),
                email: clientData.email,
                telegram_username: telegramUsername,
                phone_number: clientData.phoneNumber || null,
                notes: clientData.notes || null
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            telegramUsername: data.telegram_username,
            phoneNumber: data.phone_number,
            notes: data.notes
        };
    }

    async updateClient(clientId, updateData) {
        // Ensure telegram username has @ prefix
        let telegramUsername = updateData.telegramUsername || '';
        if (telegramUsername && !telegramUsername.startsWith('@')) {
            telegramUsername = '@' + telegramUsername;
        }

        const { data, error } = await supabase
            .from('clients')
            .update({
                name: updateData.name.trim(),
                telegram_username: telegramUsername,
                phone_number: updateData.phoneNumber || null
            })
            .eq('id', clientId)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            telegramUsername: data.telegram_username,
            phoneNumber: data.phone_number,
            notes: data.notes
        };
    }

    async getClientOrders(clientId) {
        try {
            // Get orders with calculated totals using functions
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Orders query error:', error);
                throw error;
            }

            // If no orders, return empty array
            if (!orders || orders.length === 0) {
                return [];
            }

            // Get order items for each order
            const ordersWithItems = await Promise.all(orders.map(async (order) => {
                const { data: items, error: itemsError } = await supabase
                    .from('order_items')
                    .select(`
                        *,
                        clothing_products(name, price)
                    `)
                    .eq('order_id', order.id);

                if (itemsError) {
                    console.error('Order items query error:', itemsError);
                    // Continue with empty items if query fails
                }

                const processedItems = (items || []).map(item => ({
                    name: item.item_name,
                    quantity: item.quantity,
                    priceForOne: item.clothing_products?.price || 0,
                    totalPrice: item.quantity * (item.clothing_products?.price || 0)
                }));

                return {
                    id: order.id,
                    name: `Order #${order.id.slice(0, 8)}`,
                    status: order.status,
                    orderId: order.id.slice(0, 8), // Use first 8 chars of UUID as order ID
                    totalCount: order.total_count || 0,
                    totalPrice: order.total_price || 0,
                    added: order.created_at,
                    notes: order.notes,
                    designs: order.designs || [],
                    items: processedItems
                };
            }));

            return ordersWithItems;
        } catch (error) {
            console.error('getClientOrders error:', error);
            // Return empty array instead of throwing to prevent dashboard crash
            return [];
        }
    }
}

module.exports = new SupabaseClientService();
