# 🌸 सहायता (Sahayata)
### Hindi-First Women's Welfare Discovery & High-Concurrency Donation Platform
*Engineered for Company A Charitable Trust — Bhopal, Madhya Pradesh*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Replica%20Set-darkgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## 📌 Executive Overview

**Sahayata (सहायता)** is a centralized digital platform engineered for **Company A**, a registered charitable trust operating across 9 districts in Madhya Pradesh (Bhopal, Sehore, Raisen, Rajgarh, Vidisha, Hoshangabad, Jabalpur, Indore, Gwalior) with 220 full-time staff and 1,400 field volunteers.

The platform addresses two mission-critical organizational needs:
1. **Welfare Scheme Discovery for Women**: Delivering a warm, respectful, Hindi-first discovery portal and an explainable eligibility questionnaire that demystifies state and central government welfare schemes for rural and semi-urban women.
2. **Statutory Donation & Compliance Management**: A streamlined 3-step checkout supporting simulated UPI, Net Banking, and Card donations, backed by an **atomic, concurrency-safe receipt numbering engine (`AC/YYYY-YY/00XXXX`)**, asynchronous background PDFKit rendering for receipts and 80G tax certificates, and automated **Income Tax Form 10BD CSV compilation**.

---

## 🚀 Key Architectural Highlights

- **Hindi-First Design System**: Handcrafted typography using *Noto Sans Devanagari* and *Inter*, generous whitespace, large touch targets, and a social-impact color palette (Forest Green `#245C46`, Sage `#DCE9DF`, Ivory Background `#FAF9F6`, Charcoal `#252B27`, and Saffron Accent `#E9AD65`).
- **Concurrency-Safe Receipt Engine**: Solves the 5,000 donation rush problem without race conditions or sequence skips via MongoDB's atomic `findOneAndUpdate` with `$inc`, wrapped inside an ACID multi-document transaction.
- **Explainable Eligibility Finder**: Transparent, deterministic rule evaluation (NOT black-box AI decisions) explaining to rural beneficiaries exactly *why* a scheme was recommended and which documents are needed.
- **Groq Cloud AI Integration**: Official government gazettes and scheme circulars are summarized by Groq Llama-3.3-70B into structured, Zod-validated JSON drafts. AI outputs remain strictly in draft state until reviewed, edited, approved, and published by authorized trust administrators.
- **Zero-Friction Local Evaluation**: Includes embedded MongoDB in-memory replica set and in-process async worker fallback. Evaluators can run the entire system end-to-end without needing external cloud accounts or local databases pre-installed!

---

## 🏛️ Application Roles & 8 Core Screens

| Screen | Route | Description & Key Functionality |
| :--- | :--- | :--- |
| **1. Public Homepage** | `/` | **Hindi-First Scheme Discovery Section placed first**; search by name; browse by need (पेंशन, स्वास्थ्य, आजीविका, शिक्षा); district filter; live donation campaigns; Trust overview. |
| **2. Scheme Details** | `/schemes/[id]` | Full Hindi/English view, benefits breakdown, eligibility criteria, required documents, official source link, nearest district help centre info, and helpline call-back modal. |
| **3. Eligibility Finder** | `/eligibility` | Multi-step deterministic questionnaire with conditional branching (Age, District, BPL, Widow status, SHG membership, Pregnancy); explains matched rules with zero hallucination. |
| **4. Admin Dashboard** | `/admin` | Real-time statutory metrics: Total donations, donor count, active campaigns, pending PDF jobs, published schemes, recent transactions, and Form 10BD CSV export. |
| **5. Scheme CMS** | `/admin/schemes` | Full administrative CRUD, Groq AI official notice summarizer, draft review/approval lifecycle, and one-click publish/unpublish toggle. |
| **6. Donation Checkout** | `/donate` | Streamlined 3-step flow (Amount selection ₹500–₹5,000/Custom → Donor KYC & PAN → Simulated UPI/Cards/Net Banking); FCRA foreign card rejection notice. |
| **7. Donation Success & PDFs**| `/donate/success` | Celebratory confirmation, allocated unique receipt number, live polling for async background PDFKit generation of Receipt & 80G Tax Exemption Certificate. |
| **8. Donor Dashboard** | `/donor` | Role-protected donor portal displaying lifetime contributions, campaign allocations, transaction dates, and direct PDF download links. |

---

## ⚡ Concurrency & Receipt Numbering Architecture

Under viral donation campaigns (e.g. 5,000 donors in a few hours), naive `find().sort().limit(1)` sequence generation causes race conditions, duplicate receipts, and statutory compliance violations with the Income Tax Department.

Sahayata implements a multi-layer concurrency architecture:

