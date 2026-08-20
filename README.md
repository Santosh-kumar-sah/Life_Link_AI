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
Matches are ranked dynamically on a scale of `0` to `100` based on a multi-tier clinical medical scoring rubric:
$$\text{Score} = 0.20 \times \text{Blood} + 0.30 \times \text{Urgency} + 0.20 \times \text{Distance} + 0.20 \times \text{HLA} + 0.05 \times \text{Size} + 0.05 \times \text{Age}$$

* **Blood Group Matching (20%):** Enforces Rh-aware compatibility mapping (e.g., `O-` as universal donor, `AB+` as universal recipient). Exact matches score 100; compatible but non-identical score 50; incompatible matches are rejected (`null`).
* **Urgency & Waitlist Seniority (30%):** Recipient severity levels provide baseline scores: `CRITICAL` (100), `HIGH` (75), `MEDIUM` (50), `LOW` (25). In addition, +1 seniority point is awarded for every 30 days spent on the waiting list (capped at 10 points).
* **Geographical Proximity & Cold Ischemia limits (20%):** Enforces strict, organ-specific Cold Ischemia Time (CIT) travel distance limits: **Heart/Lung (400 km)**, **Liver/Pancreas (1200 km)**, and **Kidney (2000 km)**. Matches exceeding limits return `null` immediately. Proximity score scales linearly from 100 down to 0 at the organ's maximum distance limit.
* **HLA Tissue Typing Match Quality (20%):** Evaluates mismatch counts (0 to 6) based on donor-to-recipient alleles across Locus A (a1, a2), Locus B (b1, b2), and Locus DR (dr1, dr2). HLA compatibility score is `100 * (1 - mismatches / 6)`.
* **Weight/Size Ratios (5%):** Ratios within the ideal `[0.8, 1.2]` range receive 100 points, with a linear score drop-off outside it.
* **Age Compatibility (5%):** Prioritizes pediatric-to-pediatric and age-appropriate pairings. Score drops by 3 points per year of age difference: `Math.max(0, 100 - 3 * ageDiff)`.

### 📑 Document Verification Desk
* **Upload Pipelines:** Donors upload identity and medical documents; recipients upload referral documents.
* **Admin Verification Queue:** Hospital administrators can approve or reject uploads. Rejections support custom reasons (e.g., "Legibility error").
* **Active State Triggers:** Donor profiles only change to `active` when explicit consent is set to true and at least one document has been verified. 

### 🤖 AI Support Assistant (OpenRouter Integration)
* **Interactive Live Chat:** A floating chat assistant widget accessible globally across all user and admin dashboards.
* **Smart Support Model:** Connects to OpenRouter (configured to run `google/gemini-2.5-flash` or similar models) to help users with platform workflows, document rules, and matching engine travel limit questions.
* **Credit Safeguard Limits:** Built with strict `max_tokens: 1000` parameters to prevent excessive credit holds on your OpenRouter account.

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
OPENROUTER_API_KEY=your_openrouter_api_key_here
SUPPORT_MODEL=google/gemini-2.5-flash
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
