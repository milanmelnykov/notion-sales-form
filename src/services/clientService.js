const supabaseClientService = require('./supabaseClientService');

class ClientService {
    async findClientByEmail(email) {
        return await supabaseClientService.findClientByEmail(email);
    }

    async createClient(clientData) {
        return await supabaseClientService.createClient(clientData);
    }

    async updateClient(clientId, updateData) {
        return await supabaseClientService.updateClient(clientId, updateData);
    }

    async getClientOrders(clientId) {
        return await supabaseClientService.getClientOrders(clientId);
    }
}

module.exports = new ClientService();
