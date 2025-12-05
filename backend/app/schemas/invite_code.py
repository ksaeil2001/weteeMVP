"""
Invite Code Schemas - F-002 초대 코드 시스템
API_명세서.md 기반 초대 코드 검증 요청/응답 스키마
"""

from pydantic import BaseModel, Field
from typing import Literal


class InviteCodeVerifyRequest(BaseModel):
    """
    초대 코드 검증 요청 스키마 (비인증 엔드포인트)

    POST /api/v1/auth/verify-invite-code

    회원가입 전 초대 코드의 유효성을 확인하는 데 사용
    """
    code: str = Field(..., min_length=6, max_length=6, description="6자리 초대 코드")
    role_type: Literal["STUDENT", "PARENT"] = Field(..., description="가입하려는 역할")

    class Config:
        json_schema_extra = {
            "example": {
                "code": "AB12CD",
                "role_type": "STUDENT",
            }
        }


class InviteCodeVerifyResponse(BaseModel):
    """
    초대 코드 검증 응답 스키마

    유효한 초대 코드일 경우 그룹 및 선생님 정보를 반환
    """
    valid: bool = Field(..., description="코드 유효 여부")
    group_id: str = Field(..., description="그룹 ID")
    group_name: str = Field(..., description="그룹 이름")
    teacher_name: str = Field(..., description="선생님 이름")
    subject: str = Field(..., description="과목")
    expires_at: str = Field(..., description="만료 시각 (ISO 8601)")

    class Config:
        json_schema_extra = {
            "example": {
                "valid": True,
                "group_id": "group-123",
                "group_name": "중3 수학반",
                "teacher_name": "김선생",
                "subject": "수학",
                "expires_at": "2025-01-08T00:00:00Z",
            }
        }
