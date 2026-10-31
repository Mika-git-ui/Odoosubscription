
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.catalog import router as catalog_router
from app.routers.subscriptions import router as subscription_router
from app.routers.subscription_lifecycle import router as lifecycle_router
from app.routers.billing import router as billing_router
from app.routers.auth import router as auth_router
from app.routers.discounts import router as discounts_router
from app.routers.quotations import router as quotations_router
from app.routers import reports

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(catalog_router)
app.include_router(subscription_router)
app.include_router(lifecycle_router)
app.include_router(billing_router)
app.include_router(auth_router)
app.include_router(discounts_router)
app.include_router(quotations_router)
app.include_router(reports.router)

