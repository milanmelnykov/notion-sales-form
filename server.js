const express = require('express');
const multer = require('multer');
const { Client } = require('@notionhq/client');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Serve order form at /order endpoint
app.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve other static files
app.use(express.static('.', { index: false }));

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const PRODUCTS_DB = '2a8686ba-9410-80aa-b724-f14d08478ecc';
const ORDER_CANDIDATES_DB = '62ef3fc0-ccf4-491a-ae14-b0359e58227a';
const ORDER_ITEMS_DB = '88a092ce-387e-4616-b86e-7ec93ac3f3e9';

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: PRODUCTS_DB
        });
        
        const products = response.results.map(page => ({
            id: page.id,
            name: page.properties.Name?.title[0]?.plain_text || 'Unnamed',
            colors: page.properties.Color?.multi_select?.map(c => c.name) || [],
            sizes: page.properties['Available Sizes']?.multi_select?.map(s => s.name) || [],
            price: page.properties.Price?.number || 0
        }));
        
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload file to Notion using 2-step process
async function uploadFileToNotion(fileBuffer, filename, contentType) {
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

    // Step 2: Send file data as multipart form data
    const FormData = require('form-data');
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

// Create order candidate with items
app.post('/api/create-order', upload.array('photos', 10), async (req, res) => {
    try {
        const { customerName, customerEmail, notes, items } = JSON.parse(req.body.data);

        if (!customerName || customerName.trim() === '') {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        // Upload photos if provided
        const fileUploadIds = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const uploadId = await uploadFileToNotion(
                        file.buffer,
                        file.originalname,
                        file.mimetype
                    );
                    fileUploadIds.push({ id: uploadId, name: file.originalname });
                } catch (error) {
                    console.error('Photo upload failed:', error);
                }
            }
        }

        // Create order candidate
        const orderProps = {
            'Name': { title: [{ text: { content: customerName.trim() } }] },
            'Telegram ID': { rich_text: [{ text: { content: customerEmail || '' } }] }
        };

        if (notes) {
            orderProps['Notes'] = { rich_text: [{ text: { content: notes } }] };
        }

        if (fileUploadIds.length > 0) {
            orderProps['Designs'] = { 
                files: fileUploadIds.map(f => ({ 
                    type: 'file_upload',
                    file_upload: { id: f.id },
                    name: f.name
                }))
            };
        }

        const order = await notion.pages.create({
            parent: { database_id: ORDER_CANDIDATES_DB },
            properties: orderProps
        });

        // Create order items
        for (const item of items) {
            await notion.pages.create({
                parent: { database_id: ORDER_ITEMS_DB },
                properties: {
                    'Item': { title: [{ text: { content: `${item.productName} - ${item.color} - ${item.size} - ${item.quantity}x` } }] },
                    'Order Candidate': { relation: [{ id: order.id }] },
                    'Product': { relation: [{ id: item.productId }] },
                    'Color': { select: { name: item.color } },
                    'Size': { select: { name: item.size } },
                    'Quantity': { number: item.quantity }
                }
            });
        }

        res.json({ success: true, orderId: order.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
