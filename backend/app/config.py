"""
Application configuration management
환경 변수 및 설정 관리
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """

    # Database
    DATABASE_URL: str = "sqlite:///./wetee.db"

    # JWT
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_REFRESH_SECRET_KEY: str = "dev-refresh-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Application
    PROJECT_NAME: str = "WeTee"
    API_VERSION: str = "v1"
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Security
    BCRYPT_ROUNDS: int = 12

    # Payment Gateway (Toss Payments) - F-006
    TOSS_PAYMENTS_SECRET_KEY: str = ""  # 환경변수에서 로드 (개발: 빈 문자열, 운영: 실제 시크릿 키)
    TOSS_PAYMENTS_CLIENT_KEY: str = ""  # 개발용 클라이언트 키

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
