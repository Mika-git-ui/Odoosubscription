import logging
from sqlalchemy import text, inspect
from app.database import engine

logger = logging.getLogger(__name__)


def run_migrations():
    with engine.begin() as conn:
        inspector = inspect(conn)
        tables = inspector.get_table_names()

        # 1. Update discounts table
        if "discounts" in tables:
            discount_cols = [c["name"] for c in inspector.get_columns("discounts")]
            if "applicable_to" not in discount_cols:
                conn.execute(text("ALTER TABLE discounts ADD COLUMN applicable_to VARCHAR(20) NOT NULL DEFAULT 'subscription'"))
                logger.info("Added applicable_to to discounts")
            if "product_id" not in discount_cols:
                conn.execute(text("ALTER TABLE discounts ADD COLUMN product_id INT NULL"))
                conn.execute(text("ALTER TABLE discounts ADD CONSTRAINT fk_discounts_product FOREIGN KEY (product_id) REFERENCES products(id)"))
                logger.info("Added product_id to discounts")

        # 2. Quotation templates
        if "quotation_templates" not in tables:
            conn.execute(text("""
                CREATE TABLE quotation_templates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(150) NOT NULL,
                    description TEXT NULL,
                    plan_id INT NOT NULL,
                    validity_days INT NOT NULL DEFAULT 30,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    CONSTRAINT fk_quotation_templates_plan FOREIGN KEY (plan_id) REFERENCES plans(id),
                    INDEX ix_quotation_templates_id (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """))
            logger.info("Created quotation_templates table")

        if "quotation_template_lines" not in tables:
            conn.execute(text("""
                CREATE TABLE quotation_template_lines (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    template_id INT NOT NULL,
                    product_id INT NOT NULL,
                    variant_id INT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    unit_price DECIMAL(12, 2) NOT NULL,
                    line_total DECIMAL(12, 2) NOT NULL,
                    CONSTRAINT fk_qtl_template FOREIGN KEY (template_id) REFERENCES quotation_templates(id) ON DELETE CASCADE,
                    CONSTRAINT fk_qtl_product FOREIGN KEY (product_id) REFERENCES products(id),
                    CONSTRAINT fk_qtl_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id),
                    INDEX ix_quotation_template_lines_id (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """))
            logger.info("Created quotation_template_lines table")

        # 3. Password reset tokens
        if "password_reset_tokens" not in tables:
            conn.execute(text("""
                CREATE TABLE password_reset_tokens (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    token_hash VARCHAR(255) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    is_used BOOLEAN NOT NULL DEFAULT FALSE,
                    used_at DATETIME NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id),
                    INDEX ix_prt_token_hash (token_hash),
                    INDEX ix_password_reset_tokens_id (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """))
            logger.info("Created password_reset_tokens table")

        # 4. Indexes for reports
        # Refresh inspector for indexes
        curr_indexes_invoices = [idx["name"] for idx in inspector.get_indexes("invoices")]
        if "ix_invoices_status_due_date" not in curr_indexes_invoices:
            conn.execute(text("CREATE INDEX ix_invoices_status_due_date ON invoices(status, due_date)"))
            logger.info("Created index ix_invoices_status_due_date")

        if "ix_invoices_status_issue_date" not in curr_indexes_invoices:
            conn.execute(text("CREATE INDEX ix_invoices_status_issue_date ON invoices(status, issue_date)"))
            logger.info("Created index ix_invoices_status_issue_date")

        curr_indexes_payments = [idx["name"] for idx in inspector.get_indexes("payments")]
        if "ix_payments_payment_date" not in curr_indexes_payments:
            conn.execute(text("CREATE INDEX ix_payments_payment_date ON payments(payment_date)"))
            logger.info("Created index ix_payments_payment_date")

    print("Safe migrations executed successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migrations()
