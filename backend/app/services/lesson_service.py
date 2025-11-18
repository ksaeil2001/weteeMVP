"""
Lesson Record Service - F-005 수업 기록 및 진도 관리 비즈니스 로직
수업 기록 CRUD, 진도 추적, 통계, 권한 검증
"""

from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.lesson import LessonRecord, ProgressRecord
from app.models.textbook import Textbook
from app.models.schedule import Schedule
from app.models.group import Group, GroupMember, GroupMemberRole, GroupMemberInviteStatus
from app.models.user import User
from app.models.notification import NotificationType, NotificationPriority
from app.schemas.lesson import (
    CreateLessonRecordPayload,
    UpdateLessonRecordPayload,
    LessonRecordOut,
    ProgressRecordOut,
    ProgressSummary,
)
from app.services.notification_service import NotificationService


class LessonService:
    """
    수업 기록 서비스 레이어
    """

    # Constants
    MAX_EDIT_DAYS = 30  # 작성 후 최대 수정 가능 일수 (F-005 규칙)
    MAX_DELETE_HOURS = 24  # 작성 후 최대 삭제 가능 시간 (F-005 규칙)
    MAX_PROGRESS_RECORDS_PER_LESSON = 5  # 한 수업당 최대 진도 기록 수

    @staticmethod
    def _check_schedule_access(db: Session, user: User, schedule_id: str) -> Tuple[Schedule, Group]:
        """
        일정 접근 권한 확인 헬퍼 메서드

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            schedule_id: 일정 ID

        Returns:
            Tuple[Schedule, Group]: 일정, 그룹 객체

        Raises:
            HTTPException: 일정이 없거나 권한이 없는 경우
        """
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "SCHEDULE_NOT_FOUND", "message": "일정을 찾을 수 없습니다."}
            )

        group = db.query(Group).filter(Group.id == schedule.group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "GROUP_NOT_FOUND", "message": "그룹을 찾을 수 없습니다."}
            )

        # 멤버십 확인
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == user.id,
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        ).first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "NOT_GROUP_MEMBER", "message": "이 그룹의 멤버가 아닙니다."}
            )

        return schedule, group

    @staticmethod
    def _check_teacher_permission(db: Session, user: User, group: Group):
        """
        선생님 권한 확인

        Raises:
            HTTPException: 선생님이 아닌 경우
        """
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == user.id,
            GroupMember.role == GroupMemberRole.TEACHER,
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        ).first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "TEACHER_ONLY", "message": "선생님만 수행할 수 있습니다."}
            )

    @staticmethod
    def create_lesson_record(
        db: Session,
        user: User,
        schedule_id: str,
        payload: CreateLessonRecordPayload
    ) -> LessonRecordOut:
        """
        수업 기록 작성

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            schedule_id: 일정 ID
            payload: 수업 기록 생성 데이터

        Returns:
            LessonRecordOut: 생성된 수업 기록

        Raises:
            HTTPException: 권한 없음, 이미 존재, 유효하지 않은 데이터 등
        """
        # 1. 일정 및 그룹 접근 권한 확인
        schedule, group = LessonService._check_schedule_access(db, user, schedule_id)

        # 2. 선생님 권한 확인
        LessonService._check_teacher_permission(db, user, group)

        # 3. 이미 수업 기록이 있는지 확인 (1:1 관계)
        existing = db.query(LessonRecord).filter(LessonRecord.schedule_id == schedule_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "LESSON_RECORD_ALREADY_EXISTS", "message": "이미 이 일정에 대한 수업 기록이 있습니다."}
            )

        # 4. 진도 기록 수 제한 확인
        if payload.progress_records and len(payload.progress_records) > LessonService.MAX_PROGRESS_RECORDS_PER_LESSON:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "TOO_MANY_PROGRESS_RECORDS",
                    "message": f"한 수업당 최대 {LessonService.MAX_PROGRESS_RECORDS_PER_LESSON}개의 진도 기록만 가능합니다."
                }
            )

        # 5. 진도 기록의 교재가 모두 이 그룹에 속하는지 확인
        if payload.progress_records:
            textbook_ids = [pr.textbook_id for pr in payload.progress_records]
            textbooks = db.query(Textbook).filter(
                Textbook.id.in_(textbook_ids),
                Textbook.group_id == group.id,
                Textbook.is_active == True
            ).all()

            if len(textbooks) != len(textbook_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"code": "INVALID_TEXTBOOK", "message": "유효하지 않은 교재입니다."}
                )

        # 6. LessonRecord 생성
        lesson_record = LessonRecord(
            schedule_id=schedule_id,
            group_id=group.id,
            content=payload.content,
            student_feedback=payload.student_feedback,
            homework=payload.homework,
            created_by=user.id,
            is_shared=True,  # 기본값: 자동 공유
            shared_at=datetime.utcnow(),
        )

        db.add(lesson_record)
        db.flush()  # lesson_record.id 생성

        # 7. ProgressRecord 생성 (진도 기록이 있는 경우)
        if payload.progress_records:
            for pr_data in payload.progress_records:
                progress_record = ProgressRecord(
                    lesson_record_id=lesson_record.id,
                    textbook_id=pr_data.textbook_id,
                    start_page=pr_data.start_page,
                    end_page=pr_data.end_page,
                )
                db.add(progress_record)

        try:
            db.commit()
            db.refresh(lesson_record)
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DATABASE_ERROR", "message": "데이터베이스 오류가 발생했습니다."}
            )

        # F-008: 수업 기록 작성 알림 발송 (학생 + 학부모에게)
        try:
            # 그룹의 학생 및 학부모 ID 조회 (선생님 제외)
            recipient_ids = [
                row[0] for row in db.query(GroupMember.user_id).filter(
                    GroupMember.group_id == group.id,
                    GroupMember.role.in_([GroupMemberRole.STUDENT, GroupMemberRole.PARENT]),
                    GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
                ).all()
            ]

            if recipient_ids:
                schedule_date = schedule.start_at.strftime("%m월 %d일") if schedule.start_at else ""
                NotificationService.create_notifications_for_group(
                    db=db,
                    user_ids=recipient_ids,
                    notification_type=NotificationType.LESSON_RECORD_CREATED,
                    title="📝 수업 기록 작성됨",
                    message=f"{schedule.title} ({schedule_date}) - 수업 내용을 확인해보세요",
                    priority=NotificationPriority.NORMAL,
                    related_resource_type="lesson_record",
                    related_resource_id=lesson_record.id,
                )

                # 숙제가 있는 경우 추가 알림
                if payload.homework:
                    NotificationService.create_notifications_for_group(
                        db=db,
                        user_ids=recipient_ids,
                        notification_type=NotificationType.HOMEWORK_ASSIGNED,
                        title="📚 숙제가 부여되었습니다",
                        message=f"{schedule.title} ({schedule_date}) - 숙제를 확인해주세요",
                        priority=NotificationPriority.HIGH,
                        related_resource_type="lesson_record",
                        related_resource_id=lesson_record.id,
                    )
        except Exception as e:
            print(f"⚠️ Warning: Failed to send lesson record notification: {e}")
            # 알림 실패는 메인 로직에 영향을 주지 않음

        # 8. 응답 데이터 구성
        return LessonService._build_lesson_record_out(db, lesson_record)

    @staticmethod
    def get_lesson_record(
        db: Session,
        user: User,
        lesson_record_id: str
    ) -> LessonRecordOut:
        """
        수업 기록 상세 조회

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            lesson_record_id: 수업 기록 ID

        Returns:
            LessonRecordOut: 수업 기록 상세

        Raises:
            HTTPException: 권한 없음, 존재하지 않음
        """
        lesson_record = db.query(LessonRecord).filter(LessonRecord.id == lesson_record_id).first()
        if not lesson_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "LESSON_RECORD_NOT_FOUND", "message": "수업 기록을 찾을 수 없습니다."}
            )

        # 그룹 멤버십 확인
        group = db.query(Group).filter(Group.id == lesson_record.group_id).first()
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == user.id,
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        ).first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "NOT_GROUP_MEMBER", "message": "이 그룹의 멤버가 아닙니다."}
            )

        # 읽음 상태 업데이트 (학부모/학생인 경우)
        if membership.role == GroupMemberRole.PARENT and not lesson_record.parent_viewed_at:
            lesson_record.parent_viewed_at = datetime.utcnow()
            db.commit()
        elif membership.role == GroupMemberRole.STUDENT and not lesson_record.student_viewed_at:
            lesson_record.student_viewed_at = datetime.utcnow()
            db.commit()

        return LessonService._build_lesson_record_out(db, lesson_record)

    @staticmethod
    def update_lesson_record(
        db: Session,
        user: User,
        lesson_record_id: str,
        payload: UpdateLessonRecordPayload
    ) -> LessonRecordOut:
        """
        수업 기록 수정

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            lesson_record_id: 수업 기록 ID
            payload: 수정 데이터

        Returns:
            LessonRecordOut: 수정된 수업 기록

        Raises:
            HTTPException: 권한 없음, 수정 기한 초과 등
        """
        lesson_record = db.query(LessonRecord).filter(LessonRecord.id == lesson_record_id).first()
        if not lesson_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "LESSON_RECORD_NOT_FOUND", "message": "수업 기록을 찾을 수 없습니다."}
            )

        # 그룹 및 선생님 권한 확인
        group = db.query(Group).filter(Group.id == lesson_record.group_id).first()
        LessonService._check_teacher_permission(db, user, group)

        # 작성자 확인
        if lesson_record.created_by != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "NOT_AUTHOR", "message": "본인이 작성한 수업 기록만 수정할 수 있습니다."}
            )

        # 30일 수정 제한 확인 (F-005 규칙)
        days_since_creation = (datetime.utcnow() - lesson_record.created_at).days
        if days_since_creation > LessonService.MAX_EDIT_DAYS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "EDIT_PERIOD_EXPIRED",
                    "message": f"작성 후 {LessonService.MAX_EDIT_DAYS}일 이내만 수정 가능합니다."
                }
            )

        # 필드 업데이트
        if payload.content is not None:
            lesson_record.content = payload.content
        if payload.student_feedback is not None:
            lesson_record.student_feedback = payload.student_feedback
        if payload.homework is not None:
            lesson_record.homework = payload.homework

        lesson_record.updated_at = datetime.utcnow()

        try:
            db.commit()
            db.refresh(lesson_record)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DATABASE_ERROR", "message": "데이터베이스 오류가 발생했습니다."}
            )

        return LessonService._build_lesson_record_out(db, lesson_record)

    @staticmethod
    def delete_lesson_record(
        db: Session,
        user: User,
        lesson_record_id: str
    ):
        """
        수업 기록 삭제

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            lesson_record_id: 수업 기록 ID

        Raises:
            HTTPException: 권한 없음, 삭제 기한 초과 등
        """
        lesson_record = db.query(LessonRecord).filter(LessonRecord.id == lesson_record_id).first()
        if not lesson_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "LESSON_RECORD_NOT_FOUND", "message": "수업 기록을 찾을 수 없습니다."}
            )

        # 그룹 및 선생님 권한 확인
        group = db.query(Group).filter(Group.id == lesson_record.group_id).first()
        LessonService._check_teacher_permission(db, user, group)

        # 작성자 확인
        if lesson_record.created_by != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "NOT_AUTHOR", "message": "본인이 작성한 수업 기록만 삭제할 수 있습니다."}
            )

        # 24시간 삭제 제한 확인 (F-005 규칙)
        hours_since_creation = (datetime.utcnow() - lesson_record.created_at).total_seconds() / 3600
        if hours_since_creation > LessonService.MAX_DELETE_HOURS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "DELETE_PERIOD_EXPIRED",
                    "message": f"작성 후 {LessonService.MAX_DELETE_HOURS}시간 이내만 삭제 가능합니다."
                }
            )

        try:
            db.delete(lesson_record)
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DATABASE_ERROR", "message": "데이터베이스 오류가 발생했습니다."}
            )

    @staticmethod
    def _build_lesson_record_out(db: Session, lesson_record: LessonRecord) -> LessonRecordOut:
        """
        LessonRecord 모델을 LessonRecordOut 스키마로 변환

        Args:
            db: 데이터베이스 세션
            lesson_record: 수업 기록 모델

        Returns:
            LessonRecordOut: 응답 스키마
        """
        # 진도 기록 조회
        progress_records = db.query(ProgressRecord).filter(
            ProgressRecord.lesson_record_id == lesson_record.id
        ).all()

        progress_records_out = []
        for pr in progress_records:
            textbook = db.query(Textbook).filter(Textbook.id == pr.textbook_id).first()
            progress_records_out.append(ProgressRecordOut(
                progress_record_id=pr.id,
                lesson_record_id=pr.lesson_record_id,
                textbook_id=pr.textbook_id,
                textbook_title=textbook.title if textbook else None,
                start_page=pr.start_page,
                end_page=pr.end_page,
                pages_covered=pr.pages_covered,
                created_at=pr.created_at.isoformat() if pr.created_at else None,
            ))

        # 선생님 이름 조회
        teacher = db.query(User).filter(User.id == lesson_record.created_by).first()
        teacher_name = teacher.name if teacher else None

        # 일정 정보 조회
        schedule = db.query(Schedule).filter(Schedule.id == lesson_record.schedule_id).first()

        return LessonRecordOut(
            lesson_record_id=lesson_record.id,
            schedule_id=lesson_record.schedule_id,
            group_id=lesson_record.group_id,
            content=lesson_record.content,
            student_feedback=lesson_record.student_feedback,
            homework=lesson_record.homework,
            created_by=lesson_record.created_by,
            teacher_name=teacher_name,
            is_shared=lesson_record.is_shared,
            shared_at=lesson_record.shared_at.isoformat() if lesson_record.shared_at else None,
            parent_viewed_at=lesson_record.parent_viewed_at.isoformat() if lesson_record.parent_viewed_at else None,
            student_viewed_at=lesson_record.student_viewed_at.isoformat() if lesson_record.student_viewed_at else None,
            created_at=lesson_record.created_at.isoformat() if lesson_record.created_at else None,
            updated_at=lesson_record.updated_at.isoformat() if lesson_record.updated_at else None,
            progress_records=progress_records_out if progress_records_out else None,
            schedule_title=schedule.title if schedule else None,
            schedule_date=schedule.start_at.date().isoformat() if schedule and schedule.start_at else None,
        )


# TODO(Phase 2): ProgressSummary 계산, 진도 리포트 생성
# TODO(Phase 2): 알림 전송 (F-008 연동)
