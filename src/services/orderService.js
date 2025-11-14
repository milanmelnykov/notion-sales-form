const supabaseOrderService = require('./supabaseOrderService');

class OrderService {
    async createOrder(orderData, files, clientId = null) {
        return await supabaseOrderService.createOrder(orderData, files, clientId);
    }

    async getProducts() {
        return await supabaseOrderService.getProducts();
    }
}

module.exports = new OrderService();
