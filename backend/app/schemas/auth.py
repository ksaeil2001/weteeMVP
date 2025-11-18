"""
Auth Schemas - F-001 회원가입 및 로그인
API_명세서.md 6.1 기반 요청/응답 스키마
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
import re


# User Role Type
UserRoleType = Literal["TEACHER", "STUDENT", "PARENT"]


class RegisterRequest(BaseModel):
    """
    회원가입 요청 스키마
    POST /api/v1/auth/register

    Related: F-001, API_명세서.md 6.1.1
    """

    email: EmailStr = Field(..., description="이메일 주소")
    password: str = Field(..., min_length=8, description="비밀번호 (8자 이상)")
    name: str = Field(..., min_length=1, max_length=100, description="이름")
    phone: Optional[str] = Field(None, description="전화번호 (선택)")
    role: UserRoleType = Field(..., description="사용자 역할")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        비밀번호 강도 검증
        F-001: 비밀번호 규칙 + 보안 강화

        요구사항:
        - 최소 8자 이상
        - 대문자 1개 이상
        - 소문자 또는 영문 포함
        - 숫자 1개 이상
        - 특수문자 1개 이상
        """
        if len(v) < 8:
            raise ValueError("비밀번호는 최소 8자 이상이어야 합니다")

        if not re.search(r"[A-Z]", v):
            raise ValueError("비밀번호는 대문자를 최소 1개 포함해야 합니다")

        if not re.search(r"[a-z]", v):
            raise ValueError("비밀번호는 소문자를 최소 1개 포함해야 합니다")

        if not re.search(r"\d", v):
            raise ValueError("비밀번호는 숫자를 최소 1개 포함해야 합니다")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("비밀번호는 특수문자(!@#$%^&*(),.?\":{}|<> 등)를 최소 1개 포함해야 합니다")

        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """
        전화번호 형식 검증 (선택 필드)
        """
        if v is None:
            return v

        # Remove hyphens and spaces
        cleaned = v.replace("-", "").replace(" ", "")

        # Korean phone number format: 010-XXXX-XXXX (10-11 digits)
        if not re.match(r"^01\d{8,9}$", cleaned):
            raise ValueError("올바른 전화번호 형식이 아닙니다 (예: 01012345678)")

        return v

    class Config:
        json_schema_extra = {
            "example": {
                "email": "teacher@example.com",
                "password": "SecurePass123!",
                "name": "김선생",
                "phone": "01012345678",
                "role": "TEACHER",
            }
        }


class LoginRequest(BaseModel):
    """
    로그인 요청 스키마
    POST /api/v1/auth/login

    Related: F-001, API_명세서.md 6.1.3
    """

    email: EmailStr = Field(..., description="이메일 주소")
    password: str = Field(..., description="비밀번호")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "teacher@example.com",
                "password": "SecurePass123!",
            }
        }


class UserResponse(BaseModel):
    """
    사용자 정보 응답 스키마
    공통 사용자 정보 포맷
    """

    user_id: str = Field(..., description="사용자 ID (UUID)")
    email: str = Field(..., description="이메일")
    name: str = Field(..., description="이름")
    role: str = Field(..., description="역할 (teacher/student/parent)")
    is_email_verified: bool = Field(..., description="이메일 인증 여부")
    created_at: Optional[datetime] = Field(None, description="가입일시")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "teacher@example.com",
                "name": "김선생",
                "role": "teacher",
                "is_email_verified": False,
                "created_at": "2025-11-16T10:00:00Z",
            }
        }


class TokenResponse(BaseModel):
    """
    토큰 응답 스키마
    """

    access_token: str = Field(..., description="액세스 토큰 (15분)")
    refresh_token: str = Field(..., description="리프레시 토큰 (7일)")
    token_type: str = Field(default="bearer", description="토큰 타입")


class LoginResponse(BaseModel):
    """
    로그인 응답 스키마
    POST /api/v1/auth/login 응답

    Related: API_명세서.md 6.1.3
    """

    access_token: str = Field(..., description="액세스 토큰")
    refresh_token: str = Field(..., description="리프레시 토큰")
    token_type: str = Field(default="bearer", description="토큰 타입")
    user: UserResponse = Field(..., description="사용자 정보")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGc...",
                "refresh_token": "eyJhbGc...",
                "token_type": "bearer",
                "user": {
                    "user_id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "teacher@example.com",
                    "name": "김선생",
                    "role": "teacher",
                    "is_email_verified": False,
                },
            }
        }


class RefreshRequest(BaseModel):
    """
    토큰 갱신 요청 스키마
    POST /api/v1/auth/refresh
    """

    refresh_token: str = Field(..., description="리프레시 토큰")


class RefreshResponse(BaseModel):
    """
    토큰 갱신 응답 스키마
    """

    access_token: str = Field(..., description="새 액세스 토큰")
    refresh_token: str = Field(..., description="새 리프레시 토큰")
    token_type: str = Field(default="bearer", description="토큰 타입")
