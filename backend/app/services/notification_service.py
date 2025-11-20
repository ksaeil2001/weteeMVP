"""
Notification Service - F-008 필수 알림 시스템 비즈니스 로직
알림 CRUD, 요약 계산, 이메일/SMS 발송, 통계
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, case

from app.models.notification import (
    Notification,
    NotificationCategory,
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationDeliveryStatus,
)
from app.models.settings import Settings
from app.models.user import User
from app.schemas.notification import (
    NotificationOut,
    NotificationListResponse,
    NotificationSummary,
    NotificationCategoryCounts,
    PaginationInfo,
    MarkAllReadResponse,
)
from app.services.email_service import email_service
from app.services.sms_service import sms_service

logger = logging.getLogger(__name__)


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
    def create_notification(
        db: Session,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        category: Optional[NotificationCategory] = None,
        related_resource_type: Optional[str] = None,
        related_resource_id: Optional[str] = None,
        is_required: bool = False,
    ) -> NotificationOut:
        """
        알림 생성 (실제 이벤트용)

        이 메서드는 F-003~F-006 등 다른 기능에서 호출되어
        실시간 이벤트 기반 알림을 생성합니다.

        Args:
            db: 데이터베이스 세션
            user_id: 알림 수신자 ID
            notification_type: 알림 타입
            title: 알림 제목
            message: 알림 메시지
            priority: 우선순위 (기본: NORMAL)
            category: 카테고리 (기본: type으로부터 자동 결정)
            related_resource_type: 관련 리소스 타입 (schedule, attendance, lesson, payment 등)
            related_resource_id: 관련 리소스 ID
            is_required: 필수 알림 여부 (false로 설정되면 사용자가 설정에서 끌 수 있음)

        Returns:
            NotificationOut: 생성된 알림

        Example:
            ```python
            # 수업 일정 리마인더
            NotificationService.create_notification(
                db=db,
                user_id=student_id,
                notification_type=NotificationType.SCHEDULE_REMINDER,
                title="🔔 1시간 후 수업",
                message=f"{student_name} - {subject} ({time})",
                priority=NotificationPriority.HIGH,
                category=NotificationCategory.SCHEDULE,
                related_resource_type="schedule",
                related_resource_id=schedule_id,
            )
            ```
        """
        # 카테고리 자동 결정 (type으로부터)
        if category is None:
            type_to_category_map = {
                NotificationType.SCHEDULE_REMINDER: NotificationCategory.SCHEDULE,
                NotificationType.SCHEDULE_CHANGED: NotificationCategory.SCHEDULE,
                NotificationType.SCHEDULE_CANCELLED: NotificationCategory.SCHEDULE,
                NotificationType.ATTENDANCE_CHANGED: NotificationCategory.ATTENDANCE,
                NotificationType.LESSON_RECORD_CREATED: NotificationCategory.LESSON,
                NotificationType.HOMEWORK_ASSIGNED: NotificationCategory.LESSON,
                NotificationType.MAKEUP_CLASS_AVAILABLE: NotificationCategory.SCHEDULE,
                NotificationType.MAKEUP_CLASS_REQUESTED: NotificationCategory.SCHEDULE,
                NotificationType.BILLING_ISSUED: NotificationCategory.PAYMENT,
                NotificationType.PAYMENT_CONFIRMED: NotificationCategory.PAYMENT,
                NotificationType.PAYMENT_FAILED: NotificationCategory.PAYMENT,
                NotificationType.GROUP_INVITE: NotificationCategory.GROUP,
                NotificationType.SYSTEM_NOTICE: NotificationCategory.SYSTEM,
            }
            category = type_to_category_map.get(notification_type, NotificationCategory.SYSTEM)

        # 알림 객체 생성
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            category=category,
            title=title,
            message=message,
            priority=priority,
            channel=NotificationChannel.IN_APP,
            delivery_status=NotificationDeliveryStatus.SENT,
            is_read=False,
            is_required=is_required,
            related_resource_type=related_resource_type,
            related_resource_id=related_resource_id,
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return NotificationService._to_notification_out(notification)

    @staticmethod
    def create_notifications_for_group(
        db: Session,
        user_ids: List[str],
        notification_type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        category: Optional[NotificationCategory] = None,
        related_resource_type: Optional[str] = None,
        related_resource_id: Optional[str] = None,
        is_required: bool = False,
    ) -> List[NotificationOut]:
        """
        그룹 알림 생성 (여러 사용자에게 동일 알림)

        F-002의 그룹 내 여러 멤버에게 동일 알림을 발송하는 경우 사용

        Args:
            db: 데이터베이스 세션
            user_ids: 알림을 받을 사용자 ID 리스트
            notification_type: 알림 타입
            title: 알림 제목
            message: 알림 메시지
            priority: 우선순위
            category: 카테고리
            related_resource_type: 관련 리소스 타입
            related_resource_id: 관련 리소스 ID
            is_required: 필수 알림 여부

        Returns:
            List[NotificationOut]: 생성된 알림 리스트
        """
        notifications = []
        for user_id in user_ids:
            notification = NotificationService.create_notification(
                db=db,
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                priority=priority,
                category=category,
                related_resource_type=related_resource_type,
                related_resource_id=related_resource_id,
                is_required=is_required,
            )
            notifications.append(notification)

        return notifications

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

    # ========== 고도화 기능: 이메일/SMS 발송, 통계, 필터링 ==========

    @staticmethod
    def _is_quiet_hours(user_settings: Optional[Settings]) -> bool:
        """
        야간 알림 제한 시간인지 확인

        Args:
            user_settings: 사용자 설정

        Returns:
            bool: True면 야간 모드 (알림 발송 안함)
        """
        if not user_settings or not user_settings.night_mode_enabled:
            return False

        now = datetime.now()
        current_time = now.strftime("%H:%M")

        start_time = user_settings.night_mode_start or "22:00"
        end_time = user_settings.night_mode_end or "08:00"

        # 자정을 넘어가는 경우 (예: 22:00 ~ 08:00)
        if start_time > end_time:
            return current_time >= start_time or current_time < end_time
        else:
            return start_time <= current_time < end_time

    @staticmethod
    def _should_send_channel(
        db: Session,
        user_id: str,
        channel: str,
        category: str,
        is_required: bool,
    ) -> bool:
        """
        특정 채널로 알림을 발송해야 하는지 확인

        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            channel: 채널 (email, push, sms)
            category: 알림 카테고리
            is_required: 필수 알림 여부

        Returns:
            bool: True면 발송해야 함
        """
        # 필수 알림(정산)은 항상 발송
        if is_required:
            return True

        # 사용자 설정 조회
        settings = db.query(Settings).filter(Settings.user_id == user_id).first()
        if not settings:
            return False

        # 야간 모드 확인
        if NotificationService._is_quiet_hours(settings):
            return False

        # 채널별 활성화 확인
        if channel == "email" and not settings.email_enabled:
            return False
        if channel == "push" and not settings.push_enabled:
            return False

        # 카테고리별 활성화 확인
        categories = settings.notification_categories or {}
        if category in categories and not categories.get(category, True):
            return False

        return True

    @staticmethod
    def send_notification_via_channels(
        db: Session,
        notification: Notification,
        user: User,
        action_url: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, bool]:
        """
        알림을 여러 채널로 발송

        Args:
            db: 데이터베이스 세션
            notification: 알림 객체
            user: 사용자 객체
            action_url: 액션 URL
            extra_data: 추가 데이터

        Returns:
            Dict[str, bool]: 채널별 발송 결과
        """
        results = {"in_app": True}  # IN_APP은 이미 DB에 저장됨

        # 이메일 발송
        if user.email and NotificationService._should_send_channel(
            db, user.id, "email", notification.category.value, notification.is_required
        ):
            try:
                email_sent = email_service.send_notification_email(
                    to_email=user.email,
                    notification_type=notification.type.value,
                    title=notification.title,
                    message=notification.message,
                    priority=notification.priority.value,
                    action_url=action_url,
                    extra_data=extra_data,
                )
                results["email"] = email_sent
                if email_sent:
                    logger.info(f"Email notification sent to {user.email}")
            except Exception as e:
                logger.error(f"Failed to send email notification: {e}")
                results["email"] = False

        # SMS 발송 (중요 알림만: CRITICAL, HIGH)
        if (
            user.phone
            and notification.priority in [NotificationPriority.CRITICAL, NotificationPriority.HIGH]
            and NotificationService._should_send_channel(
                db, user.id, "sms", notification.category.value, notification.is_required
            )
        ):
            try:
                sms_sent = sms_service.send_notification_sms(
                    to_phone=user.phone,
                    notification_type=notification.type.value,
                    title=notification.title,
                    message=notification.message,
                )
                results["sms"] = sms_sent
                if sms_sent:
                    logger.info(f"SMS notification sent to {user.phone}")
            except Exception as e:
                logger.error(f"Failed to send SMS notification: {e}")
                results["sms"] = False

        return results

    @staticmethod
    def create_and_send_notification(
        db: Session,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        category: Optional[NotificationCategory] = None,
        related_resource_type: Optional[str] = None,
        related_resource_id: Optional[str] = None,
        is_required: bool = False,
        action_url: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> Tuple[NotificationOut, Dict[str, bool]]:
        """
        알림 생성 및 채널별 발송

        기존 create_notification을 확장하여 이메일/SMS 발송까지 처리

        Args:
            db: 데이터베이스 세션
            user_id: 알림 수신자 ID
            notification_type: 알림 타입
            title: 알림 제목
            message: 알림 메시지
            priority: 우선순위
            category: 카테고리
            related_resource_type: 관련 리소스 타입
            related_resource_id: 관련 리소스 ID
            is_required: 필수 알림 여부
            action_url: 액션 URL
            extra_data: 추가 데이터

        Returns:
            Tuple[NotificationOut, Dict[str, bool]]: 생성된 알림과 채널별 발송 결과
        """
        # 기존 알림 생성
        notification_out = NotificationService.create_notification(
            db=db,
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            category=category,
            related_resource_type=related_resource_type,
            related_resource_id=related_resource_id,
            is_required=is_required,
        )

        # 사용자 및 알림 객체 조회
        user = db.query(User).filter(User.id == user_id).first()
        notification = db.query(Notification).filter(
            Notification.id == notification_out.notification_id
        ).first()

        # 채널별 발송
        send_results = {"in_app": True}
        if user and notification:
            send_results = NotificationService.send_notification_via_channels(
                db=db,
                notification=notification,
                user=user,
                action_url=action_url,
                extra_data=extra_data,
            )

        return notification_out, send_results

    # ========== 알림 통계 ==========

    @staticmethod
    def get_notification_statistics(
        db: Session,
        user_id: str,
        days: int = 30,
    ) -> Dict[str, Any]:
        """
        알림 통계 조회

        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            days: 통계 기간 (일)

        Returns:
            Dict: 알림 통계
        """
        start_date = datetime.utcnow() - timedelta(days=days)

        # 기본 쿼리 (기간 내 알림)
        base_query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.created_at >= start_date,
        )

        # 총 알림 수
        total_count = base_query.count()

        # 읽음/안읽음 개수
        read_count = base_query.filter(Notification.is_read == True).count()
        unread_count = total_count - read_count

        # 읽음률 계산
        read_rate = (read_count / total_count * 100) if total_count > 0 else 0

        # 카테고리별 통계
        category_stats = (
            db.query(
                Notification.category,
                func.count(Notification.id).label("total"),
                func.sum(case((Notification.is_read == True, 1), else_=0)).label("read"),
            )
            .filter(
                Notification.user_id == user_id,
                Notification.created_at >= start_date,
            )
            .group_by(Notification.category)
            .all()
        )

        by_category = {}
        for cat, total, read in category_stats:
            by_category[cat.value] = {
                "total": total,
                "read": read or 0,
                "unread": total - (read or 0),
                "read_rate": round((read or 0) / total * 100, 1) if total > 0 else 0,
            }

        # 우선순위별 통계
        priority_stats = (
            db.query(
                Notification.priority,
                func.count(Notification.id).label("total"),
                func.sum(case((Notification.is_read == True, 1), else_=0)).label("read"),
            )
            .filter(
                Notification.user_id == user_id,
                Notification.created_at >= start_date,
            )
            .group_by(Notification.priority)
            .all()
        )

        by_priority = {}
        for pri, total, read in priority_stats:
            by_priority[pri.value] = {
                "total": total,
                "read": read or 0,
            }

        # 일별 알림 추이 (최근 7일)
        daily_stats = []
        for i in range(7):
            day = datetime.utcnow().date() - timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())

            count = (
                db.query(func.count(Notification.id))
                .filter(
                    Notification.user_id == user_id,
                    Notification.created_at >= day_start,
                    Notification.created_at <= day_end,
                )
                .scalar()
            )

            daily_stats.append({
                "date": day.isoformat(),
                "count": count,
            })

        daily_stats.reverse()  # 오래된 날짜 먼저

        # 평균 읽기 시간 (읽은 알림의 created_at과 read_at 차이)
        avg_read_time = None
        read_notifications = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == True,
                Notification.read_at.isnot(None),
                Notification.created_at >= start_date,
            )
            .all()
        )

        if read_notifications:
            total_seconds = 0
            for n in read_notifications:
                diff = n.read_at - n.created_at
                total_seconds += diff.total_seconds()
            avg_seconds = total_seconds / len(read_notifications)
            avg_read_time = {
                "seconds": int(avg_seconds),
                "formatted": NotificationService._format_duration(int(avg_seconds)),
            }

        return {
            "period_days": days,
            "total_count": total_count,
            "read_count": read_count,
            "unread_count": unread_count,
            "read_rate": round(read_rate, 1),
            "by_category": by_category,
            "by_priority": by_priority,
            "daily_trend": daily_stats,
            "avg_read_time": avg_read_time,
        }

    @staticmethod
    def _format_duration(seconds: int) -> str:
        """초를 읽기 쉬운 형식으로 변환"""
        if seconds < 60:
            return f"{seconds}초"
        elif seconds < 3600:
            minutes = seconds // 60
            return f"{minutes}분"
        else:
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            if minutes > 0:
                return f"{hours}시간 {minutes}분"
            return f"{hours}시간"

    @staticmethod
    def cleanup_old_notifications(
        db: Session,
        user_id: Optional[str] = None,
        read_retention_days: int = 30,
        unread_retention_days: int = 90,
    ) -> int:
        """
        오래된 알림 자동 삭제

        Args:
            db: 데이터베이스 세션
            user_id: 특정 사용자만 처리 (None이면 전체)
            read_retention_days: 읽은 알림 보관 기간
            unread_retention_days: 읽지 않은 알림 보관 기간

        Returns:
            int: 삭제된 알림 수
        """
        now = datetime.utcnow()
        read_cutoff = now - timedelta(days=read_retention_days)
        unread_cutoff = now - timedelta(days=unread_retention_days)

        # 삭제 대상 조회
        query = db.query(Notification).filter(
            or_(
                and_(Notification.is_read == True, Notification.created_at < read_cutoff),
                and_(Notification.is_read == False, Notification.created_at < unread_cutoff),
            )
        )

        if user_id:
            query = query.filter(Notification.user_id == user_id)

        # 삭제 실행
        deleted_count = query.delete(synchronize_session=False)
        db.commit()

        logger.info(f"Cleaned up {deleted_count} old notifications")
        return deleted_count
