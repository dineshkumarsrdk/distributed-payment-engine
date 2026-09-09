const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
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
  target: `${process.env.AUTH_SERVICE_URL}`,
  changeOrigin: true,
  //path rewrited as /auth/url passed to proxy
  pathRewrite: {
    '^/': '/auth/',
  },
  on: {
    proxyReq: fixRequestBody,
    error: (err, req, res) => {
      console.error('Auth proxy error:', err);
      if (!res.headersSent) {
        res.status(503).json({ error: 'Auth Service unavailable' });
      }
    },
  },
});

const accountProxy = createProxyMiddleware({
  target: `${process.env.ACCOUNT_SERVICE_URL}`,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/accounts/',
  },
  on: {
    proxyReq: fixRequestBody,
    error: (err, req, res) => {
      console.error('Account proxy error:', err);
      if (!res.headersSent) {
        res.status(503).json({ error: 'Account Service unavailable' });
      }
    },
  },
});

const transactionProxy = createProxyMiddleware({
  target: `${process.env.TRANSACTION_SERVICE_URL}`,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/transactions/',
  },
  on: {
    proxyReq: fixRequestBody,
    error: (err, req, res) => {
      console.error('Transaction proxy error:', err);
      if (!res.headersSent) {
        res.status(503).json({ error: 'Transaction Service unavailable' });
      }
    },
  },
});

// app.use('/api/v1/auth', (req, res, next) => {
//     console.log(req.body);
//     next();
// });

//stripes the mount /api/v1/auth and passes the remaining url to proxy
app.use('/api/v1/auth', authProxy);
app.use('/api/v1/accounts', accountProxy);
app.use('/api/v1/transactions', transactionProxy)

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT}`);
});