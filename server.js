const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./src/routes/api');
const pageRoutes = require('./src/routes/pages');
const authRoutes = require('./src/routes/auth');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'ghostlab-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
app.use(express.json());
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);
app.use('/', pageRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
