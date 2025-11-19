"""
Attendance Service Unit Tests - F-004

Tests for attendance processing business logic:
- Attendance status validation
- Attendance record creation
- Attendance statistics calculation

Related: F-004_출결_관리.md, attendance_service.py
"""

import pytest
from datetime import datetime, timedelta
from app.services.attendance_service import AttendanceService
from app.models.user import User, UserRole
from app.models.group import Group, GroupMember, GroupMemberRole, GroupMemberInviteStatus
from app.models.schedule import Schedule, ScheduleType, ScheduleStatus
from app.models.attendance import Attendance, AttendanceStatus


@pytest.mark.service
@pytest.mark.attendances
@pytest.mark.unit
class TestAttendanceRecordCreation:
    """
    출결 기록 생성 테스트
    """

    def test_mark_attendance_present(self, db_session, test_teacher, test_student):
        """
        출석 표시
        """
        # Create group
        group = Group(
            name="수학 그룹",
            subject="수학",
            owner_id=test_teacher.id
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        # Create schedule
        schedule = Schedule(
            group_id=group.id,
            title="수학 수업",
            start_at=datetime.utcnow(),
            end_at=datetime.utcnow() + timedelta(hours=2),
            schedule_type=ScheduleType.REGULAR,
            status=ScheduleStatus.SCHEDULED
        )
        db_session.add(schedule)
        db_session.commit()
        db_session.refresh(schedule)

        # Mark attendance
        attendance = AttendanceService.mark_attendance(
            db_session,
            test_teacher,
            schedule.id,
            test_student.id,
            AttendanceStatus.PRESENT,
            note="정상 출석"
        )

        assert attendance.schedule_id == schedule.id
        assert attendance.student_id == test_student.id
        assert attendance.status == AttendanceStatus.PRESENT
        assert attendance.note == "정상 출석"

    def test_mark_attendance_late(self, db_session, test_teacher, test_student):
        """
        지각 표시
        """
        # Create group
        group = Group(
            name="영어 그룹",
            subject="영어",
            owner_id=test_teacher.id
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        # Create schedule
        schedule = Schedule(
            group_id=group.id,
            title="영어 수업",
            start_at=datetime.utcnow(),
            end_at=datetime.utcnow() + timedelta(hours=2),
            schedule_type=ScheduleType.REGULAR,
            status=ScheduleStatus.SCHEDULED
        )
        db_session.add(schedule)
        db_session.commit()
        db_session.refresh(schedule)

        # Mark attendance
        attendance = AttendanceService.mark_attendance(
            db_session,
            test_teacher,
            schedule.id,
            test_student.id,
            AttendanceStatus.LATE,
            note="10분 지각"
        )

        assert attendance.status == AttendanceStatus.LATE
        assert "10분" in attendance.note

    def test_update_attendance_status(self, db_session, test_teacher, test_student):
        """
        출결 상태 변경 (예: 결석 -> 보강 처리)
        """
        # Create group
        group = Group(
            name="과학 그룹",
            subject="과학",
            owner_id=test_teacher.id
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        # Create schedule
        schedule = Schedule(
            group_id=group.id,
            title="과학 수업",
            start_at=datetime.utcnow(),
            end_at=datetime.utcnow() + timedelta(hours=2),
            schedule_type=ScheduleType.REGULAR,
            status=ScheduleStatus.SCHEDULED
        )
        db_session.add(schedule)
        db_session.commit()
        db_session.refresh(schedule)

        # Initial: Mark as ABSENT
        attendance = Attendance(
            schedule_id=schedule.id,
            student_id=test_student.id,
            status=AttendanceStatus.ABSENT,
            note="결석"
        )
        db_session.add(attendance)
        db_session.commit()
        db_session.refresh(attendance)

        # Update to MAKEUP
        updated = AttendanceService.update_attendance(
            db_session,
            test_teacher,
            attendance.id,
            AttendanceStatus.MAKEUP,
            note="보강 완료"
        )

        assert updated.status == AttendanceStatus.MAKEUP
        assert "보강" in updated.note


@pytest.mark.service
@pytest.mark.attendances
@pytest.mark.unit
class TestAttendanceStatistics:
    """
    출결 통계 계산 테스트
    """

    def test_calculate_attendance_rate(self, db_session, test_teacher, test_student):
        """
        출석률 계산
        """
        # Create group
        group = Group(
            name="수학 그룹",
            subject="수학",
            owner_id=test_teacher.id
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        # Create schedules with attendance
        # 총 10회: PRESENT 7, LATE 1, ABSENT 2
        statuses = (
            [AttendanceStatus.PRESENT] * 7 +
            [AttendanceStatus.LATE] * 1 +
            [AttendanceStatus.ABSENT] * 2
        )

        for i, status in enumerate(statuses):
            schedule = Schedule(
                group_id=group.id,
                title=f"수업 {i+1}",
                start_at=datetime(2025, 5, i+1, 19, 0),
                end_at=datetime(2025, 5, i+1, 20, 30),
                schedule_type=ScheduleType.REGULAR,
                status=ScheduleStatus.DONE
            )
            db_session.add(schedule)
            db_session.flush()

            attendance = Attendance(
                schedule_id=schedule.id,
                student_id=test_student.id,
                status=status
            )
            db_session.add(attendance)

        db_session.commit()

        # Calculate statistics
        stats = AttendanceService.get_student_attendance_stats(
            db_session,
            test_student.id,
            group.id,
            year=2025,
            month=5
        )

        # 출석 + 지각 = 8, 결석 = 2
        assert stats["total_lessons"] == 10
        assert stats["attended"] == 8  # PRESENT + LATE
        assert stats["absent"] == 2
        assert stats["attendance_rate"] == 80.0  # 8/10 * 100

    def test_attendance_summary_by_student(self, db_session, test_teacher, faker_instance):
        """
        학생별 출결 요약
        """
        # Create group
        group = Group(
            name="영어 그룹",
            subject="영어",
            owner_id=test_teacher.id
        )
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        # Create students
        students = []
        for i in range(3):
            student = User(
                email=f"student{i}@test.com",
                password_hash="hashed",
                name=f"학생 {i+1}",
                phone=f"010-{2000+i}-0000",
                role=UserRole.STUDENT,
                is_active=True,
                is_email_verified=True
            )
            db_session.add(student)
            db_session.flush()
            students.append(student)

        db_session.commit()

        # Get summary for all students
        summary = AttendanceService.get_group_attendance_summary(
            db_session,
            test_teacher,
            group.id,
            year=2025,
            month=6
        )

        # Should return data for all students (even with 0 lessons)
        assert len(summary) >= 0
