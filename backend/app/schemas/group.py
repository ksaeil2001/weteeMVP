"""
Group Schemas - F-002 과외 그룹 생성 및 매칭
API_명세서.md 6.2 기반 요청/응답 스키마
프론트엔드 타입 정의(frontend/src/types/groups.ts)와 일치
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# Group Status Types (프론트엔드와 동일)
GroupStatusEnum = Literal["ACTIVE", "INACTIVE", "ARCHIVED"]

# Group Member Role Types
GroupMemberRoleEnum = Literal["TEACHER", "STUDENT", "PARENT"]

# Group Member Invite Status Types
GroupMemberInviteStatusEnum = Literal["PENDING", "ACCEPTED", "REJECTED"]


# ==========================
# Group Schemas
# ==========================


class GroupBase(BaseModel):
    """
    그룹 기본 스키마 (공통 필드)
    """
    name: str = Field(..., min_length=1, max_length=100, description="그룹 이름")
    subject: str = Field(..., min_length=1, max_length=50, description="과목")
    description: Optional[str] = Field(None, description="그룹 설명")


class GroupCreate(GroupBase):
    """
    그룹 생성 요청 스키마

    POST /api/v1/groups
    """
    pass

    class Config:
        json_schema_extra = {
            "example": {
                "name": "중3 수학 반A",
                "subject": "수학",
                "description": "중학교 3학년 수학 과외 그룹입니다.",
            }
        }


class GroupUpdate(BaseModel):
    """
    그룹 수정 요청 스키마

    PATCH /api/v1/groups/{group_id}
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="그룹 이름")
    subject: Optional[str] = Field(None, min_length=1, max_length=50, description="과목")
    description: Optional[str] = Field(None, description="그룹 설명")
    status: Optional[GroupStatusEnum] = Field(None, description="그룹 상태")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "중3 수학 심화반",
                "description": "중학교 3학년 수학 심화 과정",
            }
        }


class GroupMemberOut(BaseModel):
    """
    그룹 멤버 응답 스키마
    """
    member_id: str
    user_id: str
    role: GroupMemberRoleEnum
    invite_status: GroupMemberInviteStatusEnum
    joined_at: str  # ISO 8601 format

    # TODO(v2): 사용자 상세 정보 추가 (name, profile_image_url 등)
    # user_name: Optional[str] = None
    # user_email: Optional[str] = None
    # user_profile_image: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "member_id": "member-123",
                "user_id": "user-456",
                "role": "STUDENT",
                "invite_status": "ACCEPTED",
                "joined_at": "2025-11-17T10:00:00Z",
            }
        }


class GroupOut(BaseModel):
    """
    그룹 응답 스키마
    프론트엔드의 Group 타입과 일치
    """
    group_id: str
    name: str
    subject: str
    description: Optional[str] = None
    owner_id: str
    status: GroupStatusEnum
    created_at: str  # ISO 8601 format
    updated_at: str  # ISO 8601 format

    # Optional: 멤버 목록 (상세 조회 시)
    members: Optional[list[GroupMemberOut]] = None

    # Optional: 멤버 수 (목록 조회 시)
    member_count: Optional[int] = None

    class Config:
        json_schema_extra = {
            "example": {
                "group_id": "group-123",
                "name": "중3 수학 반A",
                "subject": "수학",
                "description": "중학교 3학년 수학 과외 그룹입니다.",
                "owner_id": "user-456",
                "status": "ACTIVE",
                "created_at": "2025-11-01T10:00:00Z",
                "updated_at": "2025-11-15T14:00:00Z",
                "member_count": 5,
            }
        }


# ==========================
# Pagination Schemas
# ==========================


class PaginationInfo(BaseModel):
    """
    페이지네이션 정보
    """
    total: int
    page: int
    size: int
    total_pages: int
    has_next: bool = False
    has_prev: bool = False


