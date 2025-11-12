const express = require('express');
const multer = require('multer');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Product routes
router.get('/products', productController.getProducts);

// Order routes
router.post('/create-order', upload.array('photos', 10), orderController.createOrder);

module.exports = router;
