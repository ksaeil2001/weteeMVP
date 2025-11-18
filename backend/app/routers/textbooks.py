"""
Textbooks Router - F-005 교재 관리
API_명세서.md 6.5 F-005 기반 교재 관련 엔드포인트 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.textbook import (
    CreateTextbookPayload,
    UpdateTextbookPayload,
    TextbookOut,
    TextbookListResponse,
)
from app.schemas.lesson import ProgressHistoryResponse
from app.services.textbook_service import TextbookService

router = APIRouter(prefix="/textbooks", tags=["textbooks"])


# ==========================
# 교재 등록
# ==========================

@router.post("/groups/{group_id}", response_model=TextbookOut, status_code=status.HTTP_201_CREATED)
def create_textbook(
    group_id: str = Path(..., description="그룹 ID"),
    payload: CreateTextbookPayload = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    교재 등록

    POST /api/v1/textbooks/groups/{group_id}

    **기능**:
    - 그룹에 새 교재 추가
    - 선생님만 가능
    - 교재명 중복 허용 (예: "수학의 정석 상권", "수학의 정석 하권")

    **Request Body**:
    - title: 교재명 (필수, 1-200자)
    - publisher: 출판사 (선택)
    - total_pages: 전체 페이지 수 (선택, 진도율 계산용)
    - start_page: 시작 페이지 (기본 1, 중간부터 시작하는 경우)

    **Response**:
    - TextbookOut: 생성된 교재

    Related: F-005, API_명세서.md 6.5.2
    """
    try:
        result = TextbookService.create_textbook(
            db=db,
            user=current_user,
            group_id=group_id,
            payload=payload
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error creating textbook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "TEXTBOOK001",
                "message": "교재 등록 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 교재 목록 조회
# ==========================

@router.get("/groups/{group_id}", response_model=TextbookListResponse)
def get_textbooks(
    group_id: str = Path(..., description="그룹 ID"),
    include_inactive: bool = Query(False, description="비활성 교재 포함 여부"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹의 교재 목록 조회

    GET /api/v1/textbooks/groups/{group_id}

    **기능**:
    - 특정 그룹의 교재 목록 조회
    - 그룹 멤버만 조회 가능
    - 현재 진도, 진도율 포함

    **Query Parameters**:
    - include_inactive: 비활성(숨김) 교재 포함 여부 (기본: false)

    **Response**:
    - TextbookListResponse: 교재 목록

    Related: F-005
    """
    try:
        textbooks = TextbookService.get_textbooks(
            db=db,
            user=current_user,
            group_id=group_id,
            include_inactive=include_inactive
        )
        return TextbookListResponse(items=textbooks)

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error getting textbooks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "TEXTBOOK002",
                "message": "교재 목록 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 교재 수정
# ==========================

@router.patch("/{textbook_id}", response_model=TextbookOut)
def update_textbook(
    textbook_id: str = Path(..., description="교재 ID"),
    payload: UpdateTextbookPayload = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    교재 수정

    PATCH /api/v1/textbooks/{textbook_id}

    **기능**:
    - 교재 정보 수정
    - 선생님만 가능
    - is_active를 false로 설정하여 숨기기 가능

    **Request Body**:
    - title: 교재명 (선택)
    - publisher: 출판사 (선택)
    - total_pages: 전체 페이지 수 (선택)
    - is_active: 활성 상태 (선택, false로 설정 시 숨김)

    **Response**:
    - TextbookOut: 수정된 교재

    Related: F-005
    """
    try:
        result = TextbookService.update_textbook(
            db=db,
            user=current_user,
            textbook_id=textbook_id,
            payload=payload
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error updating textbook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "TEXTBOOK003",
                "message": "교재 수정 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 교재 삭제
# ==========================

@router.delete("/{textbook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_textbook(
    textbook_id: str = Path(..., description="교재 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    교재 삭제

    DELETE /api/v1/textbooks/{textbook_id}

    **기능**:
    - 교재 삭제
    - 선생님만 가능
    - 진도 기록이 있는 교재는 삭제 불가 (숨기기 사용)

    **Response**:
    - 204 No Content

    **Error**:
    - 409 Conflict: 진도 기록이 있는 경우 (HAS_PROGRESS_RECORDS)

    Related: F-005
    """
    try:
        TextbookService.delete_textbook(
            db=db,
            user=current_user,
            textbook_id=textbook_id
        )
        return None

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error deleting textbook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "TEXTBOOK004",
                "message": "교재 삭제 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 교재별 진도 요약 및 히스토리 조회
# ==========================

@router.get("/groups/{group_id}/progress/{textbook_id}", response_model=ProgressHistoryResponse)
def get_progress_summary(
    group_id: str = Path(..., description="그룹 ID"),
    textbook_id: str = Path(..., description="교재 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    교재별 진도 요약 및 히스토리 조회

    GET /api/v1/textbooks/groups/{group_id}/progress/{textbook_id}

    **기능**:
    - 특정 교재의 진도 요약 및 히스토리 조회
    - 그룹 멤버만 조회 가능
    - 진도율, 평균 진도, 차트 데이터 포함

    **Response**:
    - ProgressHistoryResponse: 진도 요약 및 히스토리

    Related: F-005, API_명세서.md 6.5.3
    """
    try:
        result = TextbookService.get_progress_summary(
            db=db,
            user=current_user,
            group_id=group_id,
            textbook_id=textbook_id
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error getting progress summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "TEXTBOOK005",
                "message": "진도 조회 중 오류가 발생했습니다.",
            },
        )
