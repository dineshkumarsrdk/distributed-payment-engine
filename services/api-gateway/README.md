# API Gateway

The API Gateway is the public entry point for the distributed payment system. It routes external requests to the appropriate backend services and centralizes concerns like auth, rate limiting, metrics, and correlation tracking.

## Responsibilities

- Expose a single public API
- Proxy requests to Auth, Account, and Transaction services
- Enforce request rate limits using Redis-backed storage
- Collect service metrics and expose a Prometheus endpoint
- Add correlation IDs for request tracing

## Tech Stack

- Node.js + Express
- `http-proxy-middleware` for service routing
- Redis for rate limiting
- Prometheus client for metrics
- Helmet and CORS for security headers

## Default Configuration

- Port: `3000`
- Health endpoint: `GET /health`
- Metrics endpoint: `GET /metrics`

## Route Mapping

- `GET /api/v1/auth/*` -> Auth Service
- `GET /api/v1/accounts/*` -> Account Service
- `GET /api/v1/transactions/*` -> Transaction Service

## Local Development

```bash
cd services/api-gateway
npm install
npm run dev
```

## Docker

```bash
docker build -t api-gateway ./services/api-gateway
```

## Environment Variables

```bash
PORT=3000
AUTH_SERVICE_URL=http://auth-service:4001
ACCOUNT_SERVICE_URL=http://account-service:4002
TRANSACTION_SERVICE_URL=http://transaction-service:4003
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret
```

## Observability

The gateway publishes basic metrics and includes a correlation ID middleware, which helps trace a single request across multiple services.
