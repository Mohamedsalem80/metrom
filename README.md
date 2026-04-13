# Metroom

## Project Documentation

## 1) General Project Idea

### 1.1 Project Overview
Metroom is a full-stack Cairo Metro journey planner. It helps users:
- Plan routes between stations across lines
- See fare and estimated travel time
- Use coordinate helpers to identify nearest stations
- Visualize journeys on an interactive map
- Save and export trips from a profile
- Manage metro network data from an admin panel

### 1.2 Core Problem
Commuters need one reliable place to:
- Select correct lines and transfers quickly
- Estimate ticket cost and trip duration before travel
- Convert map links/live location into usable station choices
- Reuse and manage trip planning history
- Keep network and fare data up to date without code edits

### 1.3 Product Goals
- Reduce planning time and route confusion
- Improve trust with visual and fare transparency
- Enable operational updates through admin tools
- Keep a mobile-friendly flow for daily usage

### 1.4 Target Users
- Daily commuters (students and employees)
- Occasional Cairo Metro riders
- Operators/admins maintaining station and fare data

### 1.5 Current Functional Scope
- Home dashboard with dynamic metro overview
- Planner with route, transfer guide, fare, and time
- Coordinates tools (import links, live location, nearest station)
- Interactive map with route highlighting, travel mode, and reset
- Auth + profile (sign in/up, edit account, delete account)
- Saved trips with JSON/CSV/GeoJSON export
- Admin panel for lines, stations, and fare bands (CRUD)

---

## 2) Architecture and Data Model

### 2.1 Frontend
- React + Vite
- Leaflet map integration
- Responsive header with mobile dropdown menu
- API-first data flow (metro config, auth, trips, admin)

### 2.2 Backend
- Express + TypeScript
- Prisma ORM
- SQLite database (`server/prisma/dev.db`)
- JWT access + refresh tokens
- Role-based authorization (`USER`, `ADMIN` as string role values)

### 2.3 Core Database Entities
- `User`: profile, hashed password, role
- `RefreshToken`: auth session rotation/revocation
- `Trip`: saved user journeys
- `MetroLine`: line metadata
- `MetroStation`: ordered stations per line
- `FareBand`: configurable fare tiers

### 2.4 Metro Data Migration
Static metro data has been migrated to DB-backed config:
- Seed source: `src/data/metroData.js`
- Seeder: `server/prisma/seed.ts`
- Public config API: `GET /metro/config`

---

## 3) API Surface (Current)

### 3.1 Health
- `GET /health`

### 3.2 Authentication
- `POST /auth/signup`
- `POST /auth/signin`
- `POST /auth/refresh`
- `POST /auth/signout`

### 3.3 User Account
- `GET /users/me`
- `PATCH /users/me`
- `DELETE /users/me`
- `POST /users/bootstrap-admin` (promotes current user only if no admin exists)

### 3.4 Trips
- `GET /trips`
- `POST /trips`
- `GET /trips/:id`
- `PATCH /trips/:id`
- `DELETE /trips/:id`

### 3.5 Metro Configuration
- Public: `GET /metro/config`
- Admin:
	- `GET /metro/admin/config`
	- `POST /metro/admin/lines`
	- `PATCH /metro/admin/lines/:id`
	- `DELETE /metro/admin/lines/:id`
	- `POST /metro/admin/stations`
	- `PATCH /metro/admin/stations/:id`
	- `DELETE /metro/admin/stations/:id`
	- `POST /metro/admin/fares`
	- `PATCH /metro/admin/fares/:id`
	- `DELETE /metro/admin/fares/:id`

---

## 4) Local Setup and Run

### 4.1 Prerequisites
- Node.js 18+

### 4.2 Install Dependencies
From project root:

```bash
npm install
```

From backend folder:

```bash
cd server
npm install
```

### 4.3 Initialize Database
From `server` folder:

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

### 4.4 Start Development Servers
Backend (Terminal 1):

```bash
cd server
npm run dev
```

Frontend (Terminal 2):

```bash
npm run dev
```

Notes:
- Frontend calls backend through Vite proxy (`/api` -> `http://localhost:4000`).
- If `5173` is busy, Vite uses another port (for example `5174`).

### 4.5 Production Build
Frontend:

```bash
npm run build
```

Backend:

```bash
cd server
npm run build
```

---

## 5) Admin Panel Usage

### 5.1 Getting Admin Access
- First account signup is assigned admin role automatically.

### 5.2 What Admin Can Manage
- Add/edit/delete metro lines
- Add/edit/delete stations and station order
- Add/edit/delete fare bands

### 5.3 Effect of Admin Changes
- Planner, info tables, and home stats use DB-fed metro config.
- Changes become visible after config refresh/navigation reload.