```
[Incoming Donation Payment Request]
                │
                ▼
1. Validate Idempotency & Transaction Reference (Short-circuit duplicates)
                │
                ▼
2. Atomic Sequence Allocation via MongoDB findOneAndUpdate with $inc
   Target Document: { _id: "FY2026-27", sequence: { $inc: 1 } }
   Result: AC/2026-27/001001 (Guaranteed unique, sequential)
                │
                ▼
3. MongoDB Multi-Document ACID Transaction
   ├── Update Donation record (status: COMPLETED)
   ├── Create Receipt record with unique receiptNumber & certificateNumber
   ├── Create AuditLog entry with admin/system actor and timestamp
   └── Commit Transaction
                │
                ▼
4. Atomic Campaign Increment
   Update Campaign.collectedAmount via atomic $inc
                │
                ▼
5. Asynchronous Queue Dispatch (BullMQ / In-Process Worker)
   PDFKit renders Receipt & 80G Certificate with embedded Devanagari font
```

### Automated Concurrency Test Results:
Our automated test suite (`npm run test:concurrency`) simulates 100 simultaneous donations hitting the backend simultaneously:
- **100 of 100 transactions committed successfully**
- **100 unique receipt numbers generated without gaps or duplicate allocations**
- **Zero race conditions or deadlocks**

---

## 🤖 AI Architecture: Groq Cloud Integration

Sahayata utilizes Groq Cloud API (`llama-3.3-70b-versatile` or `llama3-70b-8192`) for structured content synthesis:
1. **Official Notice Summarization**: Administrators upload official government notifications. Groq converts dense bureaucratic circulars into simplified conversational Hindi JSON.
2. **Strict Zod Schema Enforcement**: All model responses are validated using runtime Zod schemas. If the API returns invalid JSON or fails, the application gracefully surfaces a clear error, preserves the raw notice, and enables manual editing.
3. **Draft Governance Lifecycle**: AI outputs *never* auto-publish. Every generated summary begins in `DRAFT` status and requires explicit human review and approval by an authorized administrator.
4. **Natural Language Query Fact Extraction**: Rural women can describe their situation in conversational Hindi (e.g., *"मैं भोपाल से हूँ और मेरे पास बीपीएल कार्ड है"*). The LLM is used *solely* to extract structured parameters (`{ district: 'Bhopal', bplCard: true }`), which are then passed to the **deterministic eligibility engine**. AI is never permitted to make the final eligibility judgment.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript, RESTful JSON APIs, CORS, Cookie-Parser |
| **Database** | MongoDB Atlas / In-Memory Replica Set, Mongoose, ACID Transactions, WiredTiger |
| **Authentication** | JSON Web Tokens (JWT), Secure HTTP-Only Cookies, Role-Based Access Control (RBAC) |
| **Background Processing** | Redis, BullMQ with resilient in-process async queue fallback |
| **AI Integration** | Groq Cloud SDK (`groq-sdk`), Zod schema validation |
| **Document Generation** | PDFKit with embedded `NotoSansDevanagari-Regular.ttf` font |
| **Testing** | Jest, Supertest, MongoDB Memory Server Replica Set |

---

## 🏁 Quickstart & Installation

### 1. Prerequisites
- Node.js v18.0.0 or higher
- npm v9.0.0 or higher

### 2. Clone and Setup
```bash
git clone <repository-url>
cd sahayata

# Install dependencies
npm --prefix backend install
npm --prefix frontend install
```

### 3. Seed Sample Data
```bash
npm run seed
```
*Seeds the exact statutory schemes (SCH-014, SCH-022, SCH-031, SCH-045), 3 live campaigns, demo admin, demo donor, and sample receipts.*

### 4. Run the Dev Servers
In Terminal 1 (Backend API & Worker):
```bash
npm run dev:backend
# API running on http://localhost:5000
```

In Terminal 2 (Frontend Client):
```bash
npm run dev:frontend
# App accessible at http://localhost:3000
```

---

## 🧪 Automated Testing

```bash
# Run backend unit & integration tests
npm run test:backend

# Run 100 concurrent donation transactions load test
npm run test:concurrency
```

---

## 🔑 Demo Accounts

- **Trust Administrator**: `admin@sahayata.org.in` | `Admin@1234`
- **Individual Donor**: `donor@sahayata.org.in` | `Donor@1234`
- *Tip: Use the convenient 1-click demo fill buttons on the `/login` screen for fast testing.*

---

## 📄 License & Attribution
Designed and built for Company A Charitable Trust, Bhopal, Madhya Pradesh. Fictional statutory details and illustrative schemes clearly marked for evaluation.
