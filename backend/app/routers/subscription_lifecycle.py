
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import Subscription, Plan
from app.routers.auth import require_roles

router = APIRouter(
    prefix="/subscriptions",
    tags=["Subscription Lifecycle"]
)


def get_subscription_or_404(subscription_id: int, db: Session):
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()

    if not subscription:
        raise HTTPException(404, "Subscription not found")

    return subscription


def process_auto_close_expired_subscriptions(db: Session, target_date: date | None = None) -> dict:
    today = target_date or date.today()

    eligible_subs = (
        db.query(Subscription)
        .join(Plan, Subscription.plan_id == Plan.id)
        .filter(
            Subscription.status.in_(["active", "confirmed"]),
            Subscription.expiry_date.isnot(None),
            Subscription.expiry_date < today,
            Plan.allow_auto_close.is_(True)
        )
        .all()
    )

    closed_subscriptions = []
    for sub in eligible_subs:
        sub.status = "closed"
        sub.is_paused = False
        closed_subscriptions.append({
            "id": sub.id,
            "subscription_number": sub.subscription_number,
            "expiry_date": str(sub.expiry_date)
        })

    db.commit()

    return {
        "message": "Auto-closure of expired subscriptions completed",
        "target_date": str(today),
        "total_closed": len(closed_subscriptions),
        "closed_subscriptions": closed_subscriptions
    }


@router.post("/auto-close-expired")
def auto_close_expired(
    target_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    return process_auto_close_expired_subscriptions(db=db, target_date=target_date)



@router.patch("/{subscription_id}/status")
def update_subscription_status(
    subscription_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff")),
):
    subscription = get_subscription_or_404(subscription_id, db)

    transitions = {
        "draft": ["quotation"],
        "quotation": ["confirmed", "draft"],
        "confirmed": ["active"],
        "active": ["closed"],
        "closed": [],
    }

    if new_status not in transitions.get(subscription.status, []):
        raise HTTPException(
            400,
            f"Cannot change status from {subscription.status} to {new_status}"
        )

    subscription.status = new_status
    db.commit()

    return {
        "message": "Subscription status updated",
        "subscription_id": subscription.id,
        "status": subscription.status,
    }


@router.patch("/{subscription_id}/pause")
def pause_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff")),
):
    subscription = get_subscription_or_404(subscription_id, db)

    plan = db.query(Plan).filter(
        Plan.id == subscription.plan_id
    ).first()

    if not plan or not plan.allow_pause:
        raise HTTPException(400, "This plan does not allow pausing")

    if subscription.status != "active":
        raise HTTPException(400, "Only active subscriptions can be paused")

    if subscription.is_paused:
        raise HTTPException(400, "Subscription is already paused")

    subscription.is_paused = True
    db.commit()

    return {"message": "Subscription paused successfully"}


@router.patch("/{subscription_id}/resume")
def resume_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff")),
):
    subscription = get_subscription_or_404(subscription_id, db)

    if not subscription.is_paused:
        raise HTTPException(400, "Subscription is not paused")

    subscription.is_paused = False
    db.commit()

    return {"message": "Subscription resumed successfully"}


@router.patch("/{subscription_id}/close")
def close_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    early: bool = False,
    current_user=Depends(require_roles("admin", "staff")),
):
    subscription = get_subscription_or_404(subscription_id, db)

    plan = db.query(Plan).filter(
        Plan.id == subscription.plan_id
    ).first()

    if subscription.status not in ["confirmed", "active"]:
        raise HTTPException(400, "Subscription cannot be closed")

    if early and (not plan or not plan.allow_early_close):
        raise HTTPException(400, "Early closure is not allowed for this plan")

    subscription.status = "closed"
    subscription.is_paused = False
    db.commit()

    return {"message": "Subscription closed successfully"}
