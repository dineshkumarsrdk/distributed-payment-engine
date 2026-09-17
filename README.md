# Distributed Payment Engine

A distributed payment processing platform built as a set of microservices for authentication, account management, transaction orchestration, and API routing.

## Architecture

The solution is composed of the following services:

- API Gateway: routes incoming requests to the downstream services and provides request throttling, metrics, and correlation IDs.
- Auth Service: registers users, authenticates them, and issues/validates JWT tokens.
- Account Service: manages customer accounts and handles account-level transfers and audit logs.
- Transaction Service: initiates payment transfers, publishes events to RabbitMQ, and processes payment work using a worker.

Infrastructure components include:

- PostgreSQL for core user/account data
- MongoDB for audit log storage
- Redis for caching and rate limiting
- RabbitMQ for async payment processing events

## Repository Structure

```bash
.
├── docker-compose.yml
├── local-docker-compose.yml
├── Jenkinsfile
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── account-service/
│   └── transaction-service/
└── README.md
```

## Service Ports

| Service | Port |
| --- | --- |
| API Gateway | 3000 |
| Auth Service | 4001 |
| Account Service | 4002 |
| Transaction Service | 4003 |
| PostgreSQL | 55432 |
| MongoDB | 27017 |
| Redis | 6379 |
| RabbitMQ | 5672 |
| RabbitMQ Management UI | 15672 |

## Quick Start

### Option 1: Run all services with Docker Compose

```bash
docker compose up --build
```

This starts all infrastructure and application services defined in the root Docker Compose configuration.

### Option 2: Run services individually

From each service folder:

```bash
npm install
npm run dev
```

## Environment Variables

The Compose file configures the required environment variables for each service automatically. If running locally, copy and update values in each service's `.env` file as needed.

## Health Checks

Each service exposes a health endpoint:

- `GET /health`
- API Gateway also exposes Prometheus metrics at `GET /metrics`
- Transaction Service also exposes metrics at `GET /metrics`

## Typical Flow

1. Client calls the API Gateway.
2. The gateway routes the request to the appropriate service.
3. Auth Service validates or issues JWT tokens.
4. Account Service manages balances and ledger data.
5. Transaction Service handles transfer initiation and payment processing through RabbitMQ workers.

## Notes

This project is designed for learning and distributed-system simulation rather than production-scale financial infrastructure. It demonstrates service boundaries, resilience patterns, async messaging, and service-to-service communication.

## Future Improvements

- Add automated tests and CI validation
- Add database migration tooling
- Improve idempotency and compensation workflows
- Add service authentication and request validation policies
- Add observability dashboards and alerting
