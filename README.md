# 🔗 LifeLink: AI-Enabled Real-Time Organ Donation Matching Platform

LifeLink is a production-grade, clinical-eligibility matching and real-time coordination platform that connects organ donors with compatible recipients. Designed with strict medical criteria and geographic constraints, the system automates matching scores, manages secure verification workflows, and coordinates interactions through socket-driven instant notifications.

---

## 🎨 Warm Paper-White Visual Identity

LifeLink v2 introduces a humanist, clinical-grade interface designed to prioritize clarity and reduce stress during crucial medical situations:
* **Background Surface:** `#FBFAF7` (warm paper-white) for a clean, comforting canvas.
* **Core Typography:** Premium humanist serif headings paired with clean, geometric sans-serif numbers and body text.
* **Pine Teal (#1F6F5C):** Used as the primary highlight and action indicator for visual focus.
* **Alert & Urgency Statuses:** Clinically colored tags (Teal for medium urgency, Amber for high, Red for critical) to provide instant visual priority.

---

## ⚡ Key Platform Capabilities

### 🩺 Real-Time Compatibility Engine
Matches are ranked dynamically on a scale of `0` to `100` based on a four-tier medical scoring rubric:
$$\text{Score} = 0.2 \times \text{Blood} + 0.4 \times \text{Urgency} + 0.2 \times \text{Distance} + 0.2 \times \text{Size}$$

* **Blood Group Matching (20%):** Enforces Rh-aware compatibility mapping (e.g., `O-` as universal donor, `AB+` as universal recipient). Exact matches score 100; compatible but non-identical score 50; incompatible matches are rejected.
* **Urgency & Waitlist Seniority (40%):** Recipient severity levels provide baseline scores: `CRITICAL` (100), `HIGH` (75), `MEDIUM` (50), `LOW` (25). In addition, +1 seniority point is awarded for every 30 days spent on the waiting list (capped at 100).
* **Geographical Proximity (20%):** Direct proximity query using MongoDB Atlas `$geoNear` aggregation. Scores scale linearly from 100 (at 0 km) down to 0 (at 2000 km). Matches exceeding 2000 km score 0 for proximity but remain eligible.
* **Size/Weight Ratios (20%):** Evaluates donor-to-recipient weight ratios. Ratios within the ideal `[0.8, 1.2]` range receive 100 points, with a linear score drop-off outside it.

### 📑 Document Verification Desk
* **Upload Pipelines:** Donors upload identity and medical documents; recipients upload referral documents.
* **Admin Verification Queue:** Hospital administrators can approve or reject uploads. Rejections support custom reasons (e.g., "Legibility error").
* **Active State Triggers:** Donor profiles only change to `active` when explicit consent is set to true and at least one document has been verified. 

### 💬 Coordinator Messaging Channel
* **Direct Coordination:** Recipient patients can dispatch inquiries directly to coordinate with local transplant coordinators.
* **Status Tracking:** Tracks inquiries with statuses (`PENDING`, `RESOLVED`) to guarantee audit trails and action.

### 🔔 Socket-Driven Notification Center
* **Instant Alerts:** Dynamic Socket.io triggers broadcast match proposals and document status updates to role-based rooms (`admin`) and user-specific rooms.
* **State Persistence:** Notifications are saved persistently in the database, allowing users to review and mark them as read.

---

## 🏗️ Technical Stack

* **Backend:** Node.js, Express.js (ES Modules), MongoDB Atlas (Geospatial `$geoNear` aggregation), Socket.io (real-time notifications), Zod (request body validation), Pino (structured logging), Express Rate Limit (DDoS mitigation), and cookie-based JWT token rotation.
* **Frontend:** React 18, Vite, TypeScript, TailwindCSS (frosted glass, paper-white tokens), Framer Motion & GSAP (scroll-driven animations), React Hook Form, and Socket.io Client.
* **Testing:** Jest (ES Modules configured via `--experimental-vm-modules`) and Supertest.

---

## 📁 Repository Directory Structure

```
LifeLink/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment parsers, DB connection, Pino logger
│   │   ├── middleware/      # Rate-limit, authentication guard, global error handler
│   │   ├── features/
│   │   │   ├── auth/        # JWT auth controllers, route paths, User models
│   │   │   ├── donor/       # Donor profile collections and CRUD operations
│   │   │   ├── recipient/   # Recipient profiles, urgency audits, messaging models
│   │   │   └── matches/     # Match engine algorithm, schemas, and notifications
│   │   ├── socket/          # Socket.io authentication handshake and event registry
│   │   └── app.js           # Server application routing mounts
│   ├── tests/
│   │   ├── integration/     # REST endpoint and integration tests
│   │   ├── unit/            # Isolated matching algorithm tests
│   │   └── setup.js         # Jest global environment overrides (database isolation)
│   ├── Dockerfile
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Glassmorphic Tilt cards, BookFlip switcher, AuthGuard
    │   ├── context/         # React Auth Context session provider
    │   ├── pages/           # Admin, Donor, and Recipient dashboards; Login & Register
    │   ├── types/           # TypeScript API contract typings
    │   ├── utils/           # Fetch clients with auto-refresh interceptors
    │   ├── main.tsx
    │   └── App.tsx          # React Router layout registry
    ├── package.json
    └── tailwind.config.js
```

---

## 🛠️ Local Development & Running

### 1. Prerequisite Checklist
* Ensure **Node.js (v20 or newer)** is installed.
* Set up a MongoDB Atlas cluster or a local MongoDB database instance.

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/lifelink
JWT_ACCESS_SECRET=your_jwt_access_secret_key_32_characters_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_32_characters_long
COOKIE_SECRET=your_cookie_signing_secret_32_characters_long
CORS_ORIGIN=http://localhost:5173
```

### 3. Spin Up Services

#### Backend API Server:
```bash
cd backend
npm install
npm run dev
```
The API server will listen on `http://localhost:5000`.

#### Frontend Client:
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will open on `http://localhost:5173`.

---

## 🧪 Testing and Verification

### Backend Unit & Integration Tests
To run all backend tests:
```bash
cd backend
npm test
```
> [!NOTE]
> **Database Isolation Guard**: The test suite utilizes the [`tests/setup.js`](file:///d:/LifeLink/backend/tests/setup.js) file to override `process.env.MONGODB_URI` globally before Jest starts importing modules. This runs all tests against the `lifelink_test` database namespace and guarantees that the development database (`lifelink`) is **never wiped**.

### Frontend Typechecking & Production Build Validation
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 🐳 Docker Deployment

The backend container exposes a `/health` endpoint for monitoring container health. Run it as follows:
```bash
cd backend
docker build -t lifelink-backend:latest .
docker run -p 5000:5000 --env-file .env lifelink-backend:latest
```
