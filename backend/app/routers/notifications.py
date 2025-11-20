"""
Notifications Router - F-008 필수 알림 시스템
API_명세서.md 6.8 기반 알림 엔드포인트 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse,
    NotificationSummary,
    NotificationOut,
    MarkAllReadRequest,
    MarkAllReadResponse,
    CreateTestNotificationRequest,
    FCMTokenRequest,
    FCMTokenResponse,
)
from app.services.notification_service import NotificationService
from app.services.email_service import email_service
from app.services.sms_service import sms_service
from app.core.response import success_response
from app.config import settings

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def get_notifications(
    category: Optional[str] = Query(None, description="카테고리 필터 (all/schedule/attendance/payment/lesson/group/system)"),
    status: Optional[str] = Query("all", description="상태 필터 (all/read/unread)"),
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기 (1-100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    알림 목록 조회 (페이지네이션 & 필터링)

    GET /api/v1/notifications

    **기능**:
    - 로그인한 사용자의 알림 목록 조회
    - 카테고리별, 읽음/안 읽음 필터링
    - 페이지네이션 지원
    - 최신순 정렬 (created_at DESC)

    **Query Parameters**:
    - category: 카테고리 필터 (all, schedule, attendance, payment, lesson, group, system)
    - status: 상태 필터 (all, read, unread)
    - page: 페이지 번호 (기본: 1)
    - size: 페이지 크기 (기본: 20, 최대: 100)

    **Response**:
    - items: 알림 목록 (NotificationItem[])
    - pagination: 페이지네이션 정보
    - unread_count: 전체 읽지 않은 알림 개수

    Related: F-008, API_명세서.md 6.8.1
    """
    try:
        result = NotificationService.get_notifications(
            db=db,
            user_id=current_user.id,
            category=category,
            status=status,
            page=page,
            size=size,
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except Exception as e:
        db.rollback()
        print(f"🔥 Error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "NOTIFICATION001",
                "message": "알림 목록을 가져오는 중 오류가 발생했습니다.",
            },
        )


@router.get("/summary")
def get_notification_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    알림 요약 정보 조회

    GET /api/v1/notifications/summary

    **기능**:
    - 읽지 않은 알림 전체 개수
    - 카테고리별 읽지 않은 알림 개수
    - 가장 최근 알림 1개

    **Response**:
    - total_unread: 전체 읽지 않은 알림 개수
    - by_category: 카테고리별 읽지 않은 개수
    - latest_notification: 가장 최근 알림 (nullable)

    **사용처**:
    - 헤더 벨 아이콘의 배지 숫자
    - 알림 드롭다운의 요약 정보

    Related: F-008, API_명세서.md 6.8.2
    """
    try:
        summary = NotificationService.get_summary(
            db=db,
            user_id=current_user.id,
        )
        return success_response(
            data=summary.model_dump(mode='json') if hasattr(summary, 'model_dump') else summary
        )
    except Exception as e:
        db.rollback()
        print(f"🔥 Error fetching notification summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "NOTIFICATION002",
                "message": "알림 요약 정보를 가져오는 중 오류가 발생했습니다.",
            },
        )


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    알림 읽음 처리 (개별)

    PATCH /api/v1/notifications/{notification_id}/read

    **기능**:
    - 특정 알림을 읽음 상태로 변경
    - is_read = True, read_at = 현재 시간

    **Path Parameters**:
    - notification_id: 알림 ID (UUID)

    **Response**:
    - 204 No Content (성공)
    - 404 Not Found (알림 없음)

    Related: F-008, API_명세서.md 6.8.3
    """
    success = NotificationService.mark_as_read(
        db=db,
        user_id=current_user.id,
        notification_id=notification_id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOTIFICATION003",
                "message": "알림을 찾을 수 없습니다.",
            },
        )

    return success_response(data={}, status_code=status.HTTP_204_NO_CONTENT)


@router.post("/read-all")
def mark_all_notifications_as_read(
    payload: MarkAllReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    알림 일괄 읽음 처리

    POST /api/v1/notifications/read-all

    **기능**:
    - 읽지 않은 알림을 모두 읽음 처리
    - 특정 카테고리만 읽음 처리 가능 (선택)

    **Request Body**:
    - category (optional): 특정 카테고리만 읽음 처리

    **Response**:
    - marked_count: 읽음 처리된 알림 개수
    - remaining_unread: 남은 읽지 않은 알림 개수

    Related: F-008, API_명세서.md 6.8.4
    """
    try:
        result = NotificationService.mark_all_as_read(
            db=db,
            user_id=current_user.id,
            category=payload.category,
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except Exception as e:
        db.rollback()
        print(f"🔥 Error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "NOTIFICATION004",
                "message": "일괄 읽음 처리 중 오류가 발생했습니다.",
            },
        )


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    알림 삭제

    DELETE /api/v1/notifications/{notification_id}

    **기능**:
    - 특정 알림을 삭제 (소프트 삭제가 아닌 물리 삭제)

    **Path Parameters**:
    - notification_id: 알림 ID (UUID)

    **Response**:
    - 204 No Content (성공)
    - 404 Not Found (알림 없음)

    Related: F-008, API_명세서.md 6.8.5
    """
    success = NotificationService.delete_notification(
        db=db,
        user_id=current_user.id,
        notification_id=notification_id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOTIFICATION003",
                "message": "알림을 찾을 수 없습니다.",
            },
        )

    return success_response(data={}, status_code=status.HTTP_204_NO_CONTENT)


