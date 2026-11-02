# SAHAYATA (सहायता) — DEPLOYMENT & OPERATION GUIDE
**Hindi-First Women's Welfare Discovery & Donation Management Platform**  
*Client: Company A Charitable Trust (Bhopal, Madhya Pradesh)*

---

## 1. Executive Deployment Summary & Architecture

Sahayata is architected as a modular, decoupled full-stack platform designed for high concurrency, rock-solid statutory compliance, and low-latency mobile experiences for rural and semi-urban beneficiaries across Madhya Pradesh.

```
                           +-------------------------------------+
                           |            End Users                |
                           |   (Rural Women / Citizens / Donors) |
                           +-------------------------------------+
                                              |
                                      HTTPS (Port 443)
                                              v
                           +-------------------------------------+
                           |         Vercel Edge Network         |
                           |    Next.js 14 App Router Frontend   |
                           | (Hindi-First UI, Tailwind, Lucide)  |
                           +-------------------------------------+
                                              |
                                     RESTful JSON APIs
                                   Secure HTTP-Only Cookie
                                              v
                           +-------------------------------------+
                           |       Render / Node.js Engine       |
                           |     Express + TypeScript Backend    |
                           +-------------------------------------+
                                /             |             \
                               /              |              \
             +----------------+               |               +---------------+
             | Groq Cloud API |               |               |  Cloudinary   |
             | Llama-3.3-70B  |               |               |  PDF Storage  |
             +----------------+               |               +---------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
   +------------------------------------+            +------------------------------------+
   |        MongoDB Atlas Cluster       |            |          Redis Cloud / BullMQ      |
   |      (Replica Set with WiredTiger) |            |     Async Worker Queue for PDFKit  |
   | Multi-Doc ACID Transactions,       |            |  Receipts & 80G Tax Certificates   |
   | Atomic $inc FY Receipt Counter     |            +------------------------------------+
   +------------------------------------+
```

---

## 2. Demo Credentials & Test Accounts

The platform includes seeded accounts with pre-configured permissions:

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Trust Administrator** | `admin@sahayata.org.in` | `Admin@1234` | Full CMS CRUD, Groq AI Summaries review/approve/publish, donation reports, Form 10BD CSV compliance export, audit logs |
| **Individual Donor** | `donor@sahayata.org.in` | `Donor@1234` | 3-step checkout, receipt & 80G PDF generation, personal donation history, certificate downloads |
| **Quick Fill in UI** | Available on `/login` screen | One-click auto-fill buttons for instant reviewer testing |

---

## 3. Environment Variables Reference

Only standard environment variable names are referenced below. Placeholders must be configured in `backend/.env` and `frontend/.env.local`.

### Backend Environment (`backend/.env`)

```ini
PORT=5000
NODE_ENV=production
CLIENT_URL=https://sahayata-frontend.vercel.app

# Database & Cache
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/sahayata?retryWrites=true&w=majority
REDIS_URL=redis://default:<password>@<redis-host>:<port>

# Security
JWT_SECRET=<at-least-32-char-random-secret>
COOKIE_SECRET=<encryption-key-for-cookies>

# AI Integration
GROQ_API_KEY=<groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile

# Cloud Storage (Optional - falls back to local storage if not provided)
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# Trust Statutory Details (Marked as Illustrative Demo Data)
TRUST_NAME=सहायता चैरिटेबल ट्रस्ट (Sahayata Charitable Trust)
TRUST_PAN=AAATC1234F
TRUST_80G_NUMBER=CIT(E)/BPL/80G/2023-24/A-1089
TRUST_REGISTRATION_NUMBER=MP/BPL/TRUST/2018/00921
TRUST_ADDRESS=14, मालवीय नगर, भोपाल, मध्य प्रदेश - 462003
TRUST_HELPLINE=1800-233-4567
```

### Frontend Environment (`frontend/.env.local`)

```ini
NEXT_PUBLIC_API_URL=https://sahayata-backend.onrender.com/api
```

---

## 4. Local Development & Evaluation Setup

Sahayata provides zero-friction local setup. If local MongoDB or Redis are not detected, the backend includes **automatic zero-config resilience**:
1. It automatically boots an in-memory replica set (`mongodb-memory-server`) that **fully supports multi-document ACID transactions**!
2. If Redis is offline, the background job queue automatically routes PDF rendering to an in-process asynchronous worker pool.

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ / v22+ LTS recommended)
- **npm**: v9.0.0 or higher
- Optional: Local or cloud MongoDB instance, Redis server

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd sahayata

