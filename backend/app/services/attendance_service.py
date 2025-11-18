"""
Attendance Service - F-004 출결 관리 비즈니스 로직
출결 CRUD, 통계, 권한 검증
"""

from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.attendance import Attendance, AttendanceStatus
from app.models.schedule import Schedule, ScheduleStatus
from app.models.group import Group, GroupMember, GroupMemberRole, GroupMemberInviteStatus
from app.models.user import User, UserRole
from app.models.notification import NotificationType, NotificationPriority
from app.schemas.attendance import (
    CreateAttendancePayload,
    BatchCreateAttendancePayload,
    UpdateAttendancePayload,
    AttendanceOut,
    AttendanceListResponse,
    AttendanceStatsResponse,
    AttendanceStats,
    BatchAttendanceResponse,
    StudentInfo,
    RecentAttendanceRecord,
)
from app.services.notification_service import NotificationService


class AttendanceService:
    """
    출결 서비스 레이어
    """

    # Constants
    MAX_CHECK_DAYS = 7  # 수업 종료 후 최대 출결 체크 가능 일수
    MAX_EDIT_DAYS = 7   # 최초 기록 후 최대 수정 가능 일수

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
        # 일정 존재 확인
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "SCHEDULE_NOT_FOUND", "message": "일정을 찾을 수 없습니다."}
            )

        # 그룹 확인
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
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        ).first()

        if not membership or membership.role != GroupMemberRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "TEACHER_ONLY", "message": "선생님만 출결을 기록할 수 있습니다."}
            )

    @staticmethod
    def _validate_check_time(schedule: Schedule):
        """
        출결 체크 가능 시간 검증

        F-004 비즈니스 규칙:
        - 수업 시작 시간 이후부터 체크 가능
        - 수업 종료 후 7일 이내까지만 체크 가능

        Raises:
            HTTPException: 시간 제약 위반 시
        """
        now = datetime.utcnow()

        # 수업 시작 전 체크 불가
        if now < schedule.start_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "TOO_EARLY_TO_CHECK",
                    "message": "수업이 시작되지 않았습니다. 수업 시작 후에 체크해주세요."
                }
            )

        # 수업 종료 후 7일 경과 체크 불가
        deadline = schedule.end_at + timedelta(days=AttendanceService.MAX_CHECK_DAYS)
        if now > deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "CHECK_DEADLINE_PASSED",
                    "message": f"수업이 {AttendanceService.MAX_CHECK_DAYS}일 전에 종료되었습니다. 특별한 사유가 있다면 고객센터에 문의해주세요."
                }
            )

    @staticmethod
    def _validate_edit_time(attendance: Attendance):
        """
        출결 수정 가능 시간 검증

        F-004 비즈니스 규칙:
        - 최초 기록 후 7일 이내까지만 수정 가능

        Raises:
            HTTPException: 시간 제약 위반 시
        """
        now = datetime.utcnow()
        deadline = attendance.recorded_at + timedelta(days=AttendanceService.MAX_EDIT_DAYS)

        if now > deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "EDIT_DEADLINE_PASSED",
                    "message": f"출결 기록은 {AttendanceService.MAX_EDIT_DAYS}일 이내에만 수정 가능합니다. 특별한 사유가 있다면 고객센터에 문의해주세요."
                }
            )

    @staticmethod
    def create_attendance(
        db: Session,
        user: User,
        payload: CreateAttendancePayload
    ) -> AttendanceOut:
        """
        출결 생성 (단일 학생)

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            payload: 출결 생성 요청

        Returns:
            AttendanceOut: 생성된 출결
        """
        # 일정 및 그룹 확인
        schedule, group = AttendanceService._check_schedule_access(db, user, payload.schedule_id)

        # 선생님 권한 확인
        AttendanceService._check_teacher_permission(db, user, group)

        # 출결 체크 시간 검증
        AttendanceService._validate_check_time(schedule)

        # 학생이 그룹 멤버인지 확인
        student_membership = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == payload.student_id,
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        ).first()

        if not student_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "STUDENT_NOT_IN_GROUP", "message": "해당 학생이 이 그룹에 속해 있지 않습니다."}
            )

        # 중복 출결 체크
        existing = db.query(Attendance).filter(
            Attendance.schedule_id == payload.schedule_id,
            Attendance.student_id == payload.student_id,
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "ATTENDANCE_ALREADY_EXISTS",
                    "message": "이미 출결이 기록되어 있습니다. 수정을 원하시면 수정 API를 사용해주세요."
                }
            )

        # 새 출결 생성
        attendance = Attendance(
            schedule_id=payload.schedule_id,
            student_id=payload.student_id,
            status=payload.status,
            late_minutes=payload.late_minutes,
            memo=payload.notes,  # notes → memo 변환
        )

        db.add(attendance)
        try:
            db.commit()
            db.refresh(attendance)
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "ATTENDANCE_CONFLICT", "message": "출결 기록 중 오류가 발생했습니다."}
            )

        # F-008: 출결 기록 알림 발송 (학생 + 학부모에게)
        try:
            # 알림 받을 사용자: 학생 본인 + 해당 학생의 학부모
            recipient_ids = [payload.student_id]

            # 학생의 학부모 찾기 (같은 그룹 내 PARENT 역할)
            parents = db.query(GroupMember.user_id).filter(
                GroupMember.group_id == group.id,
                GroupMember.role == GroupMemberRole.PARENT,
                GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
            ).all()
            recipient_ids.extend([p[0] for p in parents])

            if recipient_ids:
                status_text = {
                    AttendanceStatus.PRESENT: "출석",
                    AttendanceStatus.LATE: "지각",
                    AttendanceStatus.EARLY_LEAVE: "조퇴",
                    AttendanceStatus.ABSENT: "결석",
                }.get(payload.status, str(payload.status))

                schedule_time = schedule.start_at.strftime("%m월 %d일 %H:%M") if schedule.start_at else ""
                NotificationService.create_notifications_for_group(
                    db=db,
                    user_ids=recipient_ids,
                    notification_type=NotificationType.ATTENDANCE_CHANGED,
                    title=f"✅ 출결 기록 - {status_text}",
                    message=f"{schedule.title} ({schedule_time})",
                    priority=NotificationPriority.NORMAL,
                    related_resource_type="attendance",
                    related_resource_id=attendance.id,
                )
        except Exception as e:
            print(f"⚠️ Warning: Failed to send attendance notification: {e}")
            # 알림 실패는 메인 로직에 영향을 주지 않음

        return AttendanceService._to_attendance_out(db, attendance)

    @staticmethod
    def batch_create_attendances(
        db: Session,
        user: User,
        schedule_id: str,
        payload: BatchCreateAttendancePayload
    ) -> BatchAttendanceResponse:
        """
        배치 출결 체크 (여러 학생 동시)
        API 명세서 6.4.1 기반

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            schedule_id: 일정 ID
            payload: 배치 출결 요청

        Returns:
            BatchAttendanceResponse: 생성된 출결 목록
        """
        # 일정 및 그룹 확인
        schedule, group = AttendanceService._check_schedule_access(db, user, schedule_id)

        # 선생님 권한 확인
        AttendanceService._check_teacher_permission(db, user, group)

        # 출결 체크 시간 검증
        AttendanceService._validate_check_time(schedule)

        # 출결 생성
        attendances = []
        for item in payload.attendances:
            # 학생이 그룹 멤버인지 확인
            student_membership = db.query(GroupMember).filter(
                GroupMember.group_id == group.id,
                GroupMember.user_id == item.student_id,
                GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
            ).first()

            if not student_membership:
                # 배치 중 일부 학생이 그룹에 없으면 스킵 (또는 에러)
                # MVP에서는 스킵 처리
                continue

            # 중복 출결 체크
            existing = db.query(Attendance).filter(
                Attendance.schedule_id == schedule_id,
                Attendance.student_id == item.student_id,
            ).first()

            if existing:
                # 이미 있으면 업데이트 (배치 특성상 덮어쓰기)
                existing.status = item.status
                existing.late_minutes = item.late_minutes
                existing.memo = item.notes
                existing.updated_at = datetime.utcnow()
                attendances.append(existing)
            else:
                # 새로 생성
                attendance = Attendance(
                    schedule_id=schedule_id,
                    student_id=item.student_id,
                    status=item.status,
                    late_minutes=item.late_minutes,
                    memo=item.notes,
                )
                db.add(attendance)
                attendances.append(attendance)

        db.commit()

        # F-008: 배치 출결 알림 발송 (각 학생 + 해당 학부모에게)
        try:
            # 학부모 ID 목록 조회
            parent_ids = [row[0] for row in db.query(GroupMember.user_id).filter(
                GroupMember.group_id == group.id,
                GroupMember.role == GroupMemberRole.PARENT,
                GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
            ).all()]

            # 각 출결에 대해 알림 발송
            for attendance in attendances:
                recipient_ids = [attendance.student_id] + parent_ids
                if recipient_ids:
                    status_text = {
                        AttendanceStatus.PRESENT: "출석",
                        AttendanceStatus.LATE: "지각",
                        AttendanceStatus.EARLY_LEAVE: "조퇴",
                        AttendanceStatus.ABSENT: "결석",
                    }.get(attendance.status, str(attendance.status))

                    schedule_time = schedule.start_at.strftime("%m월 %d일 %H:%M") if schedule.start_at else ""
                    NotificationService.create_notifications_for_group(
                        db=db,
                        user_ids=recipient_ids,
                        notification_type=NotificationType.ATTENDANCE_CHANGED,
                        title=f"✅ 출결 기록 - {status_text}",
                        message=f"{schedule.title} ({schedule_time})",
                        priority=NotificationPriority.NORMAL,
                        related_resource_type="attendance",
                        related_resource_id=attendance.id,
                    )
        except Exception as e:
            print(f"⚠️ Warning: Failed to send batch attendance notifications: {e}")
            # 알림 실패는 메인 로직에 영향을 주지 않음

        # 응답 변환
        attendance_outs = [AttendanceService._to_attendance_out(db, att) for att in attendances]

        return BatchAttendanceResponse(
            schedule_id=schedule_id,
            attendances=attendance_outs
        )

    @staticmethod
    def get_attendance(
        db: Session,
        user: User,
        attendance_id: str
    ) -> AttendanceOut:
        """
        출결 단건 조회

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            attendance_id: 출결 ID

        Returns:
            AttendanceOut: 출결 정보
        """
        attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ATTENDANCE_NOT_FOUND", "message": "출결 기록을 찾을 수 없습니다."}
            )

        # 권한 확인 (그룹 멤버인지)
        schedule, group = AttendanceService._check_schedule_access(db, user, attendance.schedule_id)

        return AttendanceService._to_attendance_out(db, attendance)

    @staticmethod
    def update_attendance(
        db: Session,
        user: User,
        attendance_id: str,
        payload: UpdateAttendancePayload
    ) -> AttendanceOut:
        """
        출결 수정

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            attendance_id: 출결 ID
            payload: 수정 내용

        Returns:
            AttendanceOut: 수정된 출결
        """
        attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ATTENDANCE_NOT_FOUND", "message": "출결 기록을 찾을 수 없습니다."}
            )

        # 일정 및 그룹 확인
        schedule, group = AttendanceService._check_schedule_access(db, user, attendance.schedule_id)

        # 선생님 권한 확인
        AttendanceService._check_teacher_permission(db, user, group)

        # 수정 가능 시간 검증
        AttendanceService._validate_edit_time(attendance)

        # TODO(F-006): 정산 완료 후 수정 불가 검증
        # 현재는 MVP 단계로 미구현

        # 필드 업데이트
        if payload.status is not None:
            attendance.status = payload.status
        if payload.late_minutes is not None:
            attendance.late_minutes = payload.late_minutes
        if payload.notes is not None:
            attendance.memo = payload.notes

        db.commit()
        db.refresh(attendance)

        # F-008: 출결 수정 알림 발송
        try:
            # 학생 + 학부모에게 알림 발송 (선생님 제외)
            recipient_ids = AttendanceService._get_notification_recipients(db, group, attendance.student_id, exclude_teacher=True)
            if recipient_ids:
                status_text = {
                    AttendanceStatus.PRESENT: "출석",
                    AttendanceStatus.LATE: "지각",
                    AttendanceStatus.EARLY_LEAVE: "조퇴",
                    AttendanceStatus.ABSENT: "결석",
                }.get(attendance.status, str(attendance.status))

                schedule_time = schedule.start_at.strftime("%m월 %d일 %H:%M") if schedule.start_at else ""
                NotificationService.create_notifications_for_group(
                    db=db,
                    user_ids=recipient_ids,
                    notification_type=NotificationType.ATTENDANCE_CHANGED,
                    title=f"✅ 출결 수정 - {status_text}",
                    message=f"{schedule.title} ({schedule_time})",
                    priority=NotificationPriority.NORMAL,
                    related_resource_type="attendance",
                    related_resource_id=attendance.id,
                )
        except Exception as e:
            print(f"⚠️ Warning: Failed to send attendance update notification: {e}")
            # 알림 실패는 메인 로직에 영향을 주지 않음

        return AttendanceService._to_attendance_out(db, attendance)

    @staticmethod
    def delete_attendance(
        db: Session,
        user: User,
        attendance_id: str
    ) -> None:
        """
        출결 삭제

        F-004 비즈니스 규칙:
        - 출결 삭제는 영구 미지원 (감사 추적 필요)
        - MVP에서는 API 자체를 제공하지 않음

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (선생님)
            attendance_id: 출결 ID
        """
        # F-004: 출결 삭제 불가
        # 수정으로만 대응
        raise HTTPException(
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
            detail={"code": "DELETE_NOT_ALLOWED", "message": "출결 기록은 삭제할 수 없습니다. 수정을 원하시면 수정 API를 사용해주세요."}
        )

    @staticmethod
    def get_attendances_by_schedule(
        db: Session,
        user: User,
        schedule_id: str
    ) -> AttendanceListResponse:
        """
        일정별 출결 목록 조회

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            schedule_id: 일정 ID

        Returns:
            AttendanceListResponse: 출결 목록
        """
        # 일정 및 그룹 확인
        schedule, group = AttendanceService._check_schedule_access(db, user, schedule_id)

        # 출결 조회
        attendances = db.query(Attendance).filter(
            Attendance.schedule_id == schedule_id
        ).order_by(Attendance.recorded_at.desc()).all()

        # 응답 변환
        items = [AttendanceService._to_attendance_out(db, att) for att in attendances]

        return AttendanceListResponse(
            items=items,
            total=len(items)
        )

    @staticmethod
    def get_attendances_by_student(
        db: Session,
        user: User,
        student_id: str,
        group_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> AttendanceListResponse:
        """
        학생별 출결 목록 조회

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            student_id: 학생 ID
            group_id: 그룹 ID (선택)
            start_date: 시작 날짜 (YYYY-MM-DD, 선택)
            end_date: 종료 날짜 (YYYY-MM-DD, 선택)

        Returns:
            AttendanceListResponse: 출결 목록
        """
        # 권한 확인: 자신의 출결이거나, 같은 그룹 멤버
        # 학생/학부모는 자신의 출결만 조회 가능
        # 선생님은 자신이 관리하는 그룹의 학생 출결 조회 가능

        # 쿼리 시작
        query = db.query(Attendance).filter(Attendance.student_id == student_id)

        # 그룹 필터
        if group_id:
            # 그룹 멤버십 확인
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

            # 해당 그룹의 일정만
            schedule_ids = [s.id for s in db.query(Schedule.id).filter(Schedule.group_id == group_id).all()]
            query = query.filter(Attendance.schedule_id.in_(schedule_ids))

        # 날짜 필터
        if start_date:
            from_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Attendance.recorded_at >= from_dt)

        if end_date:
            to_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Attendance.recorded_at < to_dt)

        # 조회
        attendances = query.order_by(Attendance.recorded_at.desc()).all()

        # 응답 변환
        items = [AttendanceService._to_attendance_out(db, att) for att in attendances]

        return AttendanceListResponse(
            items=items,
            total=len(items)
        )

    @staticmethod
    def get_attendance_stats(
        db: Session,
        user: User,
        group_id: str,
        student_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> AttendanceStatsResponse:
        """
        출결 통계 조회
        API 명세서 6.4.3 기반

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            group_id: 그룹 ID
            student_id: 학생 ID (선택, 특정 학생 통계)
            start_date: 시작 날짜 (YYYY-MM-DD, 선택)
            end_date: 종료 날짜 (YYYY-MM-DD, 선택)

        Returns:
            AttendanceStatsResponse: 출결 통계
        """
        # 그룹 멤버십 확인
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

        # 날짜 범위 설정 (기본값: 당월)
        if not start_date:
            start_date = datetime.utcnow().replace(day=1).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.utcnow().strftime("%Y-%m-%d")

        # 해당 그룹의 일정 ID 목록
        schedule_ids = [s.id for s in db.query(Schedule.id).filter(Schedule.group_id == group_id).all()]

        # 출결 쿼리
        query = db.query(Attendance).filter(Attendance.schedule_id.in_(schedule_ids))

        if student_id:
            query = query.filter(Attendance.student_id == student_id)

        # 날짜 필터
        from_dt = datetime.strptime(start_date, "%Y-%m-%d")
        to_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(
            and_(
                Attendance.recorded_at >= from_dt,
                Attendance.recorded_at < to_dt
            )
        )

        attendances = query.all()

        # 통계 계산
        total_sessions = len(attendances)
        present_count = len([a for a in attendances if a.status == AttendanceStatus.PRESENT])
        late_count = len([a for a in attendances if a.status == AttendanceStatus.LATE])
        early_leave_count = len([a for a in attendances if a.status == AttendanceStatus.EARLY_LEAVE])
        absent_count = len([a for a in attendances if a.status == AttendanceStatus.ABSENT])

        # 출석률 계산: (출석 + 지각 + 조퇴) / 전체 * 100
        # F-004 비즈니스 규칙: 결석만 제외
        if total_sessions > 0:
            attendance_rate = ((present_count + late_count + early_leave_count) / total_sessions) * 100
        else:
            attendance_rate = 0.0

        stats = AttendanceStats(
            total_sessions=total_sessions,
            present=present_count,
            late=late_count,
            early_leave=early_leave_count,
            absent=absent_count,
            attendance_rate=round(attendance_rate, 1)
        )

        # 최근 기록 (최대 10개)
        recent_attendances = sorted(attendances, key=lambda a: a.recorded_at, reverse=True)[:10]
        recent_records = []
        for att in recent_attendances:
            schedule = db.query(Schedule).filter(Schedule.id == att.schedule_id).first()
            if schedule:
                recent_records.append(
                    RecentAttendanceRecord(
                        schedule_id=att.schedule_id,
                        date=schedule.start_at.strftime("%Y-%m-%d"),
                        status=att.status.value,
                        notes=att.memo
                    )
                )

        # 학생 정보 (특정 학생 통계일 경우)
        student_info = None
        if student_id:
            student = db.query(User).filter(User.id == student_id).first()
            if student:
                student_info = StudentInfo(user_id=student.id, name=student.name)

        return AttendanceStatsResponse(
            student=student_info,
            period={"start_date": start_date, "end_date": end_date},
            stats=stats,
            recent_records=recent_records
        )

    @staticmethod
    def _to_attendance_out(db: Session, attendance: Attendance) -> AttendanceOut:
        """
        Attendance 모델을 AttendanceOut 스키마로 변환

        Args:
            db: 데이터베이스 세션
            attendance: Attendance 모델

        Returns:
            AttendanceOut: 응답 스키마
        """
        # 학생 정보 가져오기
        student = db.query(User).filter(User.id == attendance.student_id).first()
        student_info = None
        if student:
            student_info = StudentInfo(user_id=student.id, name=student.name)

        return AttendanceOut(
            attendance_id=attendance.id,
            schedule_id=attendance.schedule_id,
            student_id=attendance.student_id,
            student=student_info,
            status=attendance.status.value,
            late_minutes=attendance.late_minutes,
            notes=attendance.memo,  # memo → notes 변환
            recorded_at=attendance.recorded_at.isoformat() if attendance.recorded_at else "",
            updated_at=attendance.updated_at.isoformat() if attendance.updated_at else None,
        )
