const express = require('express');
const path = require('path');
const authController = require('../controllers/authController');

const router = express.Router();

// Root redirect to signin
router.get('/', (req, res) => {
    if (req.session.client) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/signin');
    }
});

// Authentication pages (moved to /auth routes)
router.get('/signin', (req, res) => res.redirect('/auth/signin'));
router.get('/signup', (req, res) => res.redirect('/auth/signup'));

// Dashboard (protected)
router.get('/dashboard', authController.renderDashboard);

// Profile (protected)
router.get('/profile', authController.renderProfile);

// Order form page (protected)
router.get('/order', (req, res) => {
    if (!req.session.client) {
        return res.redirect('/signin');
    }
    res.sendFile(path.join(__dirname, '../../views/order.html'));
});

module.exports = router;
