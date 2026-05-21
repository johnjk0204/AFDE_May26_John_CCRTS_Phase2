"""
STAGE 3 — LOAD
Creates ETL analytics tables (if absent) then upserts all
aggregated data into PostgreSQL reporting tables.
"""

from datetime import datetime

import numpy as np
import psycopg2
from psycopg2.extras import execute_values

from config import DB_CONFIG, SCHEMA_PATH


def _py(v):
    """Convert numpy scalars to native Python types so psycopg2 can serialize them."""
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return None if np.isnan(v) else float(v)
    if isinstance(v, float) and np.isnan(v):
        return None
    return v


def _conn():
    return psycopg2.connect(**DB_CONFIG)


def _create_tables(conn) -> None:
    print("[LOAD] Ensuring analytics tables exist ...")
    with open(SCHEMA_PATH, 'r') as f:
        schema_sql = f.read()
    with conn.cursor() as cur:
        cur.execute(schema_sql)
    conn.commit()


def _load_summary(conn, summary: dict) -> None:
    print("[LOAD] Loading complaint summary ...")
    sql = """
        INSERT INTO etl_complaint_summary
            (total_complaints, open_complaints, in_progress_complaints,
             resolved_complaints, closed_complaints, escalated_complaints,
             avg_resolution_hours, sla_breach_count, sla_compliance_rate,
             total_feedback_count, avg_feedback_rating, dataset_source, etl_run_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    with conn.cursor() as cur:
        cur.execute(sql, (
            summary['total_complaints'],   summary['open_complaints'],
            summary['in_progress_complaints'], summary['resolved_complaints'],
            summary['closed_complaints'],  summary['escalated_complaints'],
            summary['avg_resolution_hours'], summary['sla_breach_count'],
            summary['sla_compliance_rate'], summary['total_feedback_count'],
            summary['avg_feedback_rating'], summary['dataset_source'],
            datetime.now(),
        ))
    conn.commit()


def _load_agent_performance(conn, df) -> None:
    print("[LOAD] Loading agent performance ...")
    rows = [
        (r['agent_name'], int(r['total_assigned']), int(r['total_resolved']),
         _py(r['resolution_rate']), _py(r['avg_resolution_hours']),
         int(r['sla_breaches']), _py(r['avg_feedback_rating']), datetime.now())
        for _, r in df.iterrows()
    ]
    with conn.cursor() as cur:
        cur.execute("DELETE FROM etl_agent_performance")
        execute_values(cur, """
            INSERT INTO etl_agent_performance
                (agent_name, total_assigned, total_resolved, resolution_rate,
                 avg_resolution_hours, sla_breaches, avg_feedback_rating, etl_run_at)
            VALUES %s
        """, rows)
    conn.commit()


def _load_category_trends(conn, df) -> None:
    print("[LOAD] Loading category trends ...")
    rows = [
        (r['category_name'], int(r['total_complaints']), int(r['resolved_count']),
         int(r['open_count']), _py(r['avg_resolution_hours']),
         int(r['sla_breach_count']), datetime.now())
        for _, r in df.iterrows()
    ]
    with conn.cursor() as cur:
        cur.execute("DELETE FROM etl_category_trends")
        execute_values(cur, """
            INSERT INTO etl_category_trends
                (category_name, total_complaints, resolved_count, open_count,
                 avg_resolution_hours, sla_breach_count, etl_run_at)
            VALUES %s
        """, rows)
    conn.commit()


def _load_monthly_trends(conn, df) -> None:
    print("[LOAD] Loading monthly trends ...")
    rows = [
        (r['report_month'], int(r['total_complaints']), int(r['resolved_complaints']),
         _py(r['avg_resolution_hours']), int(r['sla_breach_count']),
         _py(r['avg_feedback_rating']), datetime.now())
        for _, r in df.iterrows()
    ]
    with conn.cursor() as cur:
        cur.execute("DELETE FROM etl_monthly_trends")
        execute_values(cur, """
            INSERT INTO etl_monthly_trends
                (report_month, total_complaints, resolved_complaints,
                 avg_resolution_hours, sla_breach_count, avg_feedback_rating, etl_run_at)
            VALUES %s
        """, rows)
    conn.commit()


def _load_priority_analysis(conn, df) -> None:
    print("[LOAD] Loading priority analysis ...")
    rows = [
        (r['priority'], int(r['total_complaints']), int(r['resolved_count']),
         _py(r['avg_resolution_hours']), int(r['sla_breach_count']),
         _py(r['sla_breach_rate']), datetime.now())
        for _, r in df.iterrows()
    ]
    with conn.cursor() as cur:
        cur.execute("DELETE FROM etl_priority_analysis")
        execute_values(cur, """
            INSERT INTO etl_priority_analysis
                (priority, total_complaints, resolved_count, avg_resolution_hours,
                 sla_breach_count, sla_breach_rate, etl_run_at)
            VALUES %s
        """, rows)
    conn.commit()


def load(data: dict) -> None:
    conn = _conn()
    try:
        _create_tables(conn)
        _load_summary(conn, data['summary'])
        _load_agent_performance(conn, data['agent_performance'])
        _load_category_trends(conn, data['category_trends'])
        _load_monthly_trends(conn, data['monthly_trends'])
        _load_priority_analysis(conn, data['priority_analysis'])
        print("[LOAD] All analytics tables updated successfully.")
    finally:
        conn.close()
