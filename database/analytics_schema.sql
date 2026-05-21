-- Phase 2 ETL Analytics Tables
-- Created by Python ETL pipeline; queried by backend dashboard API

CREATE TABLE IF NOT EXISTS etl_complaint_summary (
    id                    SERIAL PRIMARY KEY,
    total_complaints      INTEGER DEFAULT 0,
    open_complaints       INTEGER DEFAULT 0,
    in_progress_complaints INTEGER DEFAULT 0,
    resolved_complaints   INTEGER DEFAULT 0,
    closed_complaints     INTEGER DEFAULT 0,
    escalated_complaints  INTEGER DEFAULT 0,
    avg_resolution_hours  DECIMAL(10,2),
    sla_breach_count      INTEGER DEFAULT 0,
    sla_compliance_rate   DECIMAL(5,2),
    total_feedback_count  INTEGER DEFAULT 0,
    avg_feedback_rating   DECIMAL(3,2),
    dataset_source        VARCHAR(255),
    etl_run_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS etl_agent_performance (
    id                   SERIAL PRIMARY KEY,
    agent_name           VARCHAR(255) NOT NULL,
    total_assigned       INTEGER DEFAULT 0,
    total_resolved       INTEGER DEFAULT 0,
    resolution_rate      DECIMAL(5,2),
    avg_resolution_hours DECIMAL(10,2),
    sla_breaches         INTEGER DEFAULT 0,
    avg_feedback_rating  DECIMAL(3,2),
    etl_run_at           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS etl_category_trends (
    id                   SERIAL PRIMARY KEY,
    category_name        VARCHAR(255) NOT NULL,
    total_complaints     INTEGER DEFAULT 0,
    resolved_count       INTEGER DEFAULT 0,
    open_count           INTEGER DEFAULT 0,
    avg_resolution_hours DECIMAL(10,2),
    sla_breach_count     INTEGER DEFAULT 0,
    etl_run_at           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS etl_monthly_trends (
    id                   SERIAL PRIMARY KEY,
    report_month         VARCHAR(7) NOT NULL,
    total_complaints     INTEGER DEFAULT 0,
    resolved_complaints  INTEGER DEFAULT 0,
    avg_resolution_hours DECIMAL(10,2),
    sla_breach_count     INTEGER DEFAULT 0,
    avg_feedback_rating  DECIMAL(3,2),
    etl_run_at           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS etl_priority_analysis (
    id                   SERIAL PRIMARY KEY,
    priority             VARCHAR(50) NOT NULL,
    total_complaints     INTEGER DEFAULT 0,
    resolved_count       INTEGER DEFAULT 0,
    avg_resolution_hours DECIMAL(10,2),
    sla_breach_count     INTEGER DEFAULT 0,
    sla_breach_rate      DECIMAL(5,2),
    etl_run_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_etl_summary_run_at    ON etl_complaint_summary(etl_run_at);
CREATE INDEX IF NOT EXISTS idx_etl_agent_run_at      ON etl_agent_performance(etl_run_at);
CREATE INDEX IF NOT EXISTS idx_etl_category_run_at   ON etl_category_trends(etl_run_at);
CREATE INDEX IF NOT EXISTS idx_etl_monthly_month     ON etl_monthly_trends(report_month);
CREATE INDEX IF NOT EXISTS idx_etl_priority_run_at   ON etl_priority_analysis(etl_run_at);
