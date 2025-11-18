"""
Schedules Router - F-003 수업 일정 관리
API_명세서.md 6.3 F-003 기반 일정 관련 엔드포인트 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.schedule import (
    CreateRegularSchedulePayload,
    CreateSchedulePayload,
    UpdateSchedulePayload,
    ScheduleOut,
    ScheduleListResponse,
)
from app.services.schedule_service import ScheduleService

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.get("", response_model=ScheduleListResponse)
def get_schedules(
    group_id: Optional[str] = Query(None, description="그룹 ID 필터"),
    type: Optional[str] = Query(None, description="일정 타입 필터 (REGULAR/MAKEUP/EXAM/HOLIDAY/OTHER)"),
    status: Optional[str] = Query(None, description="일정 상태 필터 (SCHEDULED/DONE/CANCELED/RESCHEDULED)"),
    from_date: Optional[str] = Query(None, description="시작 날짜 (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="종료 날짜 (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기 (1-100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    일정 목록 조회 (페이지네이션)

    GET /api/v1/schedules

    **기능**:
    - 로그인한 사용자가 속한 그룹의 일정 목록 조회
    - 날짜 범위, 타입, 상태별 필터링 지원
    - 페이지네이션 지원
    - 시작 시간순 정렬 (start_at ASC)

    **Query Parameters**:
    - group_id: 특정 그룹 필터 (optional)
    - type: 일정 타입 필터 (optional)
    - status: 일정 상태 필터 (optional)
    - from_date: 시작 날짜 (YYYY-MM-DD, optional)
    - to_date: 종료 날짜 (YYYY-MM-DD, optional)
    - page: 페이지 번호 (기본: 1)
    - size: 페이지 크기 (기본: 20, 최대: 100)

    **Response**:
    - items: 일정 목록 (ScheduleOut[])
    - pagination: 페이지네이션 정보

    Related: F-003, API_명세서.md 6.3.1
    """
    try:
        result = ScheduleService.get_schedules(
            db=db,
            user=current_user,
            group_id=group_id,
            schedule_type=type,
            schedule_status=status,
            from_date=from_date,
            to_date=to_date,
            page=page,
            size=size,
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error fetching schedules: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "SCHEDULE001",
                "message": "일정 목록을 가져오는 중 오류가 발생했습니다.",
            },
        )


@router.post("/regular", response_model=List[ScheduleOut], status_code=status.HTTP_201_CREATED)
def create_regular_schedule(
    payload: CreateRegularSchedulePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    정규 수업 일정 등록 (반복 일정 자동 생성)

    POST /api/v1/schedules/regular

    **기능**:
    - 반복 규칙에 따라 정규 수업 일정 자동 생성
    - 선생님만 생성 가능
    - 최대 200개까지 한 번에 생성

    **Request Body**:
    - group_id: 그룹 ID (필수)
    - title: 일정 제목 (필수)
    - start_time: 수업 시작 시간 (HH:mm 형식, 필수)
    - duration: 수업 시간 (분 단위, 필수)
    - recurrence: 반복 규칙 (필수)
      - frequency: "daily" | "weekly" | "biweekly" | "monthly"
      - interval: 간격 (1=매주, 2=격주 등)
      - days_of_week: 요일 목록 (1=월, 7=일)
      - start_date: 시작 날짜 (YYYY-MM-DD)
      - end_type: "date" | "count" | "never"
      - end_date / end_count: 종료 조건
    - location: 수업 장소 (선택)
    - memo: 메모 (선택)

    **Response**:
    - List[ScheduleOut]: 생성된 일정 목록

    Related: F-003, API_명세서.md 6.3.2
    """
    try:
        schedules = ScheduleService.create_regular_schedule(
            db=db,
            user=current_user,
            payload=payload,
        )
        return schedules

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error creating regular schedule: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "SCHEDULE002",
                "message": "정규 수업 일정 생성 중 오류가 발생했습니다.",
            },
        )


@router.post("", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
    payload: CreateSchedulePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    단일 일정 생성 (보강, 기타)

    POST /api/v1/schedules

    **기능**:
    - 단일 일정 생성 (보강, 휴강, 기타 등)
    - 선생님만 생성 가능

    **Request Body**:
    - group_id: 그룹 ID (필수)
    - title: 일정 제목 (필수)
    - type: 일정 타입 (MAKEUP, EXAM, HOLIDAY, OTHER 등)
    - start_at: 시작 시각 (ISO8601 형식, 필수)
    - end_at: 종료 시각 (ISO8601 형식, 필수)
    - location: 수업 장소 (선택)
    - memo: 메모 (선택)
    - original_schedule_id: 원래 일정 ID (보강인 경우, 선택)

    **Response**:
    - ScheduleOut: 생성된 일정

    Related: F-003, API_명세서.md 6.3.3
    """
    try:
        schedule = ScheduleService.create_schedule(
            db=db,
            user=current_user,
            payload=payload,
        )
        return schedule

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error creating schedule: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "SCHEDULE003",
                "message": "일정 생성 중 오류가 발생했습니다.",
            },
        )