class GroupListResponse(BaseModel):
    """
    그룹 목록 응답 (페이지네이션 포함)
    프론트엔드의 GroupListResponse 타입과 일치

    GET /api/v1/groups
    """
    items: list[GroupOut]
    pagination: PaginationInfo

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "group_id": "group-123",
                        "name": "중3 수학 반A",
                        "subject": "수학",
                        "description": "중학교 3학년 수학 과외 그룹입니다.",
                        "owner_id": "user-456",
                        "status": "ACTIVE",
                        "created_at": "2025-11-01T10:00:00Z",
                        "updated_at": "2025-11-15T14:00:00Z",
                        "member_count": 5,
                    }
                ],
                "pagination": {
                    "total": 10,
                    "page": 1,
                    "size": 20,
                    "total_pages": 1,
                    "has_next": False,
                    "has_prev": False,
                },
            }
        }


# ==========================
# Member Management Schemas (TODO: Phase 2)
# ==========================


class GroupMemberCreate(BaseModel):
    """
    그룹 멤버 추가 요청 스키마 (TODO: Phase 2)

    POST /api/v1/groups/{group_id}/members
    """
    user_id: str
    role: GroupMemberRoleEnum

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user-789",
                "role": "STUDENT",
            }
        }


class InviteCodeCreate(BaseModel):
    """
    초대 코드 생성 요청 스키마

    POST /api/v1/groups/{group_id}/invite-codes
    """
    target_role: GroupMemberRoleEnum = Field(..., description="초대할 역할 (STUDENT/PARENT)")
    expires_in_days: Optional[int] = Field(7, ge=1, le=30, description="유효 기간 (일)")
    max_uses: Optional[int] = Field(1, ge=1, le=100, description="최대 사용 횟수")

    class Config:
        json_schema_extra = {
            "example": {
                "target_role": "STUDENT",
                "expires_in_days": 7,
                "max_uses": 1,
            }
        }


class InviteCodeOut(BaseModel):
    """
    초대 코드 응답 스키마
    프론트엔드 InviteCode 타입과 일치
    """
    invite_code_id: str
    code: str
    group_id: str
    target_role: GroupMemberRoleEnum  # role → target_role (모델과 일치)
    created_by: str
    expires_at: str
    max_uses: int
    used_count: int  # current_uses → used_count (모델과 일치)
    is_active: bool
    created_at: str  # 생성 시각 추가

    class Config:
        json_schema_extra = {
            "example": {
                "invite_code_id": "invite-123",
                "code": "ABC123",
                "group_id": "group-456",
                "target_role": "STUDENT",
                "created_by": "user-789",
                "expires_at": "2025-11-24T10:00:00Z",
                "max_uses": 1,
                "used_count": 0,
                "is_active": True,
                "created_at": "2025-11-17T10:00:00Z",
            }
        }


class JoinGroupRequest(BaseModel):
    """
    초대 코드로 그룹 가입 요청 스키마

    POST /api/v1/groups/join
    """
    code: str = Field(..., min_length=6, max_length=6, description="6자리 초대 코드")

    class Config:
        json_schema_extra = {
            "example": {
                "code": "ABC123",
            }
        }


class JoinGroupResponse(BaseModel):
    """
    초대 코드로 그룹 가입 응답 스키마
    """
    group: GroupOut
    member: GroupMemberOut
    message: str = "그룹에 성공적으로 참여했습니다"

    class Config:
        json_schema_extra = {
            "example": {
                "group": {
                    "group_id": "group-123",
                    "name": "중3 수학 반A",
                    "subject": "수학",
                    "description": "중학교 3학년 수학 과외 그룹입니다.",
                    "owner_id": "user-456",
                    "status": "ACTIVE",
                    "created_at": "2025-11-01T10:00:00Z",
                    "updated_at": "2025-11-15T14:00:00Z",
                },
                "member": {
                    "member_id": "member-789",
                    "user_id": "user-123",
                    "role": "STUDENT",
                    "invite_status": "ACCEPTED",
                    "joined_at": "2025-11-18T10:00:00Z",
                },
                "message": "그룹에 성공적으로 참여했습니다",
            }
        }
