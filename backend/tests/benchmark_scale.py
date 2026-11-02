import time
import uuid
from datetime import date, timedelta
from decimal import Decimal

from app.database import SessionLocal
from app.models.entities import Invoice, Payment, Customer, Subscription, Plan
from app.routers.reports import report_summary, overdue_invoices


def run_scale_benchmark():
    db = SessionLocal()
    print("\n--- RUNNING HIGH-VOLUME REPORT BENCHMARK (3,000 SUBSCRIPTIONS & INVOICES) ---")

    try:
        cust = db.query(Customer).first()
        plan = db.query(Plan).first()
        today = date.today()

        NUM_RECORDS = 3000

        print(f"Seeding {NUM_RECORDS} subscriptions...")
        subscriptions = []
        for i in range(NUM_RECORDS):
            s = Subscription(
                subscription_number=f"BENCH-SUB-{uuid.uuid4().hex[:6]}-{i}",
                customer_id=cust.id,
                plan_id=plan.id,
                start_date=today - timedelta(days=90),
                next_billing_date=today,
                status="active"
            )
            subscriptions.append(s)

        db.bulk_save_objects(subscriptions)
        db.flush()

        saved_subs = db.query(Subscription.id).filter(Subscription.subscription_number.like("BENCH-SUB-%")).all()

        print(f"Seeding {NUM_RECORDS} representative invoice records...")
        invoices = []
        for i, (sub_id,) in enumerate(saved_subs):
            inv = Invoice(
                invoice_number=f"BENCH-INV-{uuid.uuid4().hex[:6]}-{i}",
                subscription_id=sub_id,
                customer_id=cust.id,
                billing_period_start=today - timedelta(days=60),
                billing_period_end=today - timedelta(days=30),
                issue_date=today - timedelta(days=30),
                due_date=today - timedelta(days=(i % 45)), # some overdue, some not
                subtotal=Decimal("100.00"),
                tax_amount=Decimal("10.00"),
                discount_amount=Decimal("0.00"),
                total_amount=Decimal("110.00"),
                status="confirmed"
            )
            invoices.append(inv)

        db.bulk_save_objects(invoices)
        db.flush()

        saved_invoices = db.query(Invoice.id).filter(Invoice.invoice_number.like("BENCH-INV-%")).all()

        print(f"Seeding {NUM_RECORDS // 2} partial payment records...")
        payments = []
        for idx, (inv_id,) in enumerate(saved_invoices[:NUM_RECORDS // 2]):
            pay = Payment(
                invoice_id=inv_id,
                payment_method="credit_card",
                amount=Decimal("50.00"),
                payment_date=today - timedelta(days=10)
            )
            payments.append(pay)

        db.bulk_save_objects(payments)
        db.flush()

        print(f"Dataset successfully created with {len(saved_subs)} subscriptions, {len(saved_invoices)} invoices, {len(payments)} payments.")

        class CurrentUserMock:
            role = "admin"
            id = 1

        mock_user = CurrentUserMock()

        # 1. Benchmark /reports/summary
        times_summary = []
        for _ in range(5):
            t0 = time.perf_counter()
            res_sum = report_summary(db=db, current_user=mock_user)
            t1 = time.perf_counter()
            times_summary.append(t1 - t0)

        avg_sum_ms = (sum(times_summary) / len(times_summary)) * 1000
        max_sum_ms = max(times_summary) * 1000

        print(f"\n[SCALE BENCHMARK RESULTS] /reports/summary ({NUM_RECORDS} invoices):")
        print(f"  Average Execution Time: {avg_sum_ms:.2f} ms")
        print(f"  Maximum Execution Time: {max_sum_ms:.2f} ms")
        print(f"  Active Subscriptions Count: {res_sum['active_subscriptions']}")
        print(f"  Outstanding Invoices: {res_sum['outstanding_invoice_count']} (${res_sum['outstanding_amount']})")
        print(f"  Overdue Invoices: {res_sum['overdue_invoice_count']} (${res_sum['overdue_amount']})")
        assert max_sum_ms < 2000, f"Summary exceeded 2-second SLA! ({max_sum_ms:.2f} ms)"

        # 2. Benchmark /reports/overdue-invoices
        times_overdue = []
        for _ in range(5):
            t0 = time.perf_counter()
            res_ov = overdue_invoices(skip=0, limit=50, db=db, current_user=mock_user)
            t1 = time.perf_counter()
            times_overdue.append(t1 - t0)

        avg_ov_ms = (sum(times_overdue) / len(times_overdue)) * 1000
        max_ov_ms = max(times_overdue) * 1000

        print(f"\n[SCALE BENCHMARK RESULTS] /reports/overdue-invoices ({NUM_RECORDS} invoices):")
        print(f"  Average Execution Time: {avg_ov_ms:.2f} ms")
        print(f"  Maximum Execution Time: {max_ov_ms:.2f} ms")
        print(f"  Total Overdue Counted: {res_ov['total_overdue_invoices']}")
        print(f"  Total Overdue Sum: ${res_ov['total_overdue_amount']}")
        print(f"  Page Size Returned: {len(res_ov['invoices'])}")
        assert max_ov_ms < 2000, f"Overdue report exceeded 2-second SLA! ({max_ov_ms:.2f} ms)"

        print(f"\nSUCCESS: Both reports executed in < {max(max_sum_ms, max_ov_ms):.2f} ms, well below the 2.0-second limit!")

    finally:
        db.rollback()
        db.close()
        print("Database cleanly rolled back (no benchmark data persisted).")


if __name__ == "__main__":
    run_scale_benchmark()
