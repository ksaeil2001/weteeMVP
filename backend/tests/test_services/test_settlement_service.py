"""
Settlement Service Unit Tests - F-006

Tests for settlement calculation business logic:
- Invoice number generation
- Attended lessons calculation
- Settlement summary generation
- Invoice creation and validation

Related: F-006_수업료_정산.md, settlement_service.py
"""

import pytest
from datetime import date, datetime
from calendar import monthrange
from app.services.settlement_service import SettlementService
from app.models.user import User, UserRole
from app.models.group import Group, GroupMember, GroupMemberRole, GroupMemberInviteStatus
from app.models.schedule import Schedule, ScheduleType, ScheduleStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.invoice import Invoice, InvoiceStatus


@pytest.mark.service
@pytest.mark.settlements
@pytest.mark.unit
class TestInvoiceNumberGeneration:
    """
    청구서 번호 생성 로직 테스트
    """

    def test_generate_first_invoice_number(self, db_session):
        """
        첫 번째 청구서 번호 생성 (TUT-2025-001)
        """
        invoice_number = SettlementService.generate_invoice_number(db_session, 2025)

        assert invoice_number == "TUT-2025-001"

    def test_generate_sequential_invoice_numbers(self, db_session):
        """
        순차적인 청구서 번호 생성
        """
        # Create first invoice
        invoice1 = Invoice(
            invoice_number="TUT-2025-001",
            teacher_id="teacher-id",
            group_id="group-id",
            student_id="student-id",
            billing_period_start=date(2025, 1, 1),
            billing_period_end=date(2025, 1, 31),
            status=InvoiceStatus.DRAFT,
            lesson_unit_price=50000,
            contracted_lessons=8,
            attended_lessons=8,
            absent_lessons=0,
            amount_due=400000,
            amount_paid=0,
            discount_amount=0,
            due_date=date(2025, 2, 15)
        )
        db_session.add(invoice1)
        db_session.commit()

        # Generate next invoice number
        invoice_number = SettlementService.generate_invoice_number(db_session, 2025)

        assert invoice_number == "TUT-2025-002"

    def test_generate_invoice_number_new_year(self, db_session):
        """
        연도가 바뀌면 시퀀스가 001로 리셋
        """
        # Create 2024 invoice
        invoice_2024 = Invoice(
            invoice_number="TUT-2024-999",
            teacher_id="teacher-id",
            group_id="group-id",
            student_id="student-id",
            billing_period_start=date(2024, 12, 1),
            billing_period_end=date(2024, 12, 31),
            status=InvoiceStatus.DRAFT,
            lesson_unit_price=50000,
            contracted_lessons=8,
            attended_lessons=8,
            absent_lessons=0,
            amount_due=400000,
            amount_paid=0,
            discount_amount=0,
            due_date=date(2025, 1, 15)
        )
        db_session.add(invoice_2024)
        db_session.commit()

        # Generate 2025 invoice number
        invoice_number = SettlementService.generate_invoice_number(db_session, 2025)

        assert invoice_number == "TUT-2025-001"


