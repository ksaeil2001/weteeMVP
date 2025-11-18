"""
Textbook Service - F-005 교재 관리 및 진도 통계 비즈니스 로직
교재 CRUD, 진도 요약, 진도 히스토리
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.textbook import Textbook
from app.models.lesson import LessonRecord, ProgressRecord
from app.models.schedule import Schedule
from app.models.group import Group, GroupMember, GroupMemberRole, GroupMemberInviteStatus
from app.models.user import User
from app.schemas.textbook import (
    CreateTextbookPayload,
    UpdateTextbookPayload,
    TextbookOut,
)
from app.schemas.lesson import (
    ProgressSummary,
    ProgressHistoryItem,
    ProgressHistoryResponse,
)


class TextbookService:
    """
    교재 서비스 레이어
    """

    @staticmethod
    def _check_group_access(db: Session, user: User, group_id: str) -> Group:
        """
        그룹 접근 권한 확인

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            group_id: 그룹 ID

        Returns:
            Group: 그룹 객체

        Raises:
            HTTPException: 그룹이 없거나 권한이 없는 경우
        """
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "GROUP_NOT_FOUND", "message": "그룹을 찾을 수 없습니다."}
            )

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

        return group

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
            GroupMember.member_role == GroupMemberRole.TEACHER,
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        ).first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "TEACHER_ONLY", "message": "선생님만 수행할 수 있습니다."}
            )

    @staticmethod
    def create_textbook(
        db: Session,
        user: User,
        group_id: str,
        payload: CreateTextbookPayload
    ) -> TextbookOut:
        """
        교재 등록

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            group_id: 그룹 ID
            payload: 교재 생성 데이터

        Returns:
            TextbookOut: 생성된 교재

        Raises:
            HTTPException: 권한 없음, 유효하지 않은 데이터 등
        """
        # 그룹 접근 권한 확인
        group = TextbookService._check_group_access(db, user, group_id)

        # 선생님 권한 확인
        TextbookService._check_teacher_permission(db, user, group)

        # Textbook 생성
        textbook = Textbook(
            group_id=group_id,
            title=payload.title,
            publisher=payload.publisher,
            total_pages=payload.total_pages,
            start_page=payload.start_page,
            is_active=True,
        )

        db.add(textbook)

        try:
            db.commit()
            db.refresh(textbook)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DATABASE_ERROR", "message": "데이터베이스 오류가 발생했습니다."}
            )

        return TextbookService._build_textbook_out(db, textbook)

    @staticmethod
    def get_textbooks(
        db: Session,
        user: User,
        group_id: str,
        include_inactive: bool = False
    ) -> List[TextbookOut]:
        """
        그룹의 교재 목록 조회

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            group_id: 그룹 ID
            include_inactive: 비활성 교재 포함 여부

        Returns:
            List[TextbookOut]: 교재 목록

        Raises:
            HTTPException: 권한 없음
        """
        # 그룹 접근 권한 확인
        group = TextbookService._check_group_access(db, user, group_id)

        # 교재 조회
        query = db.query(Textbook).filter(Textbook.group_id == group_id)

        if not include_inactive:
            query = query.filter(Textbook.is_active == True)

        textbooks = query.order_by(Textbook.created_at.desc()).all()

        return [TextbookService._build_textbook_out(db, tb) for tb in textbooks]

    @staticmethod
    def update_textbook(
        db: Session,
        user: User,
        textbook_id: str,
        payload: UpdateTextbookPayload
    ) -> TextbookOut:
        """
        교재 수정

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            textbook_id: 교재 ID
            payload: 수정 데이터

        Returns:
            TextbookOut: 수정된 교재

        Raises:
            HTTPException: 권한 없음, 존재하지 않음
        """
        textbook = db.query(Textbook).filter(Textbook.id == textbook_id).first()
        if not textbook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "TEXTBOOK_NOT_FOUND", "message": "교재를 찾을 수 없습니다."}
            )

        # 그룹 및 선생님 권한 확인
        group = db.query(Group).filter(Group.id == textbook.group_id).first()
        TextbookService._check_teacher_permission(db, user, group)

        # 필드 업데이트
        if payload.title is not None:
            textbook.title = payload.title
        if payload.publisher is not None:
            textbook.publisher = payload.publisher
        if payload.total_pages is not None:
            textbook.total_pages = payload.total_pages
        if payload.is_active is not None:
            textbook.is_active = payload.is_active

        textbook.updated_at = datetime.utcnow()

        try:
            db.commit()
            db.refresh(textbook)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DATABASE_ERROR", "message": "데이터베이스 오류가 발생했습니다."}
            )

        return TextbookService._build_textbook_out(db, textbook)

    @staticmethod
    def delete_textbook(
        db: Session,
        user: User,
        textbook_id: str
    ):
        """
        교재 삭제 (진도 기록이 있으면 삭제 불가)

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            textbook_id: 교재 ID

        Raises:
            HTTPException: 권한 없음, 진도 기록 있음
        """
        textbook = db.query(Textbook).filter(Textbook.id == textbook_id).first()
        if not textbook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "TEXTBOOK_NOT_FOUND", "message": "교재를 찾을 수 없습니다."}
            )

        # 그룹 및 선생님 권한 확인
        group = db.query(Group).filter(Group.id == textbook.group_id).first()
        TextbookService._check_teacher_permission(db, user, group)

        # 진도 기록이 있는지 확인 (F-005 규칙: 진도 기록이 있으면 삭제 불가, 숨기기만 가능)
        progress_count = db.query(func.count(ProgressRecord.id)).filter(
            ProgressRecord.textbook_id == textbook_id
        ).scalar()

        if progress_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "HAS_PROGRESS_RECORDS",
                    "message": "진도 기록이 있는 교재는 삭제할 수 없습니다. 숨기기를 사용하세요."
                }
            )

        try:
            db.delete(textbook)
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DATABASE_ERROR", "message": "데이터베이스 오류가 발생했습니다."}
            )

    @staticmethod
    def get_progress_summary(
        db: Session,
        user: User,
        group_id: str,
        textbook_id: str
    ) -> ProgressHistoryResponse:
        """
        교재별 진도 요약 및 히스토리 조회

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            group_id: 그룹 ID
            textbook_id: 교재 ID

        Returns:
            ProgressHistoryResponse: 진도 요약 및 히스토리

        Raises:
            HTTPException: 권한 없음, 존재하지 않음
        """
        # 그룹 접근 권한 확인
        group = TextbookService._check_group_access(db, user, group_id)

        # 교재 확인
        textbook = db.query(Textbook).filter(
            Textbook.id == textbook_id,
            Textbook.group_id == group_id
        ).first()

        if not textbook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "TEXTBOOK_NOT_FOUND", "message": "교재를 찾을 수 없습니다."}
            )

        # 진도 기록 조회
        progress_records = db.query(ProgressRecord).join(
            LessonRecord, ProgressRecord.lesson_record_id == LessonRecord.id
        ).join(
            Schedule, LessonRecord.schedule_id == Schedule.id
        ).filter(
            ProgressRecord.textbook_id == textbook_id
        ).order_by(Schedule.start_at.asc()).all()

        # 진도 요약 계산
        if progress_records:
            current_page = max(pr.end_page for pr in progress_records)
            total_lessons = len(progress_records)
            total_pages_covered = sum(pr.pages_covered for pr in progress_records)
            average_pages_per_lesson = total_pages_covered / total_lessons if total_lessons > 0 else 0.0

            # 진도율 계산
            if textbook.total_pages:
                progress_percentage = round((current_page / textbook.total_pages) * 100, 1)
            else:
                progress_percentage = 0.0

            # 첫/마지막 수업 날짜
            first_lesson = db.query(Schedule).join(
                LessonRecord, Schedule.id == LessonRecord.schedule_id
            ).join(
                ProgressRecord, LessonRecord.id == ProgressRecord.lesson_record_id
            ).filter(
                ProgressRecord.textbook_id == textbook_id
            ).order_by(Schedule.start_at.asc()).first()

            last_lesson = db.query(Schedule).join(
                LessonRecord, Schedule.id == LessonRecord.schedule_id
            ).join(
                ProgressRecord, LessonRecord.id == ProgressRecord.lesson_record_id
            ).filter(
                ProgressRecord.textbook_id == textbook_id
            ).order_by(Schedule.start_at.desc()).first()

            first_lesson_date = first_lesson.start_at.date().isoformat() if first_lesson else None
            last_lesson_date = last_lesson.start_at.date().isoformat() if last_lesson else None
        else:
            current_page = textbook.start_page
            total_lessons = 0
            average_pages_per_lesson = 0.0
            progress_percentage = 0.0
            first_lesson_date = None
            last_lesson_date = None

        summary = ProgressSummary(
            textbook_id=textbook.id,
            textbook_title=textbook.title,
            publisher=textbook.publisher,
            total_pages=textbook.total_pages,
            start_page=textbook.start_page,
            current_page=current_page,
            progress_percentage=progress_percentage,
            total_lessons=total_lessons,
            average_pages_per_lesson=round(average_pages_per_lesson, 1),
            first_lesson_date=first_lesson_date,
            last_lesson_date=last_lesson_date,
        )

        # 진도 히스토리 구성
        history = []
        for pr in progress_records:
            lesson = db.query(LessonRecord).filter(LessonRecord.id == pr.lesson_record_id).first()
            schedule = db.query(Schedule).filter(Schedule.id == lesson.schedule_id).first() if lesson else None

            content_preview = lesson.content[:50] + "..." if lesson and len(lesson.content) > 50 else lesson.content if lesson else None

            history.append(ProgressHistoryItem(
                progress_record_id=pr.id,
                lesson_record_id=pr.lesson_record_id,
                lesson_date=schedule.start_at.date().isoformat() if schedule else None,
                start_page=pr.start_page,
                end_page=pr.end_page,
                pages_covered=pr.pages_covered,
                content_preview=content_preview,
            ))

        # 차트 데이터 (날짜별 누적 진도)
        chart_labels = []
        chart_values = []
        cumulative_page = textbook.start_page

        for pr in progress_records:
            lesson = db.query(LessonRecord).filter(LessonRecord.id == pr.lesson_record_id).first()
            schedule = db.query(Schedule).filter(Schedule.id == lesson.schedule_id).first() if lesson else None

            if schedule:
                label = schedule.start_at.strftime("%m/%d")
                chart_labels.append(label)
                cumulative_page = pr.end_page
                chart_values.append(cumulative_page)

        return ProgressHistoryResponse(
            summary=summary,
            history=history,
            chart_labels=chart_labels if chart_labels else None,
            chart_values=chart_values if chart_values else None,
        )

    @staticmethod
    def _build_textbook_out(db: Session, textbook: Textbook) -> TextbookOut:
        """
        Textbook 모델을 TextbookOut 스키마로 변환

        Args:
            db: 데이터베이스 세션
            textbook: 교재 모델

        Returns:
            TextbookOut: 응답 스키마
        """
        # 현재 진도 계산 (마지막 end_page)
        last_progress = db.query(ProgressRecord).filter(
            ProgressRecord.textbook_id == textbook.id
        ).order_by(ProgressRecord.created_at.desc()).first()

        current_page = last_progress.end_page if last_progress else textbook.start_page

        # 진도율 계산
        if textbook.total_pages:
            progress_percentage = round((current_page / textbook.total_pages) * 100, 1)
        else:
            progress_percentage = None

        return TextbookOut(
            textbook_id=textbook.id,
            group_id=textbook.group_id,
            title=textbook.title,
            publisher=textbook.publisher,
            total_pages=textbook.total_pages,
            start_page=textbook.start_page,
            is_active=textbook.is_active,
            current_page=current_page,
            progress_percentage=progress_percentage,
            created_at=textbook.created_at.isoformat() if textbook.created_at else None,
            updated_at=textbook.updated_at.isoformat() if textbook.updated_at else None,
        )
