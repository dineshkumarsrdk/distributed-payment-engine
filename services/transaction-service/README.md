# Transaction Service

The Transaction Service orchestrates payment transfer flows and coordinates asynchronous processing for distributed financial transactions.

## Responsibilities

- Receive transfer requests from clients
- Call downstream account processing logic
- Publish transfer events to RabbitMQ
- Consume queued work through a payment processor worker
- Support retry and dead-letter queue patterns
- Expose metrics and health information

## Tech Stack

- Node.js + Express
- RabbitMQ for asynchronous processing
- Redis for runtime coordination
- Prometheus metrics
- Winston logging
- Axios for downstream service requests
- `opossum` circuit breaker support

## Default Configuration

- Port: `4003`
- Health endpoint: `GET /health`
- Metrics endpoint: `GET /metrics`

## Routes

- `POST /transactions/transfer` - initiate a transfer workflow

## Local Development

```bash
cd services/transaction-service
npm install
npm run dev
```

## Docker

```bash
docker build -t transaction-service ./services/transaction-service
```

## Environment Variables

```bash
PORT=4003
ACCOUNT_SERVICE_URL=http://account-service:4002
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=mq_admin
RABBITMQ_PASS=mq_secret
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret
EXCHANGE_NAME=transaction_exchange
QUEUE_NAME=payment_queue
ROUTING_KEY=payment.process
DLX_NAME=transaction_dlx
DLQ_NAME=payment_dlq
DLQ_ROUTING_KEY=payment.dead_letter
RTX_NAME=transaction_retry_exchange
RTQ_NAME=payment_retry_queue
RTQ_ROUTING_KEY=payment.retry
JWT_SECRET=super_secret_jwt_key
```

## Messaging Flow

The service connects to RabbitMQ, starts a payment processor worker, and handles transfer execution asynchronously to decouple request handling from long-running payment workflows.
