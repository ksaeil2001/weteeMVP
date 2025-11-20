"""
Email Verification Code Model - F-001 이메일 인증
이메일 인증 코드를 저장하는 테이블
"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from datetime import datetime, timedelta
import secrets

from app.database import Base


class EmailVerificationCode(Base):
    """
    Email verification codes table

    - 6자리 인증 코드 저장
    - 유효기간: 10분
    - 재발송 제한: 1분

    Related: F-001 6.1.2
    """

    __tablename__ = "email_verification_codes"

    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    # Status
    is_used = Column(Boolean, default=False, nullable=False)

    @staticmethod
    def generate_code() -> str:
        """Generate a random 6-digit code"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

    @staticmethod
    def create_expiry() -> datetime:
        """Create expiry time (10 minutes from now)"""
        return datetime.utcnow() + timedelta(minutes=10)

    def is_expired(self) -> bool:
        """Check if the code has expired"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self, code: str) -> bool:
        """Check if the provided code is valid"""
        return (
            self.code == code and
            not self.is_used and
            not self.is_expired()
        )

    def can_resend(self) -> bool:
        """Check if a new code can be sent (1 minute interval)"""
        time_since_creation = datetime.utcnow() - self.created_at
        return time_since_creation >= timedelta(minutes=1)