# Install dependencies in both packages
npm --prefix backend install
npm --prefix frontend install
```

### Step 2: Seed Sample Data

Seeds the exact statutory schemes required (SCH-014, SCH-022, SCH-031, SCH-045), 3 live campaigns, demo admin, demo donor, and sample receipts:

```bash
npm run seed
```

### Step 3: Run the Application

In terminal 1 (Backend API & Background Worker):
```bash
npm run dev:backend
# Server starts on http://localhost:5000
```

In terminal 2 (Frontend Client):
```bash
npm run dev:frontend
# Next.js starts on http://localhost:3000
```

Open `http://localhost:3000` in your browser.

---

## 5. Verification & Automated Test Execution

The codebase includes comprehensive unit, integration, and high-concurrency automated test suites.

### Running Backend Unit & Integration Tests

```bash
npm run test:backend
```
*Executes tests for authentication, role authorization, scheme CRUD, deterministic eligibility logic, donation generation, idempotency handling, and receipt generation.*

### Running Concurrency Load Test (100 Concurrent Donations)

```bash
npm run test:concurrency
```
*Simulates 100 simultaneous donations hitting the transaction pipeline within milliseconds. Asserts:*
- *100 unique donation records created.*
- *100 sequential, unique receipt numbers (`AC/2026-27/001001` through `AC/2026-27/001100`).*
- *Zero race conditions or skipped sequences.*
- *Zero duplicate allocations under concurrent load.*

### Building for Production

```bash
npm run build:backend
npm run build:frontend
```
*Both builds complete with zero TypeScript or compilation errors.*

---

## 6. Cloud Production Deployment Architecture

### A. Database: MongoDB Atlas (Replica Set Required)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create an **M0 (Free Tier)** or dedicated M10+ cluster in the `ap-south-1` (Mumbai) region.
   *Crucial: MongoDB Atlas automatically provisions a 3-node Replica Set, which is required for multi-document ACID transactions.*
3. Under **Network Access**, add your server's IP address (or `0.0.0.0/0` with secure password auth).
4. Under **Database Access**, create a user with `readWriteAnyDatabase` privileges.
5. Copy the SRV URI to `MONGODB_URI`.

### B. Cache & Worker Queue: Redis Cloud
1. Sign up at [Redis Cloud](https://redis.io/try-free/) or [Upstash Redis](https://upstash.com/).
2. Create a free-tier database in `ap-south-1` or nearest region.
3. Copy the public connection string: `redis://default:<password>@<host>:<port>`.
4. Supply as `REDIS_URL`.

### C. Backend Deployment: Render / Railway
1. Connect your GitHub repository to [Render](https://render.com).
2. Choose **Web Service**.
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `npm install && npm run build`
5. Set **Start Command**: `npm start`
6. Add the environment variables defined in Section 3.
7. Click **Deploy Web Service**.

### D. Frontend Deployment: Vercel
1. Log in to [Vercel](https://vercel.com).
2. Import the Git repository.
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend (e.g. `https://sahayata-backend.onrender.com/api`).
5. Click **Deploy**.

---

## 7. Critical Operational Workflows

### Concurrency-Safe Receipt Numbering
- Receipt numbers follow the formal Income Tax financial-year format: `AC/YYYY-YY/00XXXX` (e.g. `AC/2026-27/001001`).
- Numbers are guaranteed sequential and collision-proof using MongoDB's atomic `findOneAndUpdate` with `$inc`.
- If a donation payment confirmation is re-sent or retried with the same transaction reference / idempotency key, the transaction safely short-circuits and returns the existing receipt record without re-incrementing the counter.

### Income Tax Form 10BD CSV Export
1. Log in as Trust Administrator (`admin@sahayata.org.in`).
2. Navigate to `/admin`.
3. In the quick actions or reports section, click **"फॉर्म 10BD रिपोर्ट डाउनलोड करें (Form 10BD CSV)"**.
4. The system aggregates all verified donations for the current financial year and streams an IT-compliant CSV format with:
   - Unique Receipt Number (`AC/2026-27/001001`)
   - Donor Identification (PAN, Aadhaar/Passport if available)
   - Donor Full Name & Registered Postal Address
   - Donation Type (Corpus / Specific Project / General)
   - Verified Amount & Tax Exemption Eligibility

### Helpline Call-Back Assistance
- When rural beneficiaries navigate schemes or the eligibility questionnaire, a 1-click **"हेल्पलाइन से कॉल-बैक मांगें"** modal captures their contact number and preferred time.
- Request is securely saved to the database and logged for Company A's field coordinators.
