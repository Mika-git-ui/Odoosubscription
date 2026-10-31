import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Brightloop Subscription Management"
    DATABASE_URL: str

    # JWT authentication settings
    SECRET_KEY: str = "brightloop-local-development-only-change-before-deployment"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            ".env"
        ),
        extra="ignore",
        env_file_encoding="utf-8"
    )


settings = Settings()