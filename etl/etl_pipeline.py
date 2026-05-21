#!/usr/bin/env python3
"""
Customer Complaint Analytics — ETL Pipeline
Phase 2 Capstone

Usage:
    cd etl
    pip install -r requirements.txt
    cp .env.example .env        # fill in DB credentials
    python etl_pipeline.py

Pipeline stages
---------------
  1. EXTRACT   — reads complaints_dataset.csv + live PostgreSQL data
  2. TRANSFORM — cleans, normalises, and aggregates into 5 metric sets
  3. LOAD      — writes aggregated results into PostgreSQL analytics tables
"""

import sys
import time
from datetime import datetime

# Force UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from extract import extract
from transform import transform
from load import load


def run() -> None:
    start = time.perf_counter()
    sep = "=" * 62

    print(sep)
    print("  CUSTOMER COMPLAINT ANALYTICS  --  ETL PIPELINE")
    print(f"  Started : {datetime.now().strftime('%Y-%m-%d  %H:%M:%S')}")
    print(sep)

    # ── Stage 1: Extract ─────────────────────────────────────────
    print("\n--- STAGE 1 : EXTRACT ---")
    raw = extract()

    # ── Stage 2: Transform ────────────────────────────────────────
    print("\n--- STAGE 2 : TRANSFORM ---")
    data = transform(raw)

    # ── Stage 3: Load ─────────────────────────────────────────────
    print("\n--- STAGE 3 : LOAD ---")
    load(data)

    # ── Summary ───────────────────────────────────────────────────
    elapsed  = time.perf_counter() - start
    summary  = data['summary']
    print()
    print(sep)
    print("  ETL PIPELINE COMPLETE")
    print(f"  Duration            : {elapsed:.2f}s")
    print(f"  Records processed   : {summary['total_complaints']:,}")
    print(f"  SLA compliance rate : {summary['sla_compliance_rate']}%")
    print(f"  SLA breaches        : {summary['sla_breach_count']}")
    print(f"  Avg resolution time : {summary['avg_resolution_hours']}h")
    print(f"  Avg feedback rating : {summary['avg_feedback_rating']} / 5")
    print(sep)


if __name__ == '__main__':
    try:
        run()
    except Exception as exc:
        print(f"\n[ERROR] ETL pipeline failed: {exc}", file=sys.stderr)
        sys.exit(1)
