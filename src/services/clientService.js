const { notion, DATABASES } = require('../config/notion');

class ClientService {
    async findClientByEmail(email) {
        const response = await notion.databases.query({
            database_id: DATABASES.CLIENTS,
            filter: {
                property: 'Email',
                email: {
                    equals: email
                }
            }
        });

        if (response.results.length > 0) {
            const client = response.results[0];
            return {
                id: client.id,
                name: client.properties.Name?.title[0]?.plain_text || '',
                email: client.properties.Email?.email || '',
                telegramUsername: client.properties['Telegram Username']?.rich_text[0]?.plain_text || '',
                phoneNumber: client.properties['Phone Number']?.phone_number || '',
                notes: client.properties.Notes?.rich_text[0]?.plain_text || ''
            };
        }
        return null;
    }

    async createClient(clientData) {
        // Ensure telegram username has @ prefix
        let telegramUsername = clientData.telegramUsername || '';
        if (telegramUsername && !telegramUsername.startsWith('@')) {
            telegramUsername = '@' + telegramUsername;
        }

        const clientProps = {
            'Name': { title: [{ text: { content: clientData.name.trim() } }] },
            'Email': { email: clientData.email },
            'Telegram Username': { rich_text: [{ text: { content: telegramUsername } }] }
        };

        if (clientData.phoneNumber) {
            clientProps['Phone Number'] = { phone_number: clientData.phoneNumber };
        }

        if (clientData.notes) {
            clientProps['Notes'] = { rich_text: [{ text: { content: clientData.notes } }] };
        }

        const response = await notion.pages.create({
            parent: { database_id: DATABASES.CLIENTS },
            properties: clientProps
        });

        return {
            id: response.id,
            name: clientData.name,
            email: clientData.email,
            telegramUsername: telegramUsername,
            phoneNumber: clientData.phoneNumber || '',
            notes: clientData.notes || ''
        };
    }

    async updateClient(clientId, updateData) {
        // Ensure telegram username has @ prefix
        let telegramUsername = updateData.telegramUsername || '';
        if (telegramUsername && !telegramUsername.startsWith('@')) {
            telegramUsername = '@' + telegramUsername;
        }

        const updateProps = {
            'Name': { title: [{ text: { content: updateData.name.trim() } }] },
            'Telegram Username': { rich_text: [{ text: { content: telegramUsername } }] }
        };

        if (updateData.phoneNumber) {
            updateProps['Phone Number'] = { phone_number: updateData.phoneNumber };
        } else {
            updateProps['Phone Number'] = { phone_number: null };
        }

        await notion.pages.update({
            page_id: clientId,
            properties: updateProps
        });

        return {
            id: clientId,
            name: updateData.name,
            telegramUsername: telegramUsername,
            phoneNumber: updateData.phoneNumber || ''
        };
    }

    async getClientOrders(clientId) {
        const response = await notion.databases.query({
            database_id: DATABASES.ORDERS,
            filter: {
                property: 'Client',
                relation: {
                    contains: clientId
                }
            },
            sorts: [
                {
                    property: 'Added',
                    direction: 'descending'
                }
            ]
        });

        // Get order items for each order
        const ordersWithDetails = await Promise.all(response.results.map(async (order) => {
            const itemsResponse = await notion.databases.query({
                database_id: DATABASES.ORDER_ITEMS,
                filter: {
                    property: 'Order',
                    relation: {
                        contains: order.id
                    }
                }
            });

            // Extract item details from Order Items
            const items = itemsResponse.results.map(item => {
                const rollupValue = item.properties['Price for One']?.rollup;
                let priceForOne = 0;
                
                if (rollupValue?.type === 'number') {
                    priceForOne = rollupValue.number || 0;
                } else if (rollupValue?.array && rollupValue.array.length > 0) {
                    priceForOne = rollupValue.array[0]?.number || 0;
                }
                
                return {
                    name: item.properties.Item?.title[0]?.plain_text || 'Unknown Item',
                    quantity: item.properties.Quantity?.number || 0,
                    priceForOne,
                    totalPrice: item.properties['Total Price']?.formula?.number || 0
                };
            });

            return {
                id: order.id,
                name: order.properties.Name?.title[0]?.plain_text || '',
                status: order.properties.Status?.status?.name || 'Pending',
                orderId: order.properties['Order ID']?.rich_text[0]?.plain_text || '',
                totalCount: order.properties['Total Count']?.formula?.number || 0,
                totalPrice: order.properties['Total Price']?.formula?.number || 0,
                added: order.properties.Added?.created_time || '',
                notes: order.properties.Notes?.rich_text[0]?.plain_text || '',
                designs: order.properties.Designs?.files || [],
                items
            };
        }));

        return ordersWithDetails;
    }
}

module.exports = new ClientService();
