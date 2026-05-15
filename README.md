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
