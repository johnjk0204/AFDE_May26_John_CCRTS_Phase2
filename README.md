# Customer Complaint & Resolution Tracking System

A full-stack web application for managing customer complaints from registration to resolution.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Recharts, React Router v6 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| File Upload | Multer |
| Email | Nodemailer |
| SLA Monitoring | node-cron (runs every 15 minutes) |

---

## Project Structure

```
customer-complaint-system/
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── config/db.js      # PostgreSQL connection
│   │   ├── middleware/       # Auth, error handler, file upload
│   │   ├── routes/           # API route definitions
│   │   ├── controllers/      # Business logic
│   │   └── services/         # SLA, email, notification services
│   ├── uploads/              # Uploaded attachments
│   ├── server.js
│   └── package.json
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/            # All screen components
│   │   ├── components/       # Shared components (Layout, Sidebar)
│   │   ├── context/          # Auth context
│   │   ├── services/api.js   # Axios API calls
│   │   └── utils/helpers.js  # Utility functions
│   └── package.json
└── database/
    ├── schema.sql            # Table definitions
    └── seed.sql              # Sample data
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Step 1 — Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE complaint_system;
\q

# Run schema and seed
psql -U postgres -d complaint_system -f database/schema.sql
psql -U postgres -d complaint_system -f database/seed.sql
```

### Step 2 — Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values (DB password, JWT secret, etc.)
notepad .env

# Start development server
npm run dev
```

Backend runs at: **http://localhost:5000**

### Step 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend runs at: **http://localhost:3000**

---

## Environment Variables (backend/.env)

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=complaint_system
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@company.com

CLIENT_URL=http://localhost:3000
```

---

## Demo Accounts

All accounts use password: **Password@123**

| Role | Email |
|------|-------|
| Admin | admin@company.com |
| Supervisor | supervisor@company.com |
| Support Agent | agent1@company.com |
| Support Agent | agent2@company.com |
| Customer | customer1@example.com |
| Customer | customer2@example.com |
| Quality Team | quality@company.com |

---

## Features

### Authentication
- JWT-based login/logout
- Role-based access control (5 roles)
- Forgot/reset password flow
- Secure password hashing (bcrypt)

### Complaint Management
- Auto-generated complaint numbers (CMP-YYYYMMDD-XXXX)
- File attachments (up to 5 files, 5MB each)
- Full complaint lifecycle workflow
- Complete audit history trail

### SLA Management
- Automatic SLA deadline calculation by priority:
  - Critical: 4 hours
  - High: 24 hours
  - Medium: 48 hours
  - Low: 72 hours
- Auto-escalation on SLA breach (cron job every 15 min)
- SLA breach notifications

### Workflow Statuses
`Open → Assigned → In Progress → Pending Customer Response → Escalated → Resolved → Closed`

### Dashboard & Reports
- Real-time statistics
- Monthly trend charts
- Category analysis
- Agent performance metrics
- Customer satisfaction ratings
- SLA breach monitoring

### Notifications
- In-app notification center
- Email notifications (when SMTP configured)
- Auto-notifications on status changes

---

## API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | POST /api/auth/login | User login |
| Auth | POST /api/auth/register | Customer registration |
| Complaints | GET /api/complaints | List complaints |
| Complaints | POST /api/complaints | Create complaint |
| Complaints | PUT /api/complaints/:id/assign | Assign to agent |
| Complaints | PUT /api/complaints/:id/resolve | Mark resolved |
| Dashboard | GET /api/dashboard/stats | Overview stats |
| Dashboard | GET /api/dashboard/agent-performance | Agent metrics |
| Feedback | POST /api/feedback/complaint/:id | Submit rating |
| Users | GET /api/users | List users (Admin) |
| Notifications | GET /api/notifications | User notifications |

---

## Screens

| Screen | Access |
|--------|--------|
| Login / Register | Public |
| Dashboard | All roles |
| New Complaint | Customer |
| Complaint List | All roles (filtered by role) |
| Complaint Detail | All roles |
| Work Queue | Support Agent, Admin, Supervisor |
| Escalation Dashboard | Admin, Supervisor |
| Reports Dashboard | Admin, Supervisor, Quality Team |
| User Management | Admin only |
| Category Management | Admin only |
| Notifications | All roles |
| Profile | All roles |

---

## Phase 2 — ETL Pipeline

### Overview

Phase 2 extends the system with a **Python ETL pipeline** that ingests historical complaint data from a CSV dataset, transforms it into analytics-ready metrics, and loads the results into dedicated PostgreSQL reporting tables. The frontend Reports Dashboard then visualises these ETL-generated insights alongside the live operational data.

### ETL Workflow

