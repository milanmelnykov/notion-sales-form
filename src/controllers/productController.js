const orderService = require('../services/orderService');

class ProductController {
    async getProducts(req, res) {
        try {
            const products = await orderService.getProducts();
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ProductController();
