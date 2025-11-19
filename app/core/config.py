from functools import lru_cache
from typing import List

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = Field("local", validation_alias="METRICON_ENV")

    database_url: PostgresDsn | str = Field(..., validation_alias="DATABASE_URL")
    redis_url: str = Field("redis://localhost:6379/0", validation_alias="REDIS_URL")
    minio_endpoint: str = Field("localhost:9000", validation_alias="MINIO_ENDPOINT")
    minio_access_key: str = Field("minio", validation_alias="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field("minio123", validation_alias="MINIO_SECRET_KEY")
    minio_secure: bool = Field(False, validation_alias="MINIO_SECURE")

    jwt_secret_key: str = Field("super-secret", validation_alias="JWT_SECRET")
    jwt_algorithm: str = Field("HS256")
    jwt_expire_minutes: int = Field(60 * 4)

    airflow_api: str = Field("http://localhost:8080/api/v1", validation_alias="AIRFLOW_API")
    airflow_token: str = Field("", validation_alias="AIRFLOW_TOKEN")

    prometheus_namespace: str = Field("metricone", validation_alias="PROM_NAMESPACE")
    cors_allow_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"], validation_alias="CORS_ALLOW_ORIGINS")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
