const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

//health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'api-gateway', timestamp: new Date() });
});

//proxy rules
const authProxy = createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auth': '/auth' },
    onError: (err, req, res) => {
        res.status(503).json({ error: 'Auth Service unavailable' });
    }
});

app.use('/api/v1/auth', authProxy);

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT}`);
});