@router.post("/test", status_code=status.HTTP_201_CREATED)
def create_test_notification(
    payload: CreateTestNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    테스트 알림 생성 (개발 환경 전용)

    POST /api/v1/notifications/test

    **기능**:
    - 개발/테스트용 알림 생성
    - 운영 환경에서는 비활성화 권장

    **Request Body**:
    - type: 테스트 타입 (schedule, payment, attendance, lesson)

    **Response**:
    - 생성된 알림 (NotificationOut)

    **주의**:
    - 개발 환경에서만 사용 권장
    - 운영 환경에서는 config.DEBUG == False일 때 403 반환 가능

    Related: F-008, API_명세서.md 6.8.6
    """
    try:
        notification = NotificationService.create_test_notification(
            db=db,
            user_id=current_user.id,
            test_type=payload.type,
        )
        return success_response(
            data=notification.model_dump(mode='json',
            status_code=status.HTTP_201_CREATED
        ) if hasattr(notification, 'model_dump') else notification
        )
    except Exception as e:
        db.rollback()
        print(f"🔥 Error creating test notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "NOTIFICATION005",
                "message": "테스트 알림 생성 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 고도화 기능 (이메일/SMS, 통계)
# ==========================

@router.get("/statistics")
def get_notification_statistics(
    days: int = Query(30, ge=1, le=365, description="통계 기간 (일)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    알림 통계 조회

    GET /api/v1/notifications/statistics

    **기능**:
    - 읽음률, 카테고리별/우선순위별 통계
    - 일별 알림 추이
    - 평균 읽기 시간

    **Query Parameters**:
    - days: 통계 기간 (기본: 30일, 최대: 365일)

    **Response**:
    - total_count: 총 알림 수
    - read_count: 읽은 알림 수
    - unread_count: 읽지 않은 알림 수
    - read_rate: 읽음률 (%)
    - by_category: 카테고리별 통계
    - by_priority: 우선순위별 통계
    - daily_trend: 일별 알림 추이
    - avg_read_time: 평균 읽기 시간

    Related: F-008 고도화
    """
    try:
        statistics = NotificationService.get_notification_statistics(
            db=db,
            user_id=current_user.id,
            days=days,
        )
        return success_response(data=statistics)
    except Exception as e:
        db.rollback()
        print(f"🔥 Error fetching notification statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "NOTIFICATION006",
                "message": "알림 통계를 가져오는 중 오류가 발생했습니다.",
            },
        )


@router.post("/test-email", status_code=status.HTTP_200_OK)
def send_test_email(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    테스트 이메일 발송

    POST /api/v1/notifications/test-email

    **기능**:
    - 이메일 서비스 연동 테스트
    - 현재 사용자의 이메일로 테스트 이메일 발송

    **Response**:
    - success: 발송 성공 여부
    - message: 결과 메시지
    - email_enabled: 이메일 서비스 활성화 여부

    Related: F-008 고도화
    """
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "NOTIFICATION007",
                "message": "테스트 이메일은 개발 환경에서만 사용할 수 있습니다.",
            },
        )

    if not current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "NOTIFICATION008",
                "message": "사용자 이메일이 설정되지 않았습니다.",
            },
        )

    is_enabled = email_service.is_enabled()
    if not is_enabled:
        return success_response(
            data={
                "success": False,
                "message": "이메일 서비스가 비활성화되어 있습니다. 환경변수를 확인해주세요.",
                "email_enabled": False,
            }
        )

    success = email_service.send_test_email(current_user.email)
    return success_response(
        data={
            "success": success,
            "message": "테스트 이메일이 발송되었습니다." if success else "이메일 발송에 실패했습니다.",
            "email_enabled": True,
            "to_email": current_user.email,
        }
    )


@router.post("/test-sms", status_code=status.HTTP_200_OK)
def send_test_sms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    테스트 SMS 발송

    POST /api/v1/notifications/test-sms

    **기능**:
    - SMS 서비스 연동 테스트
    - 현재 사용자의 전화번호로 테스트 SMS 발송

    **Response**:
    - success: 발송 성공 여부
    - message: 결과 메시지
    - sms_enabled: SMS 서비스 활성화 여부

    Related: F-008 고도화
    """
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "NOTIFICATION009",
                "message": "테스트 SMS는 개발 환경에서만 사용할 수 있습니다.",
            },
        )

    if not current_user.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "NOTIFICATION010",
                "message": "사용자 전화번호가 설정되지 않았습니다.",
            },
        )

    is_enabled = sms_service.is_enabled()
    if not is_enabled:
        return success_response(
            data={
                "success": False,
                "message": "SMS 서비스가 비활성화되어 있습니다. 환경변수를 확인해주세요.",
                "sms_enabled": False,
            }
        )

    success = sms_service.send_test_sms(current_user.phone)
    return success_response(
        data={
            "success": success,
            "message": "테스트 SMS가 발송되었습니다." if success else "SMS 발송에 실패했습니다.",
            "sms_enabled": True,
            "to_phone": current_user.phone,
        }
    )


