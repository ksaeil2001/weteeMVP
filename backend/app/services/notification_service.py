"""
Notification Service - F-008 필수 알림 시스템 비즈니스 로직
알림 CRUD 및 요약 계산 로직
"""

from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc

from app.models.notification import (
    Notification,
    NotificationCategory,
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationDeliveryStatus,
)
from app.schemas.notification import (
    NotificationOut,
    NotificationListResponse,
    NotificationSummary,
    NotificationCategoryCounts,
    PaginationInfo,
    MarkAllReadResponse,
)


class NotificationService:
    """
    알림 서비스 레이어
    """

    @staticmethod
    def get_notifications(
        db: Session,
        user_id: str,
        category: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> NotificationListResponse:
        """
        알림 목록 조회 (페이지네이션 & 필터링)

        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            category: 카테고리 필터 (선택)
            status: 상태 필터 ('all', 'read', 'unread')
            page: 페이지 번호 (1부터 시작)
            size: 페이지 크기

        Returns:
            NotificationListResponse: 알림 목록, 페이지네이션, 읽지 않은 개수
        """
        # 기본 쿼리 (내 알림만)
        query = db.query(Notification).filter(Notification.user_id == user_id)

        # 카테고리 필터
        if category and category != "all":
            query = query.filter(Notification.category == category)

        # 상태 필터
        if status and status != "all":
            is_read = status == "read"
            query = query.filter(Notification.is_read == is_read)

        # 전체 개수 계산
        total = query.count()

        # 페이지네이션
        offset = (page - 1) * size
        items = query.order_by(desc(Notification.created_at)).offset(offset).limit(size).all()

        # 전체 읽지 않은 개수 계산
        unread_count = (
            db.query(func.count(Notification.id))
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .scalar()
        )

        # 페이지네이션 정보
        total_pages = (total + size - 1) // size  # 올림 계산
        pagination = PaginationInfo(
            total=total,
            page=page,
            size=size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

        # 응답 변환
        notification_items = [NotificationService._to_notification_out(item) for item in items]

        return NotificationListResponse(
            items=notification_items,
            pagination=pagination,
            unread_count=unread_count,
        )

    @staticmethod
    def get_summary(db: Session, user_id: str) -> NotificationSummary:
        """
        알림 요약 정보 조회

        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID

        Returns:
            NotificationSummary: 읽지 않은 개수, 카테고리별 카운트, 최신 알림
        """
        # 읽지 않은 알림만 조회
        unread_query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        )

        # 전체 읽지 않은 개수
        total_unread = unread_query.count()

        # 카테고리별 읽지 않은 개수
        category_counts = (
            db.query(
                Notification.category,
                func.count(Notification.id)
            )
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
            .group_by(Notification.category)
            .all()
        )

        # 카테고리별 개수를 딕셔너리로 변환
        by_category = NotificationCategoryCounts()
        for category, count in category_counts:
            setattr(by_category, category.value, count)

        # 최신 알림 1개
        latest = (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
            .first()
        )

        latest_notification = None
        if latest:
            latest_notification = NotificationService._to_notification_out(latest)

        return NotificationSummary(
            total_unread=total_unread,
            by_category=by_category,
            latest_notification=latest_notification,
        )

    @staticmethod
    def mark_as_read(db: Session, user_id: str, notification_id: str) -> bool:
        """
        알림 읽음 처리 (개별)

        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            notification_id: 알림 ID

        Returns:
            bool: 성공 여부
        """
        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
            .first()
        )

        if not notification:
            return False

        # 이미 읽은 알림이면 스킵
        if notification.is_read:
            return True

        # 읽음 처리
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        notification.delivery_status = NotificationDeliveryStatus.READ

        db.commit()
        return True

    @staticmethod
    def mark_all_as_read(
        db: Session,
        user_id: str,
        category: Optional[str] = None
    ) -> MarkAllReadResponse:
        """
        알림 일괄 읽음 처리

        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            category: 특정 카테고리만 읽음 처리 (선택)

        Returns:
            MarkAllReadResponse: 읽음 처리된 개수, 남은 읽지 않은 개수
        """
        # 읽지 않은 알림만 조회
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        )

        # 카테고리 필터
        if category:
            query = query.filter(Notification.category == category)

        # 읽음 처리할 알림들
        notifications = query.all()
        marked_count = len(notifications)

        # 일괄 업데이트
        now = datetime.utcnow()
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now
            notification.delivery_status = NotificationDeliveryStatus.READ

        db.commit()

        # 남은 읽지 않은 개수 계산
        remaining_unread = (
            db.query(func.count(Notification.id))
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
            .scalar()
        )

        return MarkAllReadResponse(
            marked_count=marked_count,
            remaining_unread=remaining_unread,
        )

    @staticmethod
    def delete_notification(db: Session, user_id: str, notification_id: str) -> bool:
        """
        알림 삭제

        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            notification_id: 알림 ID

        Returns:
            bool: 성공 여부
        """
        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
            .first()
        )

        if not notification:
            return False

        db.delete(notification)
        db.commit()
        return True

    @staticmethod
    def create_test_notification(
        db: Session,
        user_id: str,
        test_type: str
    ) -> NotificationOut:
        """
        테스트 알림 생성 (개발 환경 전용)

        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            test_type: 테스트 타입 ('schedule', 'payment', 'attendance', 'lesson')

        Returns:
            NotificationOut: 생성된 알림
        """
        # 타입별 알림 설정
        test_configs = {
            "schedule": {
                "category": NotificationCategory.SCHEDULE,
                "type": NotificationType.SCHEDULE_REMINDER,
                "title": "🔔 1시간 후 수업 (테스트)",
                "message": "테스트 학생 - 수학 (오후 3시)",
                "priority": NotificationPriority.HIGH,
            },
            "payment": {
                "category": NotificationCategory.PAYMENT,
                "type": NotificationType.BILLING_ISSUED,
                "title": "💳 수업료 청구 (테스트)",
                "message": "11월 수업료 400,000원이 청구되었습니다.",
                "priority": NotificationPriority.CRITICAL,
                "is_required": True,
            },
            "attendance": {
                "category": NotificationCategory.ATTENDANCE,
                "type": NotificationType.ATTENDANCE_CHANGED,
                "title": "✅ 출석 상태 변경 (테스트)",
                "message": "최학생님이 11/17 수업을 결석 처리했습니다.",
                "priority": NotificationPriority.NORMAL,
            },
            "lesson": {
                "category": NotificationCategory.LESSON,
                "type": NotificationType.LESSON_RECORD_CREATED,
                "title": "📝 수업 기록 작성됨 (테스트)",
                "message": "오늘 수업 내용이 기록되었습니다. 확인해보세요!",
                "priority": NotificationPriority.NORMAL,
            },
        }

        config = test_configs.get(test_type, test_configs["schedule"])

        # 알림 생성
        notification = Notification(
            user_id=user_id,
            category=config["category"],
            type=config["type"],
            title=config["title"],
            message=config["message"],
            priority=config["priority"],
            channel=NotificationChannel.IN_APP,
            delivery_status=NotificationDeliveryStatus.SENT,
            is_read=False,
            is_required=config.get("is_required", False),
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return NotificationService._to_notification_out(notification)

    @staticmethod
    def _to_notification_out(notification: Notification) -> NotificationOut:
        """
        Notification 모델을 NotificationOut 스키마로 변환

        Args:
            notification: Notification 모델 인스턴스

        Returns:
            NotificationOut: Pydantic 스키마
        """
        related_resource = None
        if notification.related_resource_type and notification.related_resource_id:
            related_resource = {
                "type": notification.related_resource_type,
                "id": notification.related_resource_id,
            }

        return NotificationOut(
            notification_id=notification.id,
            category=notification.category.value,
            type=notification.type.value,
            title=notification.title,
            message=notification.message,
            status="read" if notification.is_read else "unread",
            priority=notification.priority.value,
            created_at=notification.created_at.isoformat() + "Z" if notification.created_at else None,
            read_at=notification.read_at.isoformat() + "Z" if notification.read_at else None,
            related_resource=related_resource,
            is_required=notification.is_required,
        )
