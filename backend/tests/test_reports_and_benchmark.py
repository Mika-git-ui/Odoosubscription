import time
import uuid
from datetime import date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import Invoice, Payment, Customer, Subscription, Plan


def test_reports_aggregation_and_pagination(client: TestClient, db: Session, admin_headers):
    # Retrieve summary
    res = client.get("/reports/summary", headers=admin_headers)
    assert res.status_code == 200, res.text
    summary = res.json()

    # Ensure required keys exist
    expected_keys = [
        "active_subscriptions",
        "revenue_received",
        "outstanding_amount",
        "outstanding_invoice_count",
        "overdue_amount",
        "overdue_invoice_count",
        "date_from",
        "date_to"
    ]
    for key in expected_keys:
        assert key in summary

    # Date filter test
    date_from = date.today() - timedelta(days=90)
    date_to = date.today()
    res_filtered = client.get(
        f"/reports/summary?date_from={date_from}&date_to={date_to}",
        headers=admin_headers
    )
    assert res_filtered.status_code == 200
    filtered_summary = res_filtered.json()
    assert filtered_summary["date_from"] == str(date_from)
    assert filtered_summary["date_to"] == str(date_to)

    # Date filter validation: date_from > date_to should return 400
    res_invalid_date = client.get(
        f"/reports/summary?date_from={date_to}&date_to={date_from}",
        headers=admin_headers
    )
    assert res_invalid_date.status_code == 400

    # Overdue invoices with pagination
    res_overdue = client.get("/reports/overdue-invoices?skip=0&limit=10", headers=admin_headers)
    assert res_overdue.status_code == 200
    overdue_data = res_overdue.json()
    assert "total_overdue_amount" in overdue_data
    assert "total_overdue_invoices" in overdue_data
    assert overdue_data["skip"] == 0
    assert overdue_data["limit"] == 10
    assert isinstance(overdue_data["invoices"], list)
    assert len(overdue_data["invoices"]) <= 10


def test_reports_performance_benchmark(client: TestClient, db: Session, admin_headers):
    """
    Practical performance test:
    Executes multiple runs of the aggregated report endpoints and measures
    wall-clock latency. Asserts that the response time is well under the
    2.0-second threshold.
    """
    # 1. Benchmark /reports/summary
    durations_summary = []
    for _ in range(5):
        t0 = time.perf_counter()
        res = client.get("/reports/summary", headers=admin_headers)
        t1 = time.perf_counter()
        assert res.status_code == 200
        durations_summary.append(t1 - t0)

    avg_summary_ms = (sum(durations_summary) / len(durations_summary)) * 1000
    max_summary_ms = max(durations_summary) * 1000

    print(f"\n[BENCHMARK] /reports/summary: avg={avg_summary_ms:.2f}ms, max={max_summary_ms:.2f}ms")
    assert max_summary_ms < 2000, f"Summary report too slow: {max_summary_ms:.2f}ms >= 2000ms"

    # 2. Benchmark /reports/overdue-invoices
    durations_overdue = []
    for _ in range(5):
        t0 = time.perf_counter()
        res = client.get("/reports/overdue-invoices?skip=0&limit=50", headers=admin_headers)
        t1 = time.perf_counter()
        assert res.status_code == 200
        durations_overdue.append(t1 - t0)

    avg_overdue_ms = (sum(durations_overdue) / len(durations_overdue)) * 1000
    max_overdue_ms = max(durations_overdue) * 1000

    print(f"\n[BENCHMARK] /reports/overdue-invoices: avg={avg_overdue_ms:.2f}ms, max={max_overdue_ms:.2f}ms")
    assert max_overdue_ms < 2000, f"Overdue invoices report too slow: {max_overdue_ms:.2f}ms >= 2000ms"
