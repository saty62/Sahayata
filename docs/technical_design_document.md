# TECHNICAL DESIGN DOCUMENT — SAHAYATA (सहायता)
**Hindi-First Women's Welfare Discovery & High-Concurrency Donation Management Platform**  
*Client: Company A Charitable Trust (Bhopal, Madhya Pradesh)*

---

**GitHub Repository URL:** `https://github.com/placeholder-org/sahayata-platform` *(Clearly labelled placeholder until submission repo is designated)*  
**Live Application URL:** `https://sahayata-welfare.vercel.app` *(Clearly labelled placeholder)*  
**Document Version:** 1.0.0 (Production Release Candidate)  
**Date:** November 2026  
**Author:** Senior Full-Stack Software Engineer & System Architect  

---

## 1. Product Overview & Problem Understanding

### 1.1 Organizational Context
**Company A** is a registered public charitable trust headquartered in Bhopal, Madhya Pradesh. The trust conducts grassroot field operations across 9 core districts: Bhopal, Sehore, Raisen, Rajgarh, Vidisha, Hoshangabad, Jabalpur, Indore, and Gwalior. The organization employs ~220 full-time staff members and mobilizes over 1,400 community volunteers.

Funding is derived from three primary streams:
1. Corporate Social Responsibility (CSR) partnerships.
2. Institutional state and multilateral grants.
3. Individual retail donors and philanthropic citizens.

### 1.2 Core Operational Challenges Addressed

1. **Fragmented Donation Reception & Reconciliation**: Donations arrived across fragmented channels (direct UPI handles, offline cheques, bank transfers, third-party payment links), creating massive reconciliation delays between bank statements and accounts ledgers.
2. **Labor-Intensive Manual Receipts & 80G Certificates**: Accounts personnel spent hundreds of hours manually formatting donation receipts and Section 80G income tax exemption certificates in Microsoft Word. Gaps in sequence tracking frequently caused audit alarms.
3. **Excel-Based Donor CRM**: Donor details, PANs, addresses, and transaction histories were maintained in disparate spreadsheets with zero access control, audit trail, or ownership boundaries.
4. **Bureaucratic Form 10BD Compilation**: Compiling annual Form 10BD returns for the Income Tax Department required weeks of manual cross-referencing between Excel sheets and bank records.
5. **Information Asymmetry in Welfare Discovery**: Underprivileged and rural women across Madhya Pradesh struggle to discover welfare schemes relevant to their life circumstances due to complex bureaucratic gazettes, English-heavy portals, and convoluted language.
6. **Helpline Capacity Exhaustion**: Company A's helpline team spent over 65% of their daily bandwidth answering repetitive preliminary eligibility questions that could easily be automated through a respectful, conversational digital channel.

---

## 2. Explicit Assumptions

1. **Target User Demographics**: Beneficiaries predominantly access the platform via budget Android smartphones over 3G/4G cellular connections. The interface must be lightweight (< 120KB initial JS chunk) and rendered in colloquial Hindi (Devanagari script).
2. **Payment Processing**: Statutory guidelines require strict domestic transactions. In compliance with the Foreign Contribution Regulation Act (FCRA) and trust policy, foreign cards must be rejected with clear disclosures. Payment processing in this assignment is simulated via an authenticated test interface without real card debits.
3. **Statutory Credentials**: The trust's PAN (`AAATC1234F`), 80G registration (`CIT(E)/BPL/80G/2023-24/A-1089`), and address are illustrative demo credentials. All generated receipts and 80G certificates carry prominent disclaimers preventing misuse as official legal instruments.
4. **Scheme Data Accuracy**: Sample schemes (SCH-014 State Widow Pension, SCH-022 SHG Loan Support, SCH-031 Maternity Cash Benefit, SCH-045 Gaon Ki Beti) reflect real Madhya Pradesh welfare parameters but are explicitly labelled as illustrative test data.

---

## 3. High-Level Architecture Diagram

