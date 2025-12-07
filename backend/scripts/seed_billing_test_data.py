"""
F-006 정산 대시보드 테스트 데이터 생성 스크립트

이 스크립트는 정산 대시보드 기능을 테스트하기 위한 샘플 데이터를 생성합니다.

생성 데이터:
- 선생님 계정 1개
- 학생 계정 3개
- 그룹 2개
- 수업 일정 (완료 상태)
- 출결 기록
- 청구서 (DRAFT, SENT, PAID 상태)

실행 방법:
    cd backend
    python scripts/seed_billing_test_data.py
"""

import sys
import os
from datetime import datetime, timedelta, date
from calendar import monthrange

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.models.group import Group, GroupMember, GroupMemberRole, GroupMemberInviteStatus
from app.models.schedule import Schedule, ScheduleType, ScheduleStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.invoice import Invoice, InvoiceStatus, BillingType, Payment, PaymentStatus, PaymentMethod, Transaction, TransactionType
from app.core.security import hash_password
import uuid


def clear_billing_data(db):
    """기존 테스트 데이터 삭제"""
    print("🗑️  기존 테스트 데이터 삭제 중...")

    # 순서 중요: 외래 키 제약 조건 때문에
    db.query(Transaction).delete()
    db.query(Payment).delete()
    db.query(Invoice).delete()
    db.query(Attendance).delete()
    db.query(Schedule).delete()
    db.query(GroupMember).delete()
    db.query(Group).delete()

    # 테스트 사용자 삭제 (이메일 기준)
    test_emails = [
        'teacher.test@wetee.com',
        'student1.test@wetee.com',
        'student2.test@wetee.com',
        'student3.test@wetee.com',
    ]
    for email in test_emails:
        db.query(User).filter(User.email == email).delete()

    db.commit()
    print("✅ 기존 데이터 삭제 완료")


def create_test_users(db):
    """테스트 사용자 생성"""
    print("\n👥 테스트 사용자 생성 중...")

    # 선생님
    teacher = User(
        id=str(uuid.uuid4()),
        email='teacher.test@wetee.com',
        password_hash=hash_password('password123'),
        name='김선생',
        phone='010-1234-5678',
        role=UserRole.TEACHER,
        is_email_verified=True,
        email_verified_at=datetime.utcnow()
    )
    db.add(teacher)

    # 학생들
    students = []
    for i in range(1, 4):
        student = User(
            id=str(uuid.uuid4()),
            email=f'student{i}.test@wetee.com',
            password_hash=hash_password('password123'),
            name=f'학생{i}',
            phone=f'010-2000-000{i}',
            role=UserRole.STUDENT,
            is_email_verified=True,
            email_verified_at=datetime.utcnow()
        )
        students.append(student)
        db.add(student)

    db.commit()

    print(f"✅ 선생님: {teacher.name} ({teacher.email})")
    for s in students:
        print(f"✅ 학생: {s.name} ({s.email})")

    return teacher, students


def create_test_groups(db, teacher, students):
    """테스트 그룹 생성"""
    print("\n📚 테스트 그룹 생성 중...")

    # 그룹 1: 수학 과외 (학생 2명)
    group1 = Group(
        id=str(uuid.uuid4()),
        name='중3 수학 과외',
        subject='수학',
        owner_id=teacher.id,
        description='중학교 3학년 수학 과외 그룹',
        created_at=datetime.utcnow()
    )
    db.add(group1)

    # 그룹 1 멤버
    for student in students[:2]:  # 학생 1, 2
        member = GroupMember(
            id=str(uuid.uuid4()),
            group_id=group1.id,
            user_id=student.id,
            role=GroupMemberRole.STUDENT,
            invite_status=GroupMemberInviteStatus.ACCEPTED,
            joined_at=datetime.utcnow()
        )
        db.add(member)

    # 그룹 2: 영어 과외 (학생 1명)
    group2 = Group(
        id=str(uuid.uuid4()),
        name='고1 영어 과외',
        subject='영어',
        owner_id=teacher.id,
        description='고등학교 1학년 영어 과외',
        created_at=datetime.utcnow()
    )
    db.add(group2)

    # 그룹 2 멤버
    member = GroupMember(
        id=str(uuid.uuid4()),
        group_id=group2.id,
        user_id=students[2].id,  # 학생 3
        role=GroupMemberRole.STUDENT,
        invite_status=GroupMemberInviteStatus.ACCEPTED,
        joined_at=datetime.utcnow()
    )
    db.add(member)

    db.commit()

    print(f"✅ 그룹 1: {group1.name} (학생 2명)")
    print(f"✅ 그룹 2: {group2.name} (학생 1명)")

    return [group1, group2]


