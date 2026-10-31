from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import Subscription, Plan

router = APIRouter(
    prefix="/subscriptions",
    tags=["Subscription Lifecycle"]
)


@router.patch("/{subscription_id}/status")
def update_subscription_status(
    subscription_id: int,
    new_status: str,
    db: Session = Depends(get_db),
):
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()

    if not subscription:
        raise HTTPException(404, "Subscription not found")

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
):
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()

    if not subscription:
        raise HTTPException(404, "Subscription not found")

    plan = db.query(Plan).filter(
        Plan.id == subscription.plan_id
    ).first()

    if not plan.allow_pause:
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
):
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()

    if not subscription:
        raise HTTPException(404, "Subscription not found")

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
):
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()

    if not subscription:
        raise HTTPException(404, "Subscription not found")

    plan = db.query(Plan).filter(
        Plan.id == subscription.plan_id
    ).first()

    if subscription.status not in ["confirmed", "active"]:
        raise HTTPException(400, "Subscription cannot be closed")

    if early and not plan.allow_early_close:
        raise HTTPException(400, "Early closure is not allowed for this plan")

    subscription.status = "closed"
    subscription.is_paused = False
    db.commit()

    return {"message": "Subscription closed successfully"}