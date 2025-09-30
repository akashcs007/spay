const cors = require('cors');

// CORS configuration to allow all origins during local development
// In production, you would restrict 'origin' to your frontend URL(s)
const corsMiddleware = cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
});

module.exports = corsMiddleware;