def create_test_schedules_and_attendance(db, groups, students):
    """테스트 수업 일정 및 출결 생성 (지난 달 데이터)"""
    print("\n📅 테스트 수업 일정 및 출결 생성 중...")

    # 지난 달 계산
    today = date.today()
    if today.month == 1:
        last_month_year = today.year - 1
        last_month = 12
    else:
        last_month_year = today.year
        last_month = today.month - 1

    _, last_day = monthrange(last_month_year, last_month)

    schedules_created = 0
    attendance_created = 0

    # 그룹 1: 주 2회 (월, 목) - 8회 수업
    group1 = groups[0]
    group1_students = students[:2]

    # 지난 달의 모든 월요일과 목요일 찾기
    current_date = date(last_month_year, last_month, 1)
    lesson_dates = []

    while current_date.month == last_month:
        if current_date.weekday() in [0, 3]:  # 월요일(0), 목요일(3)
            lesson_dates.append(current_date)
        current_date += timedelta(days=1)

    for lesson_date in lesson_dates[:8]:  # 최대 8회
        schedule = Schedule(
            id=str(uuid.uuid4()),
            group_id=group1.id,
            title=f'{lesson_date.strftime("%m/%d")} 수학 수업',
            start_at=datetime.combine(lesson_date, datetime.min.time().replace(hour=16, minute=0)),
            end_at=datetime.combine(lesson_date, datetime.min.time().replace(hour=18, minute=0)),
            type=ScheduleType.REGULAR,
            status=ScheduleStatus.DONE,
            created_at=datetime.utcnow()
        )
        db.add(schedule)
        schedules_created += 1

        # 출결 기록
        for student in group1_students:
            attendance = Attendance(
                id=str(uuid.uuid4()),
                schedule_id=schedule.id,
                student_id=student.id,
                status=AttendanceStatus.PRESENT,
                created_at=datetime.utcnow()
            )
            db.add(attendance)
            attendance_created += 1

    # 그룹 2: 주 1회 (수요일) - 4회 수업
    group2 = groups[1]
    group2_student = students[2]

    current_date = date(last_month_year, last_month, 1)
    lesson_dates = []

    while current_date.month == last_month:
        if current_date.weekday() == 2:  # 수요일(2)
            lesson_dates.append(current_date)
        current_date += timedelta(days=1)

    for lesson_date in lesson_dates[:4]:  # 최대 4회
        schedule = Schedule(
            id=str(uuid.uuid4()),
            group_id=group2.id,
            title=f'{lesson_date.strftime("%m/%d")} 영어 수업',
            start_at=datetime.combine(lesson_date, datetime.min.time().replace(hour=19, minute=0)),
            end_at=datetime.combine(lesson_date, datetime.min.time().replace(hour=21, minute=0)),
            type=ScheduleType.REGULAR,
            status=ScheduleStatus.DONE,
            created_at=datetime.utcnow()
        )
        db.add(schedule)
        schedules_created += 1

        attendance = Attendance(
            id=str(uuid.uuid4()),
            schedule_id=schedule.id,
            student_id=group2_student.id,
            status=AttendanceStatus.PRESENT,
            created_at=datetime.utcnow()
        )
        db.add(attendance)
        attendance_created += 1

    db.commit()

    print(f"✅ 수업 일정 {schedules_created}개 생성")
    print(f"✅ 출결 기록 {attendance_created}개 생성")

    return last_month_year, last_month