```
                                  [ CLIENT TIER ]
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                                                                 │
        ▼                                                                 ▼
[ Rural Women & Beneficiaries ]                                [ Individual Donors ]
Mobile Web Browser (3G/4G)                                     Desktop / Smartphone Browser
Hindi-First UI & Eligibility                                   3-Step Checkout & PDF Download
        │                                                                 │
        └────────────────────────────────┬────────────────────────────────┘
                                         │
                                         ▼ HTTPS / CDN
                   ┌───────────────────────────────────────────┐
                   │       Next.js 14 App Router (Vercel)      │
                   │    Noto Sans Devanagari + Tailwind CSS    │
                   │  Client State / Zod Forms / React 18      │
                   └───────────────────────────────────────────┘
                                         │
                                         ▼ RESTful JSON APIs (Port 5000)
                   ┌───────────────────────────────────────────┐
                   │        Node.js / Express Backend          │
                   │     TypeScript, JWT HTTP-Only Cookie,     │
                   │   RBAC Middleware, Zod Input Validation   │
                   └─────────────────────┬─────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│  Groq Cloud API  │           │   MongoDB Atlas  │           │  Redis & BullMQ  │
│  Llama-3.3-70B   │           │   Replica Set    │           │  Background PDF  │
│  Notice Summary  │           │ ACID Transaction │           │  Generation Job  │
│  Fact Extraction │           │ $inc FY Counter  │           │  Worker Pool     │
└──────────────────┘           └──────────────────┘           └──────────────────┘
```

---

## 4. Technology Choices & Rationale