@router.post("/cleanup", status_code=status.HTTP_200_OK)
def cleanup_old_notifications(
    read_retention_days: int = Query(30, ge=1, le=365, description="읽은 알림 보관 기간 (일)"),
    unread_retention_days: int = Query(90, ge=1, le=365, description="읽지 않은 알림 보관 기간 (일)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    오래된 알림 정리

    POST /api/v1/notifications/cleanup

    **기능**:
    - 보관 기간이 지난 알림 삭제
    - 읽은 알림: 기본 30일
    - 읽지 않은 알림: 기본 90일

    **Query Parameters**:
    - read_retention_days: 읽은 알림 보관 기간
    - unread_retention_days: 읽지 않은 알림 보관 기간

    **Response**:
    - deleted_count: 삭제된 알림 수

    Related: F-008 고도화
    """
    try:
        deleted_count = NotificationService.cleanup_old_notifications(
            db=db,
            user_id=current_user.id,
            read_retention_days=read_retention_days,
            unread_retention_days=unread_retention_days,
        )
        return success_response(
            data={
                "deleted_count": deleted_count,
                "message": f"{deleted_count}개의 오래된 알림이 삭제되었습니다.",
            }
        )
    except Exception as e:
        db.rollback()
        print(f"🔥 Error cleaning up notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "NOTIFICATION011",
                "message": "알림 정리 중 오류가 발생했습니다.",
            },
        )


@router.get("/service-status")
def get_notification_service_status(
    current_user: User = Depends(get_current_user),
):
    """
    알림 서비스 상태 조회

    GET /api/v1/notifications/service-status

    **기능**:
    - 이메일/SMS 서비스 활성화 상태 확인
    - 서비스 설정 상태 확인

    **Response**:
    - email_enabled: 이메일 서비스 활성화 여부
    - sms_enabled: SMS 서비스 활성화 여부
    - sms_provider: SMS 프로바이더 (aws_sns / naver_sens)

    Related: F-008 고도화
    """
    return success_response(
        data={
            "email_enabled": email_service.is_enabled(),
            "sms_enabled": sms_service.is_enabled(),
            "sms_provider": sms_service.config.provider if sms_service.is_enabled() else None,
        }
    )


# ==========================
# 2단계 기능 (FCM 푸시 알림)
# MVP에서는 구현하지 않음
# ==========================

@router.post("/fcm-token", status_code=status.HTTP_201_CREATED)
def register_fcm_token(
    payload: FCMTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    FCM 토큰 등록 (푸시 알림용)

    POST /api/v1/notifications/fcm-token

    **기능**:
    - 모바일 푸시 알림을 위한 FCM 토큰 등록
    - MVP에서는 구현하지 않음 (2단계)

    **Request Body**:
    - fcm_token: FCM 토큰
    - device_info (optional): 디바이스 정보

    **Response**:
    - token_id: 토큰 ID
    - registered_at: 등록 시간

    Related: F-008, API_명세서.md 6.8.7 (2단계)
    """
    # TODO(v2): FCM 토큰 저장 로직 구현
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "code": "COMMON001",
            "message": "FCM 푸시 알림은 아직 구현되지 않았습니다. (TODO: F-008 2단계)",
        },
    )


@router.delete("/fcm-token", status_code=status.HTTP_204_NO_CONTENT)
def unregister_fcm_token(
    fcm_token: str = Query(..., description="FCM 토큰"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    FCM 토큰 삭제 (로그아웃 시)

    DELETE /api/v1/notifications/fcm-token

    **기능**:
    - 로그아웃 시 FCM 토큰 삭제
    - MVP에서는 구현하지 않음 (2단계)

    **Query Parameters**:
    - fcm_token: 삭제할 FCM 토큰

    **Response**:
    - 204 No Content

    Related: F-008, API_명세서.md 6.8.8 (2단계)
    """
    # TODO(v2): FCM 토큰 삭제 로직 구현
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "code": "COMMON001",
            "message": "FCM 푸시 알림은 아직 구현되지 않았습니다. (TODO: F-008 2단계)",
        },
    )
