# Auth Service

The Auth Service handles authentication and user identity management for the payment platform.

## Responsibilities

- Register new users
- Authenticate users with email/password
- Issue and validate JWT tokens
- Return authenticated profile details
- Manage logout and token validation flows

## Tech Stack

- Node.js + Express
- PostgreSQL for user credentials
- Redis for runtime support and caching
- JWT for stateless authentication
- bcrypt for password hashing

## Default Configuration

- Port: `4001`
- Health endpoint: `GET /health`

## Routes

- `POST /auth/register` - register a new user
- `POST /auth/login` - authenticate a user and return a token
- `POST /auth/logout` - invalidate or log out a user session
- `GET /auth/me` - return the authenticated user profile

## Local Development

```bash
cd services/auth-service
npm install
npm run dev
```

## Docker

```bash
docker build -t auth-service ./services/auth-service
```

## Environment Variables

```bash
PORT=4001
DB_HOST=postgres
DB_USER=admin
DB_PASSWORD=admin_secret
DB_NAME=bank_db
JWT_SECRET=super_secret_jwt_key
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret
```

## Security Notes

User passwords are hashed before storage, and protected endpoints verify JWTs using middleware before allowing access.