@pytest.mark.service
@pytest.mark.settlements
@pytest.mark.unit
class TestAttendedLessonsCalculation:
    """
    수업 횟수 계산 로직 테스트
    """

    def test_calculate_attended_lessons_all_present(self, db_session, test_teacher, test_student):
        """
        모두 출석한 경우
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

        # Create schedules
        for i in range(4):
            schedule = Schedule(
                group_id=group.id,
                title=f"수학 수업 {i+1}",
                start_at=datetime(2025, 1, i+1, 19, 0),
                end_at=datetime(2025, 1, i+1, 20, 30),
                schedule_type=ScheduleType.REGULAR,
                status=ScheduleStatus.DONE
            )
            db_session.add(schedule)
            db_session.flush()

            # All present
            attendance = Attendance(
                schedule_id=schedule.id,
                student_id=test_student.id,
                status=AttendanceStatus.PRESENT
            )
            db_session.add(attendance)

        db_session.commit()

        # Calculate
        attended, absent = SettlementService._calculate_attended_lessons(
            db_session,
            group.id,
            test_student.id,
            date(2025, 1, 1),
            date(2025, 1, 31)
        )

        assert attended == 4
        assert absent == 0

    def test_calculate_attended_lessons_with_absences(self, db_session, test_teacher, test_student):
        """
        결석이 있는 경우
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

        # Create schedules with mixed attendance
        statuses = [
            AttendanceStatus.PRESENT,
            AttendanceStatus.ABSENT,
            AttendanceStatus.LATE,
            AttendanceStatus.PRESENT
        ]

        for i, status in enumerate(statuses):
            schedule = Schedule(
                group_id=group.id,
                title=f"영어 수업 {i+1}",
                start_at=datetime(2025, 2, i+1, 19, 0),
                end_at=datetime(2025, 2, i+1, 20, 30),
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

        # Calculate
        attended, absent = SettlementService._calculate_attended_lessons(
            db_session,
            group.id,
            test_student.id,
            date(2025, 2, 1),
            date(2025, 2, 28)
        )

        # PRESENT(1) + LATE(1) + PRESENT(1) = 3 attended
        # ABSENT(1) = 1 absent
        assert attended == 3
        assert absent == 1


@pytest.mark.service
@pytest.mark.settlements
@pytest.mark.unit
class TestSettlementSummaryGeneration:
    """
    월별 정산 요약 생성 테스트
    """

    def test_get_monthly_summary_single_student(self, db_session, test_teacher, test_student):
        """
        학생 1명에 대한 월별 정산 요약
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

        # Add student to group
        member = GroupMember(
            group_id=group.id,
            user_id=test_student.id,
            role=GroupMemberRole.STUDENT,
            invite_status=GroupMemberInviteStatus.ACCEPTED
        )
        db_session.add(member)
        db_session.commit()

        # Create schedules with attendance
        for i in range(6):
            schedule = Schedule(
                group_id=group.id,
                title=f"수학 수업 {i+1}",
                start_at=datetime(2025, 3, i+1, 19, 0),
                end_at=datetime(2025, 3, i+1, 20, 30),
                schedule_type=ScheduleType.REGULAR,
                status=ScheduleStatus.DONE
            )
            db_session.add(schedule)
            db_session.flush()

            attendance = Attendance(
                schedule_id=schedule.id,
                student_id=test_student.id,
                status=AttendanceStatus.PRESENT
            )
            db_session.add(attendance)

        db_session.commit()

        # Get summary
        summary = SettlementService.get_group_monthly_settlement_summary(
            db_session,
            test_teacher,
            group.id,
            2025,
            3
        )

        assert summary.total_students == 1
        assert summary.items[0].student_id == test_student.id
        assert summary.items[0].attended_lessons == 6
        assert summary.items[0].absent_lessons == 0
        assert summary.items[0].amount_due == 6 * 50000  # 6 lessons * 50,000원

    def test_get_monthly_summary_multiple_students(self, db_session, test_teacher, faker_instance):
        """
        여러 학생에 대한 월별 정산 요약
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

        # Create multiple students
        students = []
        for i in range(3):
            student = User(
                email=f"student{i}@test.com",
                password_hash="hashed",
                name=f"학생 {i+1}",
                phone=f"010-{1000+i}-0000",
                role=UserRole.STUDENT,
                is_active=True,
                is_email_verified=True
            )
            db_session.add(student)
            db_session.flush()

            member = GroupMember(
                group_id=group.id,
                user_id=student.id,
                role=GroupMemberRole.STUDENT,
                invite_status=GroupMemberInviteStatus.ACCEPTED
            )
            db_session.add(member)
            students.append(student)

        db_session.commit()

        # Get summary
        summary = SettlementService.get_group_monthly_settlement_summary(
            db_session,
            test_teacher,
            group.id,
            2025,
            4
        )

        assert summary.total_students == 3
        assert len(summary.items) == 3