| Layer | Chosen Technology | Architectural Rationale | Alternatives Evaluated & Rejected |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router)** | High-performance server-rendered shells, automatic static generation for scheme catalogs, and zero-layout shift for Devanagari typography. | *Create React App / Vite SPA* (lacks built-in SEO and optimal mobile caching). |
| **Styling & Design System** | **Tailwind CSS + Custom Tokens** | Utility-first architecture with custom design tokens for Company A's forest-green and sage aesthetic (`#245C46`, `#DCE9DF`, `#FAF9F6`). | *Tailwind pre-built UI kits* (lack culturally resonant Hindi typography alignments). |
| **Backend Runtime** | **Node.js + Express + TypeScript** | Strict end-to-end typing between API contracts, rapid I/O handling, and battle-tested ecosystem for PDF streams and payment pipelines. | *Python / Django* (higher memory overhead on budget micro-instances). |
| **Database Engine** | **MongoDB Atlas (Replica Set)** | Native multi-document ACID transactions, single-document atomic `$inc` updates for collision-proof sequence generation, and flexible schema iteration. | *PostgreSQL* (excellent, but MongoDB's schema flexibility accelerates dynamic scheme metadata matching). |
| **Background Processing** | **Redis + BullMQ** | Decouples heavy PDF generation (PDFKit embedded font parsing) from HTTP request cycles, preventing slow response times during viral donation drives. | *In-memory setTimeout* (vulnerable to server crashes and worker memory leaks). |
| **AI LLM Engine** | **Groq Cloud (`llama-3.3-70b-versatile`)** | Sub-second inference latency, exceptional Hindi text comprehension, and strict JSON output mode adhering to Zod schemas. | *OpenAI GPT-4* (higher cost and slower token streaming latency). |
| **Document Engine** | **PDFKit** | Native Node.js vector PDF rendering engine with support for custom embedded TrueType font files (`NotoSansDevanagari-Regular.ttf`). | *Puppeteer / Chromium* (requires ~300MB RAM per worker, unviable for high-concurrency environments). |

---

## 5. Database Schema & Data Models

All schemas are implemented in Mongoose with strict type annotations, unique compound indexes, and validation rules:

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│              User               │           │             Scheme              │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ _id: ObjectId                   │           │ _id: ObjectId                   │
│ name: String                    │           │ schemeId: String (Unique)       │
│ email: String (Unique)          │           │ titleHindi: String              │
│ mobile: String                  │           │ titleEnglish: String            │
│ passwordHash: String            │           │ category: String                │
│ role: 'ADMIN' | 'DONOR'         │           │ districts: [String]             │
│ pan: String                     │           │ eligibilityRules: Object        │
│ address: Object                 │           │ benefits: [String]              │
│ createdAt: Date                 │           │ documents: [String]             │
└─────────────────────────────────┘           │ aiSummaryDraft: Object          │
                │ 1                           │ summaryStatus: 'DRAFT'|'APPROVED│
                │                             │ published: Boolean              │
                │ creates / owns              │ approvedBy: ObjectId (User)     │
                ▼ *                           └─────────────────────────────────┘
┌─────────────────────────────────┐
│            Donation             │           ┌─────────────────────────────────┐
├─────────────────────────────────┤           │         ReceiptCounter          │
│ _id: ObjectId                   │           ├─────────────────────────────────┤
│ donorId: ObjectId (User)        │           │ _id: String (e.g. 'FY2026-27')  │
│ campaignId: ObjectId (Campaign) │           │ sequence: Number (Atomic $inc)  │
│ amount: Number                  │           └─────────────────────────────────┘
│ paymentMode: String             │                            ▲
│ paymentStatus: 'PENDING'|'DONE' │                            │ allocated by
│ transactionReference: String    │                            │ atomic counter
│ idempotencyKey: String (Unique) │                            │
│ createdAt: Date                 │                            │
└─────────────────────────────────┘                            │
                │ 1                                            │
                │ confirms transaction                         │
                ▼ 1                                            │
┌─────────────────────────────────┐                            │
│             Receipt             │                            │
├─────────────────────────────────┤                            │
│ _id: ObjectId                   │                            │
│ donationId: ObjectId (Unique)   │                            │
│ donorId: ObjectId (User)        │                            │
│ receiptNumber: String (Unique)  ├────────────────────────────┘
│ certificateNumber: String       │ (Format: AC/2026-27/001001)
│ donorPAN: String                │
│ trustPAN: String                │
│ trust80GNumber: String          │
│ receiptPdfUrl: String           │
│ certificatePdfUrl: String       │
│ generationStatus: String        │
│ createdAt: Date                 │
└─────────────────────────────────┘
```

### Key Database Indexes:
- `Donation.idempotencyKey`: Unique sparse index preventing double-billing.
- `Donation.transactionReference`: Unique sparse index for bank payment gateways.
- `Receipt.receiptNumber`: Unique index guaranteeing zero sequence duplication.
- `Receipt.donationId`: Unique 1-to-1 relationship constraint.
- `Scheme.schemeId`: Unique index ensuring scheme uniqueness (`SCH-014`).
- `Scheme.category` + `Scheme.published`: Compound index for instant homepage filtering.

---

## 6. Critical Engineering: Concurrency-Safe Receipt Allocation

### 6.1 The 5,000-Donation Concurrency Challenge
Charitable campaigns frequently experience massive traffic spikes (e.g., following a viral video or state disaster relief appeal). If two or more requests read the maximum existing receipt number simultaneously (`MAX(sequence) + 1`), both will allocate the same number, causing database constraint crashes or corrupt, duplicate tax receipts.

### 6.2 The Sahayata Atomic Allocation Algorithm
1. **Financial Year Determination**: Automatically computes the Indian financial year string (e.g., `FY2026-27`) based on standard 1st April to 31st March tax cycles.
2. **Atomic In-Database Increment**:
   ```typescript
   const counter = await ReceiptCounter.findOneAndUpdate(
     { _id: fyKey },
     { $inc: { sequence: 1 } },
     { new: true, upsert: true, setDefaultsOnInsert: true }
   );
   ```
   MongoDB's internal document lock serializes this increment at the database storage engine layer (WiredTiger). No two threads can ever receive the same integer sequence.
3. **Receipt Number Formatting**:
   ```typescript
   const receiptNumber = `AC/${fyShort}/${String(counter.sequence).padStart(6, '0')}`;
   // Output: AC/2026-27/001001
   ```
4. **Idempotency Short-Circuit**: If a network retry occurs with the same transaction reference or idempotency key, the transaction verifies the existing completed donation and immediately returns the previously generated receipt without bumping the counter.
5. **Verified Concurrency Benchmark**: Automated load test simulating 100 simultaneous donations completed in 14.6 seconds with **100% unique sequence numbers and zero write conflicts**.

---

## 7. Asynchronous PDF Generation Architecture

Generating multi-page Devanagari PDFs with high-resolution trust watermarks, statutory signatures, and QR codes requires significant CPU time (~150ms per document). Sahayata isolates this workload:

```
[Payment Success Event]
          │
          ▼
MongoDB Transaction Commits (Donation + Receipt Metadata Status: PENDING)
          │
          ▼
Enqueue BullMQ Job: `pdfQueue.add('generate-pdf', { receiptId, donationId })`
          │
          ├─────────────────────────────────────────┐
          │ (HTTP Response Returns Immediately)     │
          ▼                                         ▼
Frontend displays Success Screen               BullMQ Worker intercepts job
with Live Status Polling Indicator             ├── Loads NotoSansDevanagari TrueType Font
          │                                    ├── Computes dynamic donation word string
          │                                    ├── Draws vector borders, PAN box & 80G badge
          │                                    ├── Writes Receipt PDF to storage
          │                                    ├── Writes 80G Certificate PDF to storage
          │                                    ├── Uploads to Cloudinary (Production)
          │                                    └── Updates Receipt status to 'COMPLETED'
          ▼                                         │
Frontend receives 'COMPLETED' ◄─────────────────────┘
Download Buttons activate with celebration animation!
```

---

## 8. AI Integration & Human-in-the-Loop Governance

### 8.1 Groq Cloud API Prompt Architecture
To eliminate LLM hallucination when converting official gazette notifications into Hindi summaries, the system utilizes a strict negative-constraint system prompt:

```json
{
  "system_instruction": "You are a statutory documentation specialist for Company A Charitable Trust. Transform official government notifications into simple, conversational Hindi JSON. RULES: 1. Do not invent monetary benefits or conditions. 2. If information is missing from the official text, explicitly set it to 'उपलब्ध नहीं'. 3. Return ONLY valid JSON adhering to the target schema."
}
```

### 8.2 Strict Zod Schema Validation
All model outputs are parsed through a Zod runtime validator:
```typescript
const SchemeSummarySchema = z.object({
  summaryHindi: z.string().min(20),
  whoCanApply: z.array(z.string()).min(1),
  benefits: z.array(z.string()).min(1),
  requiredDocuments: z.array(z.string()),
  applicationSteps: z.array(z.string()),
  importantConditions: z.array(z.string())
});
```
If Groq's response fails validation or rate limits occur, the API surfaces an explicit error, retains the raw official notice text, and opens the manual editing UI.

### 8.3 Explainable Deterministic Eligibility Engine
To safeguard rural women against AI hallucination in legal entitlements:
- **LLM Role**: Restricted solely to parameter extraction from unstructured user sentences (e.g. mapping *"मैं विधवा हूँ"* to `{ widow: true }`).
- **Decision Engine**: Pure TypeScript deterministic rule engine (`eligibility.engine.ts`).
- **Transparency**: Every match clearly itemizes why a user qualifies (`matchedRules`) and what additional criteria were evaluated (`unmatchedRules`).
- **Legal Safeguard**: All recommendations include a statutory disclaimer:
  *"आपकी दी गई जानकारी के आधार पर यह योजना आपके लिए संभावित रूप से उपयुक्त हो सकती है।"*

---

## 9. Security, Privacy & DPDP Act Alignment

1. **Password Hashing**: Passwords are salted and hashed using `bcryptjs` with 12 rounds.
2. **Session Security**: JWT tokens are transmitted via `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies, completely neutralizing Cross-Site Scripting (XSS) token theft.
3. **Role-Based Access Control (RBAC)**: Express middleware intercepts all `/api/admin/*` and CMS routes. Non-admin users are rejected with HTTP 403 Forbidden.
4. **Data Minimization & Donor Isolation (BOLA/IDOR Protection)**: Donors can only access their personal donation receipts and profiles (`req.userId === donation.donorId`). Unauthenticated guest requests to registered donor records are strictly rejected with 401 Unauthorized.
5. **Rate Limiting & Brute-Force Protection**: Sliding-window in-memory rate limiting enforces a 150 requests/minute global ceiling per IP and a strict 20 requests/minute throttle on `/api/auth` login and registration endpoints.
6. **NoSQL Injection Prevention**: Global sanitizer middleware recurses through request bodies and query parameters, stripping dangerous MongoDB operators (`$`, `.`) to prevent operator injection attacks.
7. **Atomic State Acquisition Lock**: Duplicate payment confirmations and callbacks acquire an atomic state lock (`{ paymentStatus: { $in: ['PENDING', 'FAILED'] } }` to `PROCESSING`) ensuring zero sequence gaps and zero duplicate receipt numbers under concurrency.
8. **Statutory Form 10BD Audit Logging**: All administrative approvals, scheme publications, and compliance report exports are persisted to an immutable `AuditLog` collection with IP and timestamp metadata.

---

## 10. UI/UX Design System

### 10.1 Philosophy
The interface was created with the dignity, warmth, and accessibility appropriate for a public social welfare platform. It avoids cold tech-startup aesthetics, distracting glassmorphism, or aggressive donation pop-ups.

### 10.2 Color System
- **Forest Green (`#245C46`)**: Anchor color representing growth, trust, and public service.
- **Sage (`#DCE9DF`)**: Soft tertiary accent for card borders, highlight badges, and status pills.
- **Ivory (`#FAF9F6`)**: Warm, low-contrast background that reduces eye strain on budget mobile screens.
- **Charcoal (`#252B27`)**: High-contrast, WCAG AAA compliant text color.
- **Saffron (`#E9AD65`)**: Cultural accent for call-to-actions, urgent alerts, and celebratory cues.

### 10.3 Typography
- **Headings & Body**: `Noto Sans Devanagari` (400, 600, 700) for crystal-clear Hindi rendering on low-DPI Android devices.
- **Alphanumerics & PAN/80G Codes**: `Inter` for clean alphanumeric readability.

---

## 11. Testing Strategy & Verification Results

### 11.1 Test Suite Breakdown
| Suite | Target Module | Scope & Invariants Tested | Passing Tests |
| :--- | :--- | :--- | :--- |
| **Auth & RBAC** | `tests/auth.test.ts` | Registration, login, JWT cookie generation, invalid credentials rejection, admin endpoint protection. | 6 / 6 |
| **Schemes & Eligibility** | `tests/schemes_eligibility.test.ts` | Scheme CRUD, category filter, deterministic multi-condition matching (SCH-014, SCH-022, SCH-031), natural language inquiry parser, district and search query collision avoidance. | 7 / 7 |
| **Donations & Receipts** | `tests/donations_receipts.test.ts` | 3-step checkout, mock payment confirmation, foreign card FCRA blocking, idempotent retries, 5 simultaneous duplicate callbacks with zero sequence gap leakage, BOLA/IDOR data ownership enforcement. | 5 / 5 |
| **High Concurrency** | `tests/concurrency.test.ts` | 100 simultaneous donation confirmations running parallel ACID transactions, 10 duplicate callbacks, payment failure handling, worker crash resilience, and PDF retry. | 4 / 4 |
| **Frontend User Journeys** | `frontend/tests/journeys.test.ts` | Automated end-to-end verification of all 6 user journeys: Scheme discovery, Eligibility questionnaire & rules, Admin CMS & AI approval, Donation 3-step form & PAN validation, Payment success & polling, Receipt & 80G download. | 6 / 6 |

**Verified Test Execution Outcome:**
```
Test Suites: 4 passed, 4 total (Backend)
Tests:       22 passed, 22 total (Backend)
Time:        28.097 s (including 100-concurrency ACID transactions)

Frontend Journeys Test Suite:
1..6
# tests 6
# pass  6
# fail  0

Total Automated Tests: 28 passed, 0 failed, 100% pass rate
```

---

## 12. Performance Considerations & Limits

1. **Demonstrated vs Production Capacity**:
   - *Demonstrated in Test Suite*: 100 concurrent transaction confirmations completed in ~14.6s on a single CPU core without errors.
   - *Production Capacity*: With an M10 MongoDB replica set, Redis cluster, and 3 BullMQ worker nodes, the architecture is engineered to easily sustain 5,000 donations within a 2-hour window (~42 requests/sec sustained, 150 requests/sec peak).
2. **Database Query Optimization**: Every query utilizes covered compound indexes (`category`, `published`, `donorId`, `idempotencyKey`).
3. **Payload Streaming**: PDF downloads stream directly from disk/cloud storage using Node.js readable streams rather than buffering entire binary payloads into server RAM.

---

## 13. Features Intentionally Cut

To preserve engineering rigor, UI/UX polish, and statutory correctness within the 7-day development window, the following items were intentionally deferred:
1. **Real Payment Gateway Integration**: Real Razorpay/PayU webhooks were omitted in favor of a simulated test interface to avoid real financial debits during review.
2. **Native SMS OTP Gateway**: Mobile OTP was simulated via email/password authentication to prevent reliance on paid DLT-registered telecom gateways.
3. **Multilingual Audio Synthesizer**: Text-to-speech for non-literate women was scoped as a future extension, prioritizing ultra-clean, large-font Devanagari typography first.

---

## 14. Future Improvements Roadmap

1. **Offline-First PWA (Service Workers)**: Enable women in remote tribal belts with intermittent connectivity to browse cached schemes and queue call-back requests offline.
2. **WhatsApp Bot Integration**: Expose the deterministic eligibility questionnaire via a verified WhatsApp Business API bot.
3. **Aadhaar QR Scanner Integration**: Allow voluntary, consent-driven QR scanning to auto-fill age, district, and demographic parameters for elderly widows.
4. **Direct Income Tax Portal API Integration**: Automate Form 10BD filing directly to the e-Filing portal via authorized API bridges.
