const orderService = require('../services/orderService');

class OrderController {
    async createOrder(req, res) {
        try {
            const { customerName, customerEmail, notes, items } = JSON.parse(req.body.data);

            if (!customerName || customerName.trim() === '') {
                return res.status(400).json({ error: 'Customer name is required' });
            }

            const result = await orderService.createOrder({
                customerName,
                customerEmail,
                notes,
                items
            }, req.files);

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    renderOrderForm(req, res) {
        res.sendFile(path.join(__dirname, '../../views/order.html'));
    }
}

module.exports = new OrderController();
