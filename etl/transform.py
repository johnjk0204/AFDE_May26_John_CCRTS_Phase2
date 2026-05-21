"""
STAGE 2 — TRANSFORM
Cleans raw data and produces five aggregated DataFrames / dicts
that map directly to the five ETL analytics tables.
"""

import numpy as np
import pandas as pd

RESOLVED_STATUSES = {'Resolved', 'Closed'}
VALID_PRIORITIES  = {'Low', 'Medium', 'High', 'Critical'}


# ── helpers ──────────────────────────────────────────────────────────────────

def _clean(df: pd.DataFrame) -> pd.DataFrame:
    print("[TRANSFORM] Cleaning & normalising ...")

    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

    # Parse dates
    for col in ('created_date', 'resolved_date', 'closed_date', 'sla_deadline'):
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')

    # Standardise enums
    if 'priority' in df.columns:
        df['priority'] = df['priority'].str.strip().str.title()
        df = df[df['priority'].isin(VALID_PRIORITIES)].copy()

    if 'status' in df.columns:
        df['status'] = df['status'].str.strip()

    if 'category' in df.columns:
        df['category'] = df['category'].str.strip()

    if 'assigned_agent' in df.columns:
        df['assigned_agent'] = df['assigned_agent'].fillna('Unassigned').str.strip()

    # Coerce all numeric-ish columns to float (Neon returns decimal.Decimal)
    for col in ('resolution_time_hours', 'feedback_rating'):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Validate feedback rating (must be 1–5)
    if 'feedback_rating' in df.columns:
        df.loc[~df['feedback_rating'].between(1, 5), 'feedback_rating'] = np.nan

    # Derive resolution_time_hours where missing
    if all(c in df.columns for c in ('resolution_time_hours', 'created_date', 'resolved_date')):
        mask = df['resolution_time_hours'].isna() & df['resolved_date'].notna()
        df.loc[mask, 'resolution_time_hours'] = (
            (df.loc[mask, 'resolved_date'] - df.loc[mask, 'created_date'])
            .dt.total_seconds() / 3600
        ).round(2)

    # SLA breached flag → boolean
    if 'sla_breached' in df.columns:
        df['sla_breached'] = (
            df['sla_breached'].astype(str).str.strip().str.title()
            .map({'Yes': True, 'No': False})
            .fillna(False)
        )

    # Report month for grouping
    if 'created_date' in df.columns:
        df['report_month'] = df['created_date'].dt.strftime('%Y-%m')

    print(f"[TRANSFORM] Clean → {len(df):,} records retained")
    return df


# ── aggregations ─────────────────────────────────────────────────────────────

def _summary(df: pd.DataFrame) -> dict:
    print("[TRANSFORM] Building complaint summary ...")
    return {
        'total_complaints':        int(len(df)),
        'open_complaints':         int((df['status'] == 'Open').sum()),
        'in_progress_complaints':  int((df['status'] == 'In Progress').sum()),
        'resolved_complaints':     int((df['status'] == 'Resolved').sum()),
        'closed_complaints':       int((df['status'] == 'Closed').sum()),
        'escalated_complaints':    int((df['status'] == 'Escalated').sum()),
        'avg_resolution_hours':    round(float(df['resolution_time_hours'].mean()), 2)
                                   if df['resolution_time_hours'].notna().any() else None,
        'sla_breach_count':        int(df['sla_breached'].sum()),
        'sla_compliance_rate':     round(float((1 - df['sla_breached'].mean()) * 100), 2),
        'total_feedback_count':    int(df['feedback_rating'].notna().sum()),
        'avg_feedback_rating':     round(float(df['feedback_rating'].mean()), 2)
                                   if df['feedback_rating'].notna().any() else None,
        'dataset_source':          'complaints_dataset.csv + PostgreSQL',
    }


def _agent_performance(df: pd.DataFrame) -> pd.DataFrame:
    print("[TRANSFORM] Aggregating agent performance ...")
    agents = df[df['assigned_agent'] != 'Unassigned'].copy()
    agg = agents.groupby('assigned_agent').agg(
        total_assigned       = ('complaint_number', 'count'),
        total_resolved       = ('status', lambda s: s.isin(RESOLVED_STATUSES).sum()),
        avg_resolution_hours = ('resolution_time_hours', 'mean'),
        sla_breaches         = ('sla_breached', 'sum'),
        avg_feedback_rating  = ('feedback_rating', 'mean'),
    ).reset_index()
    agg['resolution_rate']      = (agg['total_resolved'] / agg['total_assigned'] * 100).round(2)
    agg['avg_resolution_hours'] = agg['avg_resolution_hours'].round(2)
    agg['avg_feedback_rating']  = agg['avg_feedback_rating'].round(2)
    agg.rename(columns={'assigned_agent': 'agent_name'}, inplace=True)
    return agg


def _category_trends(df: pd.DataFrame) -> pd.DataFrame:
    print("[TRANSFORM] Aggregating category trends ...")
    agg = df.groupby('category').agg(
        total_complaints     = ('complaint_number', 'count'),
        resolved_count       = ('status', lambda s: s.isin(RESOLVED_STATUSES).sum()),
        open_count           = ('status', lambda s: (s == 'Open').sum()),
        avg_resolution_hours = ('resolution_time_hours', 'mean'),
        sla_breach_count     = ('sla_breached', 'sum'),
    ).reset_index()
    agg['avg_resolution_hours'] = agg['avg_resolution_hours'].round(2)
    agg.rename(columns={'category': 'category_name'}, inplace=True)
    return agg


def _monthly_trends(df: pd.DataFrame) -> pd.DataFrame:
    print("[TRANSFORM] Aggregating monthly trends ...")
    agg = df.groupby('report_month').agg(
        total_complaints     = ('complaint_number', 'count'),
        resolved_complaints  = ('status', lambda s: s.isin(RESOLVED_STATUSES).sum()),
        avg_resolution_hours = ('resolution_time_hours', 'mean'),
        sla_breach_count     = ('sla_breached', 'sum'),
        avg_feedback_rating  = ('feedback_rating', 'mean'),
    ).reset_index()
    agg['avg_resolution_hours'] = agg['avg_resolution_hours'].round(2)
    agg['avg_feedback_rating']  = agg['avg_feedback_rating'].round(2)
    return agg.sort_values('report_month')


def _priority_analysis(df: pd.DataFrame) -> pd.DataFrame:
    print("[TRANSFORM] Aggregating priority analysis ...")
    agg = df.groupby('priority').agg(
        total_complaints     = ('complaint_number', 'count'),
        resolved_count       = ('status', lambda s: s.isin(RESOLVED_STATUSES).sum()),
        avg_resolution_hours = ('resolution_time_hours', 'mean'),
        sla_breach_count     = ('sla_breached', 'sum'),
    ).reset_index()
    agg['sla_breach_rate']      = (agg['sla_breach_count'] / agg['total_complaints'] * 100).round(2)
    agg['avg_resolution_hours'] = agg['avg_resolution_hours'].round(2)
    return agg


# ── public entry point ────────────────────────────────────────────────────────

def transform(df: pd.DataFrame) -> dict:
    df = _clean(df)
    return {
        'summary':           _summary(df),
        'agent_performance': _agent_performance(df),
        'category_trends':   _category_trends(df),
        'monthly_trends':    _monthly_trends(df),
        'priority_analysis': _priority_analysis(df),
    }
