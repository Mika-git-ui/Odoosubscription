
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.catalog import router as catalog_router
from app.routers.subscriptions import router as subscription_router
from app.routers.subscription_lifecycle import router as lifecycle_router
from app.routers.billing import router as billing_router

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