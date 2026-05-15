-- Customer Complaint & Resolution Tracking System
-- PostgreSQL Database Schema

-- Drop existing tables (order matters for FK constraints)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS complaint_history CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Roles Table
CREATE TABLE roles (
    role_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name   VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Users Table
CREATE TABLE users (
    user_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(100) NOT NULL,
    email                VARCHAR(150) NOT NULL UNIQUE,
    password             VARCHAR(255) NOT NULL,
    phone                VARCHAR(20),
    role_id              UUID NOT NULL REFERENCES roles(role_id),
    is_active            BOOLEAN DEFAULT true,
    reset_token          VARCHAR(255),
    reset_token_expires  TIMESTAMP,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

-- Categories Table
CREATE TABLE categories (
    category_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Complaints Table
CREATE TABLE complaints (
    complaint_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number    VARCHAR(30) NOT NULL UNIQUE,
    customer_id         UUID NOT NULL REFERENCES users(user_id),
    category_id         UUID NOT NULL REFERENCES categories(category_id),
    assigned_agent_id   UUID REFERENCES users(user_id),
    subject             VARCHAR(255),
    description         TEXT NOT NULL,
    priority            VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status              VARCHAR(50) NOT NULL DEFAULT 'Open'
                        CHECK (status IN ('Open','Assigned','In Progress','Pending Customer Response','Escalated','Resolved','Closed')),
    resolution_notes    TEXT,
    is_escalated        BOOLEAN DEFAULT false,
    sla_deadline        TIMESTAMP,
    sla_notified        BOOLEAN DEFAULT false,
    resolved_at         TIMESTAMP,
    closed_at           TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Complaint History / Audit Trail Table
CREATE TABLE complaint_history (
    history_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    updated_by   UUID NOT NULL REFERENCES users(user_id),
    old_status   VARCHAR(50),
    new_status   VARCHAR(50),
    comment      TEXT,
    updated_date TIMESTAMP DEFAULT NOW()
);

-- Attachments Table
CREATE TABLE attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id  UUID NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    file_name     VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_size     BIGINT,
    file_type     VARCHAR(100),
    uploaded_at   TIMESTAMP DEFAULT NOW()
);

-- Feedback Table
CREATE TABLE feedback (
    feedback_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL UNIQUE REFERENCES complaints(complaint_id),
    customer_id  UUID NOT NULL REFERENCES users(user_id),
    rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments     TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    complaint_id    UUID REFERENCES complaints(complaint_id) ON DELETE SET NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_complaints_customer   ON complaints(customer_id);
CREATE INDEX idx_complaints_agent      ON complaints(assigned_agent_id);
CREATE INDEX idx_complaints_status     ON complaints(status);
CREATE INDEX idx_complaints_priority   ON complaints(priority);
CREATE INDEX idx_complaints_sla        ON complaints(sla_deadline);
CREATE INDEX idx_history_complaint     ON complaint_history(complaint_id);
CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_unread  ON notifications(user_id, is_read);
CREATE INDEX idx_feedback_complaint    ON feedback(complaint_id);
