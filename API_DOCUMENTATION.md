# API Documentation — Customer Complaint & Resolution Tracking System

Base URL: `http://localhost:4000/api`

All protected endpoints require the header:
```
Authorization: Bearer <token>
```

---

## Authentication

### POST /auth/register
Register a new customer account.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "password": "Password@123",
  "phone": "+1-555-0100"
}
```

**Response (201):**
```json
{
  "message": "Registration successful.",
  "token": "<jwt_token>",
  "userId": "<uuid>"
}
```

---

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "Password@123"
}
```

**Response (200):**
```json
{
  "message": "Login successful.",
  "token": "<jwt_token>",
  "user": {
    "user_id": "<uuid>",
    "name": "System Admin",
    "email": "admin@company.com",
    "role_name": "Admin"
  }
}
```

---

### GET /auth/me
Get current logged-in user details. *(Protected)*

**Response (200):**
```json
{
  "user_id": "<uuid>",
  "name": "System Admin",
  "email": "admin@company.com",
  "role_name": "Admin"
}
```

---

### POST /auth/forgot-password
Request a password reset email.

**Request Body:**
```json
{ "email": "user@example.com" }
```

---

### POST /auth/reset-password
Reset password using token.

**Request Body:**
```json
{
  "token": "<reset_token>",
  "password": "NewPassword@123"
}
```

---

### PUT /auth/change-password
Change password for logged-in user. *(Protected)*

**Request Body:**
```json
{
  "currentPassword": "Password@123",
  "newPassword": "NewPassword@123"
}
```

---

## Complaints

### GET /complaints
Get all complaints. *(Protected — Admin, Supervisor, Agent)*

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by status |
| priority | string | Filter by priority |
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 20) |

---

### GET /complaints/my
Get complaints for the logged-in customer. *(Protected — Customer)*

---

### GET /complaints/:id
Get a single complaint by ID. *(Protected)*

---

### POST /complaints
Create a new complaint. *(Protected — Customer)*

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| subject | string | Yes |
| description | string | Yes |
| category_id | uuid | Yes |
| priority | string | Yes (Low/Medium/High/Critical) |
| attachments | file | No (max 5 files, 5MB each) |

---

### PUT /complaints/:id/assign
Assign a complaint to an agent. *(Protected — Admin, Supervisor)*

**Request Body:**
```json
{ "agent_id": "<uuid>" }
```

---

### PUT /complaints/:id/status
Update complaint status. *(Protected — Agent, Admin, Supervisor)*

**Request Body:**
```json
{
  "status": "In Progress",
  "comment": "Working on it."
}
```

---

### PUT /complaints/:id/resolve
Mark a complaint as resolved. *(Protected — Agent, Admin)*

**Request Body:**
```json
{ "resolution_notes": "Issue has been fixed." }
```

---

### PUT /complaints/:id/escalate
Escalate a complaint. *(Protected — Admin, Supervisor)*

---

### PUT /complaints/:id/close
Close a resolved complaint. *(Protected — Admin, Supervisor)*

---

### GET /complaints/:id/history
Get audit trail for a complaint. *(Protected)*

---

## Users

### GET /users
Get all users. *(Protected — Admin)*

### POST /users
Create a new user. *(Protected — Admin)*

**Request Body:**
```json
{
  "name": "New Agent",
  "email": "agent@company.com",
  "password": "Password@123",
  "role_id": "<uuid>",
  "phone": "+1-555-0200"
}
```

### GET /users/agents
Get all support agents. *(Protected — Admin, Supervisor)*

### PUT /users/:id
Update a user. *(Protected — Admin)*

### PUT /users/:id/toggle-status
Activate or deactivate a user. *(Protected — Admin)*

### DELETE /users/:id
Delete a user. *(Protected — Admin)*

---

## Categories

### GET /categories
Get all complaint categories. *(Protected)*

### POST /categories
Create a category. *(Protected — Admin)*

**Request Body:**
```json
{
  "category_name": "Billing Issues",
  "description": "Issues related to invoices and payments"
}
```

### PUT /categories/:id
Update a category. *(Protected — Admin)*

### DELETE /categories/:id
Delete a category. *(Protected — Admin)*

---

## Dashboard

### GET /dashboard/stats
Get overview statistics. *(Protected — Admin, Supervisor, Quality Team)*

**Response:**
```json
{
  "total_complaints": 50,
  "open_complaints": 10,
  "resolved_complaints": 30,
  "sla_breaches": 3
}
```

### GET /dashboard/sla-breaches
Get complaints that have breached SLA. *(Protected)*

### GET /dashboard/agent-performance
Get performance metrics per agent. *(Protected)*

### GET /dashboard/category-analysis
Get complaint breakdown by category. *(Protected)*

### GET /dashboard/monthly-trends
Get monthly complaint trends. *(Protected)*

### GET /dashboard/priority-distribution
Get complaint distribution by priority. *(Protected)*

### GET /dashboard/resolution-time
Get average resolution time stats. *(Protected)*

---

## Feedback

### POST /feedback/complaint/:id
Submit customer satisfaction rating. *(Protected — Customer)*

**Request Body:**
```json
{
  "rating": 5,
  "comments": "Excellent support!"
}
```

### GET /feedback/complaint/:id
Get feedback for a complaint. *(Protected)*

### GET /feedback/analytics
Get feedback analytics. *(Protected — Admin, Supervisor, Quality Team)*

---

## Notifications

### GET /notifications
Get notifications for the logged-in user. *(Protected)*

### GET /notifications/unread-count
Get count of unread notifications. *(Protected)*

### PUT /notifications/:id/read
Mark a notification as read. *(Protected)*

### PUT /notifications/mark-all-read
Mark all notifications as read. *(Protected)*

### DELETE /notifications/:id
Delete a notification. *(Protected)*

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

## Roles & Access

| Role | Access Level |
|------|-------------|
| Admin | Full access |
| Supervisor | Monitor, assign, escalate |
| Support Agent | Handle assigned complaints |
| Customer | Submit and track own complaints |
| Quality Team | Read-only reports and analytics |