```
datasets/complaints_dataset.csv
          │
          ▼
┌─────────────────────────┐
│   STAGE 1 — EXTRACT     │  Reads CSV (85 historical records, 12 months)
│   extract.py            │  + merges with live PostgreSQL complaints table
└──────────┬──────────────┘
           │ raw DataFrame
           ▼
┌─────────────────────────┐
│   STAGE 2 — TRANSFORM   │  • Parses & normalises dates, enums, ratings
│   transform.py          │  • Derives resolution_time_hours, SLA breach flag
│                         │  • Aggregates into 5 metric sets:
│                         │      - Complaint summary (KPIs)
│                         │      - Agent performance
│                         │      - Category trends
│                         │      - Monthly trends (12 months)
│                         │      - Priority analysis
└──────────┬──────────────┘
           │ dict of DataFrames
           ▼
┌─────────────────────────┐
│   STAGE 3 — LOAD        │  Creates analytics tables (if absent)
│   load.py               │  Truncates & reloads reporting tables:
│                         │      etl_complaint_summary
│                         │      etl_agent_performance
│                         │      etl_category_trends
│                         │      etl_monthly_trends
│                         │      etl_priority_analysis
└─────────────────────────┘
           │
           ▼
  PostgreSQL → Backend API → React Dashboard
```

### Dataset

| File | Records | Date Range |
|------|---------|------------|
| `datasets/complaints_dataset.csv` | 85 | June 2025 – May 2026 |

Columns: `complaint_number, customer_name, customer_email, category, subject, priority, status, assigned_agent, created_date, resolved_date, closed_date, sla_deadline, sla_breached, resolution_time_hours, feedback_rating, region`

### ETL Setup & Execution

```bash
# 1. Navigate to etl folder
cd etl

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure database connection
cp .env.example .env
# Edit .env with your DB credentials

# 4. Create analytics tables in PostgreSQL
psql -U postgres -d complaint_system -f ../database/analytics_schema.sql

# 5. Run the pipeline
python etl_pipeline.py
```

**Expected output:**
```
==============================================================
  CUSTOMER COMPLAINT ANALYTICS  —  ETL PIPELINE
  Started : 2026-05-20  10:00:00
==============================================================

--- STAGE 1 : EXTRACT ---
[EXTRACT] Reading from complaints_dataset.csv ...
[EXTRACT] CSV  → 85 records loaded
[EXTRACT] DB   → 5 records loaded
[EXTRACT] Combined (after dedup) → 90 records

--- STAGE 2 : TRANSFORM ---
[TRANSFORM] Cleaning & normalising ...
[TRANSFORM] Building complaint summary ...
...

--- STAGE 3 : LOAD ---
[LOAD] All analytics tables updated successfully.

==============================================================
  ETL PIPELINE COMPLETE
  Duration            : 1.24s
  Records processed   : 90
  SLA compliance rate : 82.22%
  SLA breaches        : 16
  Avg resolution time : 32.5h
  Avg feedback rating : 3.89 / 5
==============================================================
```

### Analytics Tables (PostgreSQL)

| Table | Description |
|-------|-------------|
| `etl_complaint_summary` | Overall KPIs: totals, SLA rate, avg resolution, avg rating |
| `etl_agent_performance` | Per-agent: assigned, resolved, resolution rate, avg hours, SLA breaches |
| `etl_category_trends` | Per-category: total, resolved, open, avg hours, SLA breaches |
| `etl_monthly_trends` | Month-by-month: totals, resolved, SLA breaches, avg rating |
| `etl_priority_analysis` | Per-priority: totals, resolved, avg hours, SLA breach rate |

### ETL API Endpoints

| Endpoint | Access | Description |
|----------|--------|-------------|
| `GET /api/dashboard/etl-summary` | Admin, Supervisor, Quality Team | Latest KPI summary |
| `GET /api/dashboard/etl-agent-performance` | Admin, Supervisor, Quality Team | Agent metrics from ETL |
| `GET /api/dashboard/etl-category-trends` | Admin, Supervisor, Quality Team | Category breakdown from ETL |
| `GET /api/dashboard/etl-monthly-trends` | Admin, Supervisor, Quality Team | 12-month trend from ETL |
| `GET /api/dashboard/etl-priority-analysis` | Admin, Supervisor, Quality Team | Priority analysis from ETL |

### ETL Project Structure

```
customer-complaint-system/
├── datasets/
│   └── complaints_dataset.csv     # Input data (85 records, 12 months)
├── etl/
│   ├── etl_pipeline.py            # Main orchestrator (run this)
│   ├── extract.py                 # Stage 1: read CSV + PostgreSQL
│   ├── transform.py               # Stage 2: clean, normalise, aggregate
│   ├── load.py                    # Stage 3: write to analytics tables
│   ├── config.py                  # DB connection & path config
│   ├── requirements.txt           # Python dependencies
│   └── .env.example               # Environment variable template
└── database/
    ├── schema.sql                  # Core application tables
    ├── seed.sql                    # Demo data
    └── analytics_schema.sql       # ETL reporting tables (Phase 2)
```
