const notionService = require('./notionService');

class OrderService {
    async createOrder(orderData, files, clientId = null) {
        // Upload photos if provided
        const fileUploadIds = [];
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const uploadId = await notionService.uploadFile(
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

        // Create order
        const order = await notionService.createOrder({
            ...orderData,
            fileUploadIds,
            clientId
        });

        // Create order items
        for (const item of orderData.items) {
            await notionService.createOrderItem(item, order.id);
        }

        return { success: true, orderId: order.id };
    }

    async getProducts() {
        return await notionService.getProducts();
    }
}

module.exports = new OrderService();
