# Metroom Backend

Express + TypeScript + Prisma backend for auth and trip persistence.

## Prerequisites
- Node.js 18+
- No database install required for local development (uses SQLite by default)

## Setup
1. Copy env template:
```bash
cp .env.example .env
```
2. Update `.env` values (especially JWT secrets).
3. Install dependencies:
```bash
npm install
```
4. Generate Prisma client:
```bash
npm run prisma:generate
```
5. Run migrations:
```bash
npm run prisma:migrate
```
6. Start dev server:
```bash
npm run dev
```

Default API URL: `http://localhost:4000`

## Core Endpoints
- `GET /health`
- `POST /auth/signup`
- `POST /auth/signin`
- `POST /auth/refresh`
- `POST /auth/signout`
- `GET /users/me` (Bearer token)
- `GET /trips` (Bearer token)
- `POST /trips` (Bearer token)
- `GET /trips/:id` (Bearer token)
- `PATCH /trips/:id` (Bearer token)
- `DELETE /trips/:id` (Bearer token)

## Notes
- Access token uses Bearer auth.
- Refresh tokens are persisted in the `RefreshToken` table and rotated on refresh.
- Trip payload accepts `status` of `planned` or `traveled`.
