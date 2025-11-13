const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Authentication pages
router.get('/signin', authController.renderSignIn);
router.get('/signup', authController.renderSignUp);

// Authentication API
router.post('/signin', authController.signIn);
router.post('/signup', authController.signUp);
router.post('/signout', authController.signOut);
router.get('/client-data', authController.getClientData);
router.post('/update-profile', authController.updateProfile);

module.exports = router;
