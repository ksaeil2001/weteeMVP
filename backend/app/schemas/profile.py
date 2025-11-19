"""
Profile Schemas - F-007 기본 프로필 및 설정
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict
from datetime import datetime


# ===== Profile Schemas =====

class UserProfileOut(BaseModel):
    """
    사용자 프로필 조회 응답
    GET /api/v1/users/me
    """
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    profile_image_url: Optional[str] = None
    language: str = "ko"
    timezone: str = "Asia/Seoul"
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """
    프로필 수정 요청
    PATCH /api/v1/users/me
    """
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    # 하이픈 있는 형식(010-XXXX-XXXX) 또는 없는 형식(010XXXXXXXX) 둘 다 허용
    # 서비스 레이어에서 자동으로 하이픈 추가
    phone: Optional[str] = Field(None, pattern=r"^(\d{10,11}|\d{3}-\d{3,4}-\d{4})$")

    @field_validator("name")
    def validate_name(cls, v):
        if v is not None and len(v.strip()) == 0:
            raise ValueError("이름은 최소 1자 이상이어야 합니다")
        return v


class ProfileImageUploadResponse(BaseModel):
    """
    프로필 사진 업로드 응답
    POST /api/v1/users/me/profile-image
    """
    profile_image_url: str
    uploaded_at: datetime


# ===== Notification Settings Schemas =====

class NotificationSettingsOut(BaseModel):
    """
    알림 설정 조회 응답
    GET /api/v1/users/me/settings
    """
    push_enabled: bool
    email_enabled: bool
    notification_categories: Dict[str, bool] = Field(
        default={
            "schedule": True,
            "attendance": True,
            "payment": True,
            "group": True,
        }
    )
    night_mode_enabled: bool = False
    night_mode_start: Optional[str] = "22:00"
    night_mode_end: Optional[str] = "08:00"
    theme: str = "auto"
    default_screen: Optional[str] = "home"
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationSettingsUpdate(BaseModel):
    """
    알림 설정 변경 요청
    PATCH /api/v1/users/me/settings
    """
    push_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    notification_categories: Optional[Dict[str, bool]] = None
    night_mode_enabled: Optional[bool] = None
    night_mode_start: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    night_mode_end: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    theme: Optional[str] = Field(None, pattern=r"^(light|dark|auto)$")
    default_screen: Optional[str] = None

    @field_validator("notification_categories")
    def validate_payment_notification(cls, v):
        """
        정산 알림은 끌 수 없음 (F-007 비즈니스 규칙)
        """
        if v is not None and "payment" in v and v["payment"] is False:
            raise ValueError("정산 알림은 끌 수 없습니다")
        return v


# ===== Password Change Schemas =====

class PasswordChangeRequest(BaseModel):
    """
    비밀번호 변경 요청
    POST /api/v1/users/me/change-password
    """
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    def validate_password_strength(cls, v):
        """
        비밀번호 강도 검증 (F-001 규칙 참조)
        - 최소 8자
        - 대문자 포함
        - 숫자 포함
        - 특수문자 포함
        """
        if len(v) < 8:
            raise ValueError("비밀번호는 최소 8자 이상이어야 합니다")
        if not any(c.isupper() for c in v):
            raise ValueError("비밀번호는 대문자를 포함해야 합니다")
        if not any(c.isdigit() for c in v):
            raise ValueError("비밀번호는 숫자를 포함해야 합니다")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("비밀번호는 특수문자를 포함해야 합니다")
        return v


class PasswordChangeResponse(BaseModel):
    """
    비밀번호 변경 응답
    """
    message: str
    changed_at: datetime


# ===== Login History Schemas =====

class DeviceInfo(BaseModel):
    """
    기기 정보
    """
    device_type: Optional[str] = None  # "mobile", "tablet", "desktop"
    os: Optional[str] = None           # "iOS", "Android", "Windows"
    browser: Optional[str] = None      # "Chrome", "Safari", "Firefox"
    app_version: Optional[str] = None


class LoginHistoryOut(BaseModel):
    """
    로그인 기록 조회 응답
    GET /api/v1/users/me/login-history
    """
    login_id: str
    login_at: datetime
    ip_address: Optional[str] = None
    device_info: Optional[DeviceInfo] = None
    location: Optional[str] = None

    class Config:
        from_attributes = True


class LoginHistoryListResponse(BaseModel):
    """
    로그인 기록 목록 응답
    """
    items: list[LoginHistoryOut]
    total: int
    page: int
    size: int
    total_pages: int
