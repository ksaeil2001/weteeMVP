"""
Textbook Schemas - F-005 수업 기록 및 진도 관리
API_명세서.md 6.5 F-005 기반 요청/응답 스키마
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ==========================
# Textbook Schemas
# ==========================


class TextbookBase(BaseModel):
    """
    교재 기본 스키마 (공통 필드)
    """
    title: str = Field(..., min_length=1, max_length=200, description="교재명")
    publisher: Optional[str] = Field(None, max_length=100, description="출판사")
    total_pages: Optional[int] = Field(None, ge=1, description="전체 페이지 수")
    start_page: int = Field(1, ge=1, description="시작 페이지 (교재 중간부터 시작하는 경우)")


class CreateTextbookPayload(TextbookBase):
    """
    교재 등록 요청 스키마

    POST /api/v1/groups/{group_id}/textbooks
    """
    pass

    class Config:
        json_schema_extra = {
            "example": {
                "title": "수학의 정석 (상)",
                "publisher": "홍성대",
                "total_pages": 500,
                "start_page": 1,
            }
        }


class UpdateTextbookPayload(BaseModel):
    """
    교재 수정 요청 스키마

    PATCH /api/v1/textbooks/{textbook_id}
    """
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="교재명")
    publisher: Optional[str] = Field(None, max_length=100, description="출판사")
    total_pages: Optional[int] = Field(None, ge=1, description="전체 페이지 수")
    is_active: Optional[bool] = Field(None, description="활성 상태 (숨기기 용도)")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "수학의 정석 (상) - 개정판",
                "total_pages": 520,
            }
        }


class TextbookOut(BaseModel):
    """
    교재 응답 스키마
    """
    textbook_id: str
    group_id: str
    title: str
    publisher: Optional[str] = None
    total_pages: Optional[int] = None
    start_page: int
    is_active: bool

    # 진도 정보 (계산된 값, 별도 API에서 제공)
    current_page: Optional[int] = None  # 현재 진도 (마지막 end_page)
    progress_percentage: Optional[float] = None  # 진도율 (%)

    created_at: str
    updated_at: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "textbook_id": "textbook-123",
                "group_id": "group-456",
                "title": "수학의 정석 (상)",
                "publisher": "홍성대",
                "total_pages": 500,
                "start_page": 1,
                "is_active": True,
                "current_page": 67,
                "progress_percentage": 13.4,
                "created_at": "2025-11-18T10:00:00Z",
                "updated_at": "2025-11-18T10:00:00Z",
            }
        }


# ==========================
# List Response
# ==========================


class TextbookListResponse(BaseModel):
    """
    교재 목록 응답

    GET /api/v1/groups/{group_id}/textbooks
    """
    items: list[TextbookOut]

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "textbook_id": "textbook-123",
                        "group_id": "group-456",
                        "title": "수학의 정석 (상)",
                        "publisher": "홍성대",
                        "total_pages": 500,
                        "start_page": 1,
                        "is_active": True,
                        "current_page": 67,
                        "progress_percentage": 13.4,
                        "created_at": "2025-11-18T10:00:00Z",
                    }
                ],
            }
        }
