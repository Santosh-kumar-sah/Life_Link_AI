# LifeLink: Real-Time Organ Donation Matching Platform with Ai enabled

LifeLink is a production-grade web application platform designed to match organ donors with recipients in real-time. It incorporates Rh-aware blood group compatibility rules, geographic proximity computations using MongoDB geospatial index metrics, and size ratio compatibility checks. 

Real-time notifications are pushed instantly to patient recipients, donor candidates, and system administrators via Socket.io

---

## Technical Architecture

* **Backend API:** Node.js, Express.js (ES Modules), MongoDB Atlas (Geospatial `2dsphere` indexes), Socket.io (WebSocket real-time layer), Zod (request payload validation), Pino (highly-optimized structured logging), rate-limiting middleware, and JWT authentication (signed httpOnly cookie token rotation).
* **Frontend SPA:** React 18, Vite, TypeScript, TailwindCSS (glassmorphic styling system), React Router v6, React Hook Form (validation schemas), Zod, and Socket.io Client.
* **Testing Suite:** Jest (configured for native ES Modules via `--experimental-vm-modules`) and Supertest.

---

## Database Constraints & Scoring Rules

### 1. Blood Compatibility Rules
The engine incorporates a full Rh-factor aware compatibility mapping:
- `O-` can donate to: `O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+` (Universal Donor)
- `O+` can donate to: `O+`, `A+`, `B+`, `AB+`
- `A-` can donate to: `A-`, `A+`, `AB-`, `AB+`
- `A+` can donate to: `A+`, `AB+`
- `B-` can donate to: `B-`, `B+`, `AB-`, `AB+`
- `B+` can donate to: `B+`, `AB+`
- `AB-` can donate to: `AB-`, `AB+`
- `AB+` can donate to: `AB+` (Universal Recipient)

### 2. Match Scoring Algorithm
Matches are ranked on a `0 - 100` scale calculated dynamically:
$$\text{Score} = 0.2 \times \text{Blood} + 0.4 \times \text{Urgency} + 0.2 \times \text{Distance} + 0.2 \times \text{Size}$$

- **Blood Group Matching (20%):** Identical blood type = 100 points, compatible but non-identical type = 50 points, incompatible = rejection (`null` score).
- **Urgency (40%):** Base points based on recipient severity status: `CRITICAL` (100), `HIGH` (75), `MEDIUM` (50), `LOW` (25). In addition, +1 bonus point is awarded for every 30 days the recipient has been registered on the waiting list (capped at 100 points maximum).
- **Proximity (20%):** Direct proximity query utilizing MongoDB Atlas `$geoNear` aggregation. Proximity score scales down from 100 points (at 0 km distance) to 0 points (at 2000 km distance). Any match over 2000 km yields 0 points for proximity but remains compatible.
- **Weight/Size Ratio (20%):** Compares the weight ratio (Donor weight / Recipient weight). A ratio in the range `[0.8, 1.2]` receives 100 points. Ratios outside this range experience a linear score drop-off.

---

## Project Structure

```
LifeLink/
├── backend/
│   ├── src/
│   │   ├── config/          # Startup configs, MongoDB client, logger
│   │   ├── middleware/      # Rate-limiter, auth-gate, errors wrapper
│   │   ├── features/
│   │   │   ├── auth/        # Session controller, routes, User models
│   │   │   ├── donor/       # Donor profile collections and CRUD
│   │   │   ├── recipient/   # Recipient profile collections and CRUD
│   │   │   └── matches/     # Matching engine, Match models & controllers
│   │   ├── socket/          # Socket.io auth handshake and emitters
│   │   └── app.js           # Server application routing mounts
│   ├── tests/
│   │   ├── integration/     # REST endpoint and integration tests
│   │   └── unit/            # Isolated matching engine tests
│   ├── Dockerfile
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Common components (AuthGuard)
    │   ├── context/         # React Auth Context session provider
    │   ├── pages/           # Admin, Donor, Recipient, Logins & Registers
    │   ├── types/           # TypeScript API contract typings
    │   ├── utils/           # Fetch clients with auto-refresh interceptors
    │   ├── main.tsx
    │   └── App.tsx          # React Router layout registry
    ├── package.json
    └── tailwind.config.js
```

---

## Local Development Guide

### 1. Requirements
Ensure you have **Node.js (v20 or v22)** installed.

### 2. Setup Configurations
Create a `.env` file in the `backend/` directory based on the `.env.example`:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/lifelink
JWT_ACCESS_SECRET=your_jwt_access_secret_key_32_characters_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_32_characters_long
CORS_ORIGIN=http://localhost:5173
```

### 3. Spin up Backend
```bash
cd backend
npm install
npm run dev
```
The API server starts on `http://localhost:5000`.

### 4. Spin up Frontend
```bash
cd frontend
npm install
npm run dev
```
The Vite development server runs on `http://localhost:5173`.

---

## Executing Tests

### Backend Unit & Integration Tests
To run all backend tests (using the MongoDB test namespace `lifelink_test`):
```bash
cd backend
npm test
```

### Frontend Type checking & Production build verification
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## Running in Production with Docker

Build and execute the backend directly using Docker:
```bash
cd backend
docker build -t lifelink-backend:latest .
docker run -p 5000:5000 --env-file .env lifelink-backend:latest
```
Docker container status checks can be monitored via the exposed `/health` endpoint query.
