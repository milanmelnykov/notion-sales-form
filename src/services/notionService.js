const fetch = require('node-fetch');
const FormData = require('form-data');
const { notion, DATABASES } = require('../config/notion');

class NotionService {
    async getProducts() {
        const response = await notion.databases.query({
            database_id: DATABASES.PRODUCTS
        });
        
        return response.results.map(page => ({
            id: page.id,
            name: page.properties.Name?.title[0]?.plain_text || 'Unnamed',
            colors: page.properties.Color?.multi_select?.map(c => c.name) || [],
            sizes: page.properties['Available Sizes']?.multi_select?.map(s => s.name) || [],
            price: page.properties.Price?.number || 0
        }));
    }

    async uploadFile(fileBuffer, filename, contentType) {
        // Step 1: Create file upload
        const createResponse = await fetch('https://api.notion.com/v1/file_uploads', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: filename,
                content_type: contentType,
                file_size: fileBuffer.length
            })
        });

        const createData = await createResponse.json();
        
        if (!createResponse.ok) {
            throw new Error(`Create upload failed: ${JSON.stringify(createData)}`);
        }

        const { id: uploadId, upload_url } = createData;

        // Step 2: Send file data
        const formData = new FormData();
        formData.append('file', fileBuffer, { filename, contentType });

        const sendResponse = await fetch(upload_url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                ...formData.getHeaders()
            },
            body: formData
        });

        const sendData = await sendResponse.json();
        
        if (!sendResponse.ok) {
            throw new Error(`Send file failed: ${JSON.stringify(sendData)}`);
        }

        return uploadId;
    }

    async createOrder(orderData) {
        // Ensure telegram ID has @ prefix (for non-authenticated orders)
        let telegramId = orderData.customerEmail || '';
        if (telegramId && !telegramId.startsWith('@')) {
            telegramId = '@' + telegramId;
        }

        const orderProps = {
            'Name': { title: [{ text: { content: orderData.customerName?.trim() || 'Order' } }] }
        };

        // If client is authenticated, link to client
        if (orderData.clientId) {
            orderProps['Client'] = { relation: [{ id: orderData.clientId }] };
        } else {
            // For non-authenticated orders, store contact info directly
            orderProps['Telegram ID'] = { rich_text: [{ text: { content: telegramId } }] };
        }

        if (orderData.notes) {
            orderProps['Notes'] = { rich_text: [{ text: { content: orderData.notes } }] };
        }

        if (orderData.fileUploadIds && orderData.fileUploadIds.length > 0) {
            orderProps['Designs'] = { 
                files: orderData.fileUploadIds.map(f => ({ 
                    type: 'file_upload',
                    file_upload: { id: f.id },
                    name: f.name
                }))
            };
        }

        return await notion.pages.create({
            parent: { database_id: DATABASES.ORDERS },
            properties: orderProps
        });
    }

    async createOrderItem(itemData, orderId) {
        return await notion.pages.create({
            parent: { database_id: DATABASES.ORDER_ITEMS },
            properties: {
                'Item': { title: [{ text: { content: `${itemData.productName} - ${itemData.color} - ${itemData.size} - ${itemData.quantity}x` } }] },
                'Order': { relation: [{ id: orderId }] },
                'Product': { relation: [{ id: itemData.productId }] },
                'Color': { select: { name: itemData.color } },
                'Size': { select: { name: itemData.size } },
                'Quantity': { number: itemData.quantity }
            }
        });
    }
}

module.exports = new NotionService();
