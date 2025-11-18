"""
Application configuration management
환경 변수 및 설정 관리
"""

from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator
import sys


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """

    # Database
    DATABASE_URL: str = "sqlite:///./wetee.db"

    # JWT - REQUIRED in production
    # 운영 환경에서는 반드시 환경변수로 설정해야 함
    JWT_SECRET_KEY: str
    JWT_REFRESH_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Application
    PROJECT_NAME: str = "WeTee"
    API_VERSION: str = "v1"
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """CORS_ORIGINS를 문자열에서 리스트로 변환"""
        if isinstance(v, str):
            # 콤마로 구분된 문자열을 리스트로 변환
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Security
    BCRYPT_ROUNDS: int = 12

    # Payment Gateway (Toss Payments) - F-006
    TOSS_PAYMENTS_SECRET_KEY: str = ""  # 환경변수에서 로드 (개발: 빈 문자열, 운영: 실제 시크릿 키)
    TOSS_PAYMENTS_CLIENT_KEY: str = ""  # 개발용 클라이언트 키

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
try:
    settings = Settings()
except Exception as e:
    print("❌ Configuration Error:")
    print(f"   {str(e)}")
    print("\n💡 해결 방법:")
    print("   1. .env 파일을 생성하세요 (backend/.env)")
    print("   2. .env.example 파일을 참고하여 필수 환경변수를 설정하세요")
    print("   3. 특히 다음 항목들이 필수입니다:")
    print("      - JWT_SECRET_KEY")
    print("      - JWT_REFRESH_SECRET_KEY")
    print("\n   안전한 키 생성:")
    print("   python -c \"import secrets; print(secrets.token_hex(32))\"")
    sys.exit(1)

# Validate JWT secrets in production
if not settings.DEBUG:
    # 운영 환경에서는 개발용 기본값 사용 불가
    dev_keys = [
        "dev-secret-key-change-in-production",
        "dev-refresh-secret-key-change-in-production",
        "your-secret-key-change-this-in-production",
        "your-refresh-secret-key-change-this-in-production",
    ]

    if settings.JWT_SECRET_KEY in dev_keys or settings.JWT_REFRESH_SECRET_KEY in dev_keys:
        print("❌ Security Error: 운영 환경에서 개발용 JWT 키를 사용할 수 없습니다!")
        print("   안전한 키를 생성하여 환경변수로 설정하세요.")
        sys.exit(1)

    # 최소 길이 검증
    if len(settings.JWT_SECRET_KEY) < 32 or len(settings.JWT_REFRESH_SECRET_KEY) < 32:
        print("❌ Security Error: JWT Secret Key는 최소 32자 이상이어야 합니다!")
        sys.exit(1)