def create_test_invoices(db, teacher, groups, students, year, month):
    """테스트 청구서 생성"""
    print("\n💰 테스트 청구서 생성 중...")

    _, last_day = monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)

    invoices_created = 0

    # 학생 1: 결제 완료 (PAID)
    invoice1 = Invoice(
        id=str(uuid.uuid4()),
        invoice_number=f'TUT-{year}-{str(invoices_created + 1).zfill(3)}',
        teacher_id=teacher.id,
        group_id=groups[0].id,
        student_id=students[0].id,
        billing_period_start=start_date,
        billing_period_end=end_date,
        billing_type=BillingType.POSTPAID,
        status=InvoiceStatus.PAID,
        lesson_unit_price=50000,
        contracted_lessons=8,
        attended_lessons=8,
        absent_lessons=0,
        amount_due=400000,
        amount_paid=400000,
        discount_amount=0,
        due_date=end_date + timedelta(days=30),
        sent_at=datetime.combine(end_date, datetime.min.time()),
        paid_at=datetime.combine(end_date + timedelta(days=5), datetime.min.time()),
        created_at=datetime.utcnow()
    )
    db.add(invoice1)
    invoices_created += 1

    # 결제 기록
    payment1 = Payment(
        id=str(uuid.uuid4()),
        invoice_id=invoice1.id,
        method=PaymentMethod.BANK_TRANSFER,
        status=PaymentStatus.SUCCESS,
        amount=400000,
        requested_at=datetime.combine(end_date + timedelta(days=5), datetime.min.time()),
        approved_at=datetime.combine(end_date + timedelta(days=5), datetime.min.time()),
    )
    db.add(payment1)

    # 학생 2: 발행됨 (SENT) - 미결제
    invoice2 = Invoice(
        id=str(uuid.uuid4()),
        invoice_number=f'TUT-{year}-{str(invoices_created + 1).zfill(3)}',
        teacher_id=teacher.id,
        group_id=groups[0].id,
        student_id=students[1].id,
        billing_period_start=start_date,
        billing_period_end=end_date,
        billing_type=BillingType.POSTPAID,
        status=InvoiceStatus.SENT,
        lesson_unit_price=50000,
        contracted_lessons=8,
        attended_lessons=8,
        absent_lessons=0,
        amount_due=400000,
        amount_paid=0,
        discount_amount=0,
        due_date=end_date + timedelta(days=30),
        sent_at=datetime.combine(end_date, datetime.min.time()),
        created_at=datetime.utcnow()
    )
    db.add(invoice2)
    invoices_created += 1

    # 학생 3: 청구서 미발행 (그룹에는 속해있지만 청구서 없음)
    # 이 학생은 대시보드에 표시되어야 함 (청구서 없는 학생 테스트용)

    db.commit()

    print(f"✅ 청구서 {invoices_created}개 생성")
    print(f"   - 학생 1 ({students[0].name}): PAID (결제 완료)")
    print(f"   - 학생 2 ({students[1].name}): SENT (발행됨, 미결제)")
    print(f"   - 학생 3 ({students[2].name}): 청구서 없음 (대시보드 표시 테스트용)")


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("🚀 F-006 정산 대시보드 테스트 데이터 생성 스크립트")
    print("=" * 60)

    db = SessionLocal()

    try:
        # 1. 기존 데이터 삭제
        clear_billing_data(db)

        # 2. 테스트 사용자 생성
        teacher, students = create_test_users(db)

        # 3. 테스트 그룹 생성
        groups = create_test_groups(db, teacher, students)

        # 4. 수업 일정 및 출결 생성 (지난 달)
        year, month = create_test_schedules_and_attendance(db, groups, students)

        # 5. 청구서 생성
        create_test_invoices(db, teacher, groups, students, year, month)

        print("\n" + "=" * 60)
        print("✅ 테스트 데이터 생성 완료!")
        print("=" * 60)
        print("\n📌 테스트 계정 정보:")
        print(f"   - 선생님: teacher.test@wetee.com / password123")
        print(f"   - 학생 1: student1.test@wetee.com / password123")
        print(f"   - 학생 2: student2.test@wetee.com / password123")
        print(f"   - 학생 3: student3.test@wetee.com / password123")
        print(f"\n📅 테스트 데이터 기간: {year}년 {month}월")
        print(f"\n🌐 테스트 방법:")
        print(f"   1. 백엔드 실행: cd backend && python -m uvicorn app.main:app --reload")
        print(f"   2. 프론트엔드 실행: cd frontend && npm run dev")
        print(f"   3. 선생님 계정으로 로그인")
        print(f"   4. /billing 페이지에서 {year}년 {month}월 선택")
        print(f"   5. 학생 3명의 정산 카드 확인 (청구서 없는 학생 포함)")

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == '__main__':
    main()