@router.get("/{schedule_id}", response_model=ScheduleOut)
def get_schedule_detail(
    schedule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    일정 상세 조회

    GET /api/v1/schedules/{schedule_id}

    **기능**:
    - 특정 일정의 상세 정보 조회
    - 그룹 멤버만 조회 가능

    **Path Parameters**:
    - schedule_id: 일정 ID

    **Response**:
    - ScheduleOut: 일정 상세 정보

    Related: F-003, API_명세서.md 6.3.4
    """
    try:
        schedule = ScheduleService.get_schedule_detail(
            db=db,
            user=current_user,
            schedule_id=schedule_id,
        )
        return schedule

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error fetching schedule detail: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "SCHEDULE004",
                "message": "일정 상세 조회 중 오류가 발생했습니다.",
            },
        )


@router.patch("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(
    schedule_id: str,
    payload: UpdateSchedulePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    일정 수정

    PATCH /api/v1/schedules/{schedule_id}

    **기능**:
    - 일정 정보 수정
    - 선생님만 수정 가능
    - 완료된 수업은 수정 불가
    - 수업 24시간 전까지만 수정 가능

    **Path Parameters**:
    - schedule_id: 일정 ID

    **Request Body** (모두 선택):
    - title: 일정 제목
    - start_at: 시작 시각 (ISO8601 형식)
    - end_at: 종료 시각 (ISO8601 형식)
    - location: 수업 장소
    - memo: 메모
    - status: 일정 상태
    - reschedule_reason: 변경 사유 (필수, 5자 이상)
    - cancel_reason: 취소 사유 (필수, 5자 이상)

    **Response**:
    - ScheduleOut: 수정된 일정

    Related: F-003, API_명세서.md 6.3.5
    """
    try:
        schedule = ScheduleService.update_schedule(
            db=db,
            user=current_user,
            schedule_id=schedule_id,
            payload=payload,
        )
        return schedule

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error updating schedule: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "SCHEDULE005",
                "message": "일정 수정 중 오류가 발생했습니다.",
            },
        )


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    일정 삭제

    DELETE /api/v1/schedules/{schedule_id}

    **기능**:
    - 일정 삭제
    - 선생님만 삭제 가능
    - 완료된 수업은 삭제 불가

    **Path Parameters**:
    - schedule_id: 일정 ID

    **Response**:
    - 204 No Content

    Related: F-003, API_명세서.md 6.3.6
    """
    try:
        ScheduleService.delete_schedule(
            db=db,
            user=current_user,
            schedule_id=schedule_id,
        )
        return None

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error deleting schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "SCHEDULE006",
                "message": "일정 삭제 중 오류가 발생했습니다.",
            },
        )


# TODO(Phase 2): Makeup Slots Endpoints
# @router.post("/makeup-slots", ...)
# @router.get("/makeup-slots", ...)
# @router.post("/makeup-slots/{slot_id}/book", ...)

# TODO(Phase 2): Exam Schedules Endpoints
# @router.post("/exams", ...)
# @router.get("/exams", ...)
