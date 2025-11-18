"""
Schedule Service - F-003 수업 일정 관리 비즈니스 로직
일정 CRUD, 반복 일정 생성, 권한 검증
"""

from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from fastapi import HTTPException, status

from app.models.schedule import Schedule, ScheduleType, ScheduleStatus
from app.models.group import Group, GroupMember, GroupMemberRole, GroupMemberInviteStatus
from app.models.user import User
from app.schemas.schedule import (
    CreateRegularSchedulePayload,
    CreateSchedulePayload,
    UpdateSchedulePayload,
    ScheduleOut,
    ScheduleListResponse,
    PaginationInfo,
)


class ScheduleService:
    """
    일정 서비스 레이어
    """

    # Constants
    MAX_SCHEDULES_PER_CREATION = 200  # 한 번에 최대 생성 가능한 일정 개수

    @staticmethod
    def _check_group_access(db: Session, user: User, group_id: str, required_role: Optional[str] = None) -> Group:
        """
        그룹 접근 권한 확인 헬퍼 메서드

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            group_id: 그룹 ID
            required_role: 필요한 역할 (TEACHER 등), None이면 멤버이기만 하면 됨

        Returns:
            Group: 그룹 객체

        Raises:
            HTTPException: 그룹이 없거나 권한이 없는 경우
        """
        # 그룹 존재 확인
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "GROUP_NOT_FOUND", "message": "그룹을 찾을 수 없습니다."}
            )

        # 멤버십 확인
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user.id,
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        ).first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "NOT_GROUP_MEMBER", "message": "이 그룹의 멤버가 아닙니다."}
            )

        # 역할 확인
        if required_role and membership.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "INSUFFICIENT_PERMISSION", "message": f"{required_role} 권한이 필요합니다."}
            )

        return group

    @staticmethod
    def _generate_recurring_schedules(
        payload: CreateRegularSchedulePayload,
        group: Group,
        teacher_id: str
    ) -> List[Schedule]:
        """
        반복 규칙에 따라 일정 인스턴스 생성

        Args:
            payload: 정규 수업 생성 요청
            group: 그룹 객체
            teacher_id: 선생님 ID

        Returns:
            List[Schedule]: 생성된 일정 목록
        """
        schedules = []
        recurrence = payload.recurrence

        # 시작 날짜 파싱
        start_date = datetime.strptime(recurrence.start_date, "%Y-%m-%d").date()

        # 종료 조건 파싱
        end_date = None
        if recurrence.end_type == "date" and recurrence.end_date:
            end_date = datetime.strptime(recurrence.end_date, "%Y-%m-%d").date()

        # 반복 생성
        current_date = start_date
        count = 0
        max_iterations = ScheduleService.MAX_SCHEDULES_PER_CREATION

        # 시작 시간 파싱 (HH:mm)
        start_hour, start_minute = map(int, payload.start_time.split(":"))

        while count < max_iterations:
            # 종료 조건 체크
            if recurrence.end_type == "count" and recurrence.end_count:
                if count >= recurrence.end_count:
                    break
            elif recurrence.end_type == "date" and end_date:
                if current_date > end_date:
                    break

            # 요일 체크
            # current_date.weekday(): 0=월요일, 6=일요일
            # recurrence.days_of_week: 1=월요일, 7=일요일
            current_weekday = current_date.weekday() + 1  # 1-7로 변환

            if recurrence.days_of_week and current_weekday in recurrence.days_of_week:
                # 일정 생성
                start_datetime = datetime.combine(current_date, datetime.min.time()).replace(
                    hour=start_hour, minute=start_minute, second=0, microsecond=0
                )
                end_datetime = start_datetime + timedelta(minutes=payload.duration)

                schedule = Schedule(
                    group_id=group.id,
                    title=payload.title,
                    type=ScheduleType.REGULAR,
                    start_at=start_datetime,
                    end_at=end_datetime,
                    status=ScheduleStatus.SCHEDULED,
                    recurrence_rule={
                        "frequency": recurrence.frequency,
                        "interval": recurrence.interval,
                        "days_of_week": recurrence.days_of_week,
                        "start_date": recurrence.start_date,
                        "end_type": recurrence.end_type,
                        "end_date": recurrence.end_date,
                        "end_count": recurrence.end_count,
                    },
                    location=payload.location,
                    memo=payload.memo,
                )
                schedules.append(schedule)
                count += 1

            # 다음 날짜로 이동
            if recurrence.frequency == "daily":
                current_date += timedelta(days=recurrence.interval)
            elif recurrence.frequency in ["weekly", "biweekly"]:
                current_date += timedelta(days=1)
            elif recurrence.frequency == "monthly":
                # 간단 구현: 한 달 후 같은 날짜 (MVP)
                # TODO(Phase 2): 정확한 월 계산
                current_date += timedelta(days=30 * recurrence.interval)

            # 무한 루프 방지
            if recurrence.end_type == "never" and count >= 100:
                # 무한 반복인 경우 최대 100개까지만 (향후 3개월치)
                break

        return schedules

    @staticmethod
    def get_schedules(
        db: Session,
        user: User,
        group_id: Optional[str] = None,
        schedule_type: Optional[str] = None,
        schedule_status: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> ScheduleListResponse:
        """
        일정 목록 조회 (페이지네이션)

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            group_id: 그룹 ID 필터 (선택)
            schedule_type: 일정 타입 필터 (선택)
            schedule_status: 일정 상태 필터 (선택)
            from_date: 시작 날짜 (YYYY-MM-DD)
            to_date: 종료 날짜 (YYYY-MM-DD)
            page: 페이지 번호
            size: 페이지 크기

        Returns:
            ScheduleListResponse: 일정 목록 + 페이지네이션
        """
        # 사용자가 속한 그룹 ID 목록
        user_group_ids = [
            row[0] for row in db.query(GroupMember.group_id).filter(
                GroupMember.user_id == user.id,
                GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
            ).all()
        ]

        # 쿼리 시작
        query = db.query(Schedule).filter(Schedule.group_id.in_(user_group_ids))

        # 필터 적용
        if group_id:
            query = query.filter(Schedule.group_id == group_id)

        if schedule_type:
            query = query.filter(Schedule.type == schedule_type)

        if schedule_status:
            query = query.filter(Schedule.status == schedule_status)

        if from_date:
            from_dt = datetime.strptime(from_date, "%Y-%m-%d")
            query = query.filter(Schedule.start_at >= from_dt)

        if to_date:
            to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Schedule.start_at < to_dt)

        # 전체 개수
        total = query.count()

        # 페이지네이션
        offset = (page - 1) * size
        schedules = query.order_by(Schedule.start_at).offset(offset).limit(size).all()

        # 페이지네이션 정보
        total_pages = (total + size - 1) // size
        pagination = PaginationInfo(
            total=total,
            page=page,
            size=size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

        # 응답 변환
        items = [ScheduleService._to_schedule_out(db, schedule) for schedule in schedules]

        return ScheduleListResponse(items=items, pagination=pagination)

    @staticmethod
    def create_regular_schedule(
        db: Session,
        user: User,
        payload: CreateRegularSchedulePayload
    ) -> List[ScheduleOut]:
        """
        정규 수업 일정 생성 (반복 일정 자동 생성)

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            payload: 정규 수업 생성 요청

        Returns:
            List[ScheduleOut]: 생성된 일정 목록
        """
        # 권한 확인 (선생님만 가능)
        group = ScheduleService._check_group_access(db, user, payload.group_id, required_role=GroupMemberRole.TEACHER)

        # 반복 일정 생성
        schedules = ScheduleService._generate_recurring_schedules(payload, group, user.id)

        # DB에 저장
        db.add_all(schedules)
        db.commit()

        # 응답 변환
        return [ScheduleService._to_schedule_out(db, schedule) for schedule in schedules]

    @staticmethod
    def create_schedule(
        db: Session,
        user: User,
        payload: CreateSchedulePayload
    ) -> ScheduleOut:
        """
        단일 일정 생성 (보강, 기타)

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            payload: 일정 생성 요청

        Returns:
            ScheduleOut: 생성된 일정
        """
        # 권한 확인 (선생님만 가능)
        group = ScheduleService._check_group_access(db, user, payload.group_id, required_role=GroupMemberRole.TEACHER)

        # 시간 파싱
        start_at = datetime.fromisoformat(payload.start_at.replace('Z', '+00:00'))
        end_at = datetime.fromisoformat(payload.end_at.replace('Z', '+00:00'))

        # 새 일정 생성
        schedule = Schedule(
            group_id=group.id,
            title=payload.title,
            type=payload.type,
            start_at=start_at,
            end_at=end_at,
            status=ScheduleStatus.SCHEDULED,
            location=payload.location,
            memo=payload.memo,
            original_schedule_id=payload.original_schedule_id,
        )

        db.add(schedule)
        db.commit()
        db.refresh(schedule)

        return ScheduleService._to_schedule_out(db, schedule)

    @staticmethod
    def get_schedule_detail(
        db: Session,
        user: User,
        schedule_id: str
    ) -> ScheduleOut:
        """
        일정 상세 조회

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            schedule_id: 일정 ID

        Returns:
            ScheduleOut: 일정 상세
        """
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "SCHEDULE_NOT_FOUND", "message": "일정을 찾을 수 없습니다."}
            )

        # 권한 확인 (그룹 멤버인지)
        ScheduleService._check_group_access(db, user, schedule.group_id)

        return ScheduleService._to_schedule_out(db, schedule)

    @staticmethod
    def update_schedule(
        db: Session,
        user: User,
        schedule_id: str,
        payload: UpdateSchedulePayload
    ) -> ScheduleOut:
        """
        일정 수정

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            schedule_id: 일정 ID
            payload: 수정 내용

        Returns:
            ScheduleOut: 수정된 일정
        """
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "SCHEDULE_NOT_FOUND", "message": "일정을 찾을 수 없습니다."}
            )

        # 권한 확인 (선생님만 가능)
        ScheduleService._check_group_access(db, user, schedule.group_id, required_role=GroupMemberRole.TEACHER)

        # 완료된 수업은 수정 불가
        if schedule.status == ScheduleStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CANNOT_EDIT_DONE_SCHEDULE", "message": "완료된 수업은 수정할 수 없습니다."}
            )

        # 24시간 이내 수업은 수정 불가 (비즈니스 규칙)
        if schedule.start_at and datetime.utcnow() > schedule.start_at - timedelta(hours=24):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CANNOT_EDIT_WITHIN_24H", "message": "수업 24시간 전까지만 변경할 수 있습니다."}
            )

        # 필드 업데이트
        if payload.title is not None:
            schedule.title = payload.title
        if payload.start_at is not None:
            schedule.start_at = datetime.fromisoformat(payload.start_at.replace('Z', '+00:00'))
        if payload.end_at is not None:
            schedule.end_at = datetime.fromisoformat(payload.end_at.replace('Z', '+00:00'))
        if payload.location is not None:
            schedule.location = payload.location
        if payload.memo is not None:
            schedule.memo = payload.memo
        if payload.status is not None:
            schedule.status = payload.status
        if payload.reschedule_reason is not None:
            schedule.reschedule_reason = payload.reschedule_reason
            schedule.status = ScheduleStatus.RESCHEDULED
        if payload.cancel_reason is not None:
            schedule.cancel_reason = payload.cancel_reason
            schedule.status = ScheduleStatus.CANCELED

        db.commit()
        db.refresh(schedule)

        return ScheduleService._to_schedule_out(db, schedule)

    @staticmethod
    def delete_schedule(
        db: Session,
        user: User,
        schedule_id: str
    ) -> None:
        """
        일정 삭제

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            schedule_id: 일정 ID
        """
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "SCHEDULE_NOT_FOUND", "message": "일정을 찾을 수 없습니다."}
            )

        # 권한 확인 (선생님만 가능)
        ScheduleService._check_group_access(db, user, schedule.group_id, required_role=GroupMemberRole.TEACHER)

        # 완료된 수업은 삭제 불가
        if schedule.status == ScheduleStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CANNOT_DELETE_DONE_SCHEDULE", "message": "완료된 수업은 삭제할 수 없습니다."}
            )

        db.delete(schedule)
        db.commit()

    @staticmethod
    def _to_schedule_out(db: Session, schedule: Schedule) -> ScheduleOut:
        """
        Schedule 모델을 ScheduleOut 스키마로 변환

        Args:
            db: 데이터베이스 세션
            schedule: Schedule 모델

        Returns:
            ScheduleOut: 응답 스키마
        """
        # Group 정보 가져오기
        group = db.query(Group).filter(Group.id == schedule.group_id).first()
        group_name = group.name if group else None

        # TODO(F-003): teacher_id, teacher_name, student_ids, student_names 추가
        # GroupMember를 조인해서 가져와야 함

        return ScheduleOut(
            schedule_id=schedule.id,
            group_id=schedule.group_id,
            group_name=group_name,
            title=schedule.title,
            type=schedule.type.value,
            start_at=schedule.start_at.isoformat() if schedule.start_at else "",
            end_at=schedule.end_at.isoformat() if schedule.end_at else "",
            status=schedule.status.value,
            recurrence_rule=schedule.recurrence_rule,
            location=schedule.location,
            memo=schedule.memo,
            created_at=schedule.created_at.isoformat() if schedule.created_at else "",
            updated_at=schedule.updated_at.isoformat() if schedule.updated_at else None,
            original_schedule_id=schedule.original_schedule_id,
            cancel_reason=schedule.cancel_reason,
            reschedule_reason=schedule.reschedule_reason,
        )
