const path = require('path');
const clientService = require('../services/clientService');

class AuthController {
    renderSignIn(req, res) {
        res.sendFile(path.join(__dirname, '../../views/signin.html'));
    }

    renderSignUp(req, res) {
        res.sendFile(path.join(__dirname, '../../views/signup.html'));
    }

    renderDashboard(req, res) {
        if (!req.session.client) {
            return res.redirect('/signin');
        }
        res.sendFile(path.join(__dirname, '../../views/dashboard.html'));
    }

    async signIn(req, res) {
        try {
            const { email, pin } = req.body;

            if (!email || !pin) {
                return res.status(400).json({ error: 'Email and PIN are required' });
            }

            const client = await clientService.verifyPin(email, pin);
            
            if (!client) {
                return res.status(401).json({ error: 'Invalid email or PIN' });
            }

            req.session.client = client;
            
            // Force session save
            req.session.save((err) => {
                if (err) {
                    return res.status(500).json({ error: 'Session save failed' });
                }
                res.json({ success: true, client });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async signUp(req, res) {
        try {
            const { name, email, pin, telegramUsername, phoneNumber, notes } = req.body;

            if (!name || !email || !pin) {
                return res.status(400).json({ error: 'Name, email, and PIN are required' });
            }

            if (pin.length < 4 || pin.length > 6) {
                return res.status(400).json({ error: 'PIN must be 4-6 digits' });
            }

            // Check if client already exists
            const existingClient = await clientService.findClientByEmail(email);
            if (existingClient) {
                return res.status(409).json({ error: 'Client with this email already exists' });
            }

            const client = await clientService.createClient({
                name,
                email,
                pin,
                telegramUsername,
                phoneNumber,
                notes
            });

            req.session.client = client;
            res.json({ success: true, client });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    signOut(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Could not sign out' });
            }
            res.json({ success: true });
        });
    }

    renderProfile(req, res) {
        if (!req.session.client) {
            return res.redirect('/signin');
        }
        res.sendFile(path.join(__dirname, '../../views/profile.html'));
    }

    async updateProfile(req, res) {
        try {
            if (!req.session.client) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { name, telegramUsername, phoneNumber } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            const updatedClient = await clientService.updateClient(req.session.client.id, {
                name,
                telegramUsername,
                phoneNumber
            });

            // Update session with new data
            req.session.client = {
                ...req.session.client,
                ...updatedClient
            };

            res.json({ success: true, client: req.session.client });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getClientData(req, res) {
        if (!req.session.client) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const orders = await clientService.getClientOrders(req.session.client.id);
            res.json({
                client: req.session.client,
                orders
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AuthController();
