const express = require('express');
const path = require('path');

const router = express.Router();

// Order form page
router.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/order.html'));
});

module.exports = router;
