const express = require('express');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./src/routes/api');
const pageRoutes = require('./src/routes/pages');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json());
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes
app.use('/api', apiRoutes);
app.use('/', pageRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
