// server.js

require('dotenv').config();
const express = require('express');
const db = require('./src/config/db'); 
const authRoutes = require('./src/routes/authRoutes');
const walletRoutes = require('./src/routes/walletRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes');
const corsMiddleware = require('./src/middleware/corsMiddleware'); // ADD THIS LINE

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware); // <-- CRITICAL: MUST BE HERE
app.use(express.json()); // Allows parsing of JSON request bodies

// Database Connection Check
db.connect()
  .then(() => console.log('✅ Database connected successfully.'))
  .catch(err => {
    console.error('❌ Database connection failed:', err.stack);
  });

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);

// Simple test route
app.get('/', (req, res) => {
    res.status(200).send('Token Escrow Platform API is running.');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});
