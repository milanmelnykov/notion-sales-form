const orderService = require('../services/orderService');

class OrderController {
    async createOrder(req, res) {
        try {
            const { notes, items } = JSON.parse(req.body.data);
            const clientId = req.session.client?.id;

            // Require authentication for new order flow
            if (!clientId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const orderData = {
                customerName: req.session.client.name,
                customerEmail: req.session.client.telegramUsername,
                notes,
                items
            };

            const result = await orderService.createOrder(orderData, req.files, clientId);

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new OrderController();
