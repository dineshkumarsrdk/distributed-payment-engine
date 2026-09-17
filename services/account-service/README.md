# Account Service

The Account Service manages customer account information, fund transfers, and audit logs for the payment engine.

## Responsibilities

- Create and retrieve account records
- Handle inter-account transfers
- Manage compensating actions for failed transfer scenarios
- Store account-related audit logs in MongoDB
- Verify JWT access for protected routes

## Tech Stack

- Node.js + Express
- PostgreSQL for account data
- MongoDB for audit logs
- Redis for shared cache and service coordination
- JWT-based authorization

## Default Configuration

- Port: `4002`
- Health endpoint: `GET /health`

## Routes

### Accounts

- `POST /accounts` - create a new account
- `GET /accounts/:id` - fetch account details
- `POST /accounts/transfer` - transfer funds between accounts
- `POST /accounts/compensate` - compensate a failed transfer

### Audit Logs

- `GET /auditLogs/:accountId` - fetch audit logs for an account

## Local Development

```bash
cd services/account-service
npm install
npm run dev
```

## Docker

```bash
docker build -t account-service ./services/account-service
```

## Environment Variables

```bash
PORT=4002
DB_HOST=postgres
DB_USER=admin
DB_PASSWORD=admin_secret
DB_NAME=bank_db
JWT_SECRET=super_secret_jwt_key
MONGO_URI=mongodb://mongo_admin:mongo_secret@mongodb:27017/ledger_audit?authSource=admin
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret
```

## Notes

The service validates authorization on account and audit log routes using middleware and expects a valid JWT token in the request context.
