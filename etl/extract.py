"""
STAGE 1 — EXTRACT
Reads complaint data from two sources:
  1. datasets/complaints_dataset.csv  (historical / bulk data)
  2. PostgreSQL complaints table       (live operational data)
Both are merged and de-duplicated on complaint_number.
"""

import pandas as pd
import psycopg2
from sqlalchemy import create_engine, text
from config import DB_CONFIG, DATASET_PATH


def extract_from_csv() -> pd.DataFrame:
    print("[EXTRACT] Reading from complaints_dataset.csv ...")
    df = pd.read_csv(DATASET_PATH)
    print(f"[EXTRACT] CSV  -> {len(df):,} records loaded")
    return df


def _alchemy_url() -> str:
    c = DB_CONFIG
    base = f"postgresql+psycopg2://{c['user']}:{c['password']}@{c['host']}:{c['port']}/{c['database']}"
    if c.get('sslmode') == 'require':
        base += '?sslmode=require'
    return base


def extract_from_db() -> pd.DataFrame:
    print("[EXTRACT] Reading from PostgreSQL ...")
    engine = create_engine(_alchemy_url())
    sql = """
        SELECT
            c.complaint_number,
            cu.name                                         AS customer_name,
            cu.email                                        AS customer_email,
            cat.category_name                               AS category,
            c.subject,
            c.priority,
            c.status,
            COALESCE(ag.name, 'Unassigned')                 AS assigned_agent,
            c.created_at::date                              AS created_date,
            c.resolved_at::date                             AS resolved_date,
            c.closed_at::date                               AS closed_date,
            c.sla_deadline,
            CASE
                WHEN c.sla_deadline < NOW()
                 AND c.status NOT IN ('Resolved','Closed') THEN 'Yes'
                ELSE 'No'
            END                                             AS sla_breached,
            CASE
                WHEN c.resolved_at IS NOT NULL
                THEN ROUND(
                    EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600.0, 2
                )
            END                                             AS resolution_time_hours,
            f.rating                                        AS feedback_rating,
            NULL                                            AS region
        FROM complaints c
        JOIN  users      cu  ON c.customer_id       = cu.user_id
        LEFT JOIN categories cat ON c.category_id   = cat.category_id
        LEFT JOIN users      ag  ON c.assigned_agent_id = ag.user_id
        LEFT JOIN feedback   f   ON c.complaint_id  = f.complaint_id
    """
    with engine.connect() as conn:
        result = conn.execute(text(sql))
        df = pd.DataFrame(result.fetchall(), columns=list(result.keys()))
    engine.dispose()
    print(f"[EXTRACT] DB   -> {len(df):,} records loaded")
    return df


def extract() -> pd.DataFrame:
    csv_df = extract_from_csv()

    try:
        db_df = extract_from_db()
        combined = pd.concat([csv_df, db_df], ignore_index=True)
        combined = combined.drop_duplicates(subset='complaint_number', keep='last')
        print(f"[EXTRACT] Combined (after dedup) -> {len(combined):,} records")
        return combined
    except Exception as exc:
        print(f"[EXTRACT] DB unavailable ({exc}); using CSV data only")
        return csv_df
