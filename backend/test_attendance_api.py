#!/usr/bin/env python3
"""
F-004 출결 관리 API 통합 테스트
"""

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.group import Group, GroupMember, GroupStatus, GroupMemberRole, GroupMemberInviteStatus
from app.models.schedule import Schedule, ScheduleType, ScheduleStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.core.security import hash_password
from datetime import datetime, timedelta
import uuid

db = SessionLocal()

print("🧪 F-004 출결 관리 API 테스트 데이터 생성\n")

# 1. 테스트 사용자 생성 (선생님 + 학생 2명)
print("1️⃣  사용자 생성 중...")

teacher = db.query(User).filter(User.email == "test@example.com").first()
print(f"   ✅ 선생님: {teacher.name} ({teacher.email})")

# 학생 1
student1_email = "student1@example.com"
student1 = db.query(User).filter(User.email == student1_email).first()
if not student1:
    student1 = User(
        email=student1_email,
        password_hash=hash_password("Test1234!"),
        name="김학생",
        phone="010-1111-1111",
        role=UserRole.STUDENT,
        is_active=True,
        is_email_verified=True,
        language="ko",
        timezone="Asia/Seoul",
    )
    db.add(student1)
    db.commit()
    db.refresh(student1)
    print(f"   ✅ 학생 1: {student1.name} ({student1.email})")
else:
    print(f"   ♻️  학생 1 (기존): {student1.name}")

# 학생 2
student2_email = "student2@example.com"
student2 = db.query(User).filter(User.email == student2_email).first()
if not student2:
    student2 = User(
        email=student2_email,
        password_hash=hash_password("Test1234!"),
        name="이학생",
        phone="010-2222-2222",
        role=UserRole.STUDENT,
        is_active=True,
        is_email_verified=True,
        language="ko",
        timezone="Asia/Seoul",
    )
    db.add(student2)
    db.commit()
    db.refresh(student2)
    print(f"   ✅ 학생 2: {student2.name} ({student2.email})")
else:
    print(f"   ♻️  학생 2 (기존): {student2.name}")

# 2. 그룹 생성
print("\n2️⃣  과외 그룹 생성 중...")
group_name = "고등 수학 과외"
group = db.query(Group).filter(Group.name == group_name, Group.owner_id == teacher.id).first()
if not group:
    group = Group(
        name=group_name,
        subject="수학",
        description="고등학교 수학 1:2 과외",
        owner_id=teacher.id,
        status=GroupStatus.ACTIVE,
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    print(f"   ✅ 그룹: {group.name} (ID: {group.id[:8]}...)")
else:
    print(f"   ♻️  그룹 (기존): {group.name}")

# 3. 그룹 멤버 추가
print("\n3️⃣  그룹 멤버 추가 중...")

# 선생님 멤버
teacher_member = db.query(GroupMember).filter(
    GroupMember.group_id == group.id,
    GroupMember.user_id == teacher.id
).first()
if not teacher_member:
    teacher_member = GroupMember(
        group_id=group.id,
        user_id=teacher.id,
        role=GroupMemberRole.TEACHER,
        invite_status=GroupMemberInviteStatus.ACCEPTED,
    )
    db.add(teacher_member)

# 학생 1 멤버
student1_member = db.query(GroupMember).filter(
    GroupMember.group_id == group.id,
    GroupMember.user_id == student1.id
).first()
if not student1_member:
    student1_member = GroupMember(
        group_id=group.id,
        user_id=student1.id,
        role=GroupMemberRole.STUDENT,
        invite_status=GroupMemberInviteStatus.ACCEPTED,
    )
    db.add(student1_member)

# 학생 2 멤버
student2_member = db.query(GroupMember).filter(
    GroupMember.group_id == group.id,
    GroupMember.user_id == student2.id
).first()
if not student2_member:
    student2_member = GroupMember(
        group_id=group.id,
        user_id=student2.id,
        role=GroupMemberRole.STUDENT,
        invite_status=GroupMemberInviteStatus.ACCEPTED,
    )
    db.add(student2_member)

db.commit()
print(f"   ✅ 멤버: 선생님 1명 + 학생 2명")

# 4. 수업 일정 생성
print("\n4️⃣  수업 일정 생성 중...")
schedule_title = "월요일 수학 수업"
now = datetime.now()
schedule_start = now.replace(hour=14, minute=0, second=0, microsecond=0)
schedule_end = now.replace(hour=16, minute=0, second=0, microsecond=0)

schedule = db.query(Schedule).filter(
    Schedule.group_id == group.id,
    Schedule.title == schedule_title
).first()
if not schedule:
    schedule = Schedule(
        group_id=group.id,
        title=schedule_title,
        type=ScheduleType.REGULAR,
        start_at=schedule_start,
        end_at=schedule_end,
        status=ScheduleStatus.SCHEDULED,
        location="강남역 스터디룸",
        memo="중간고사 준비",
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    print(f"   ✅ 일정: {schedule.title} ({schedule.start_at.strftime('%Y-%m-%d %H:%M')})")
else:
    print(f"   ♻️  일정 (기존): {schedule.title}")

# 5. 테스트 정보 출력
print("\n" + "="*60)
print("📋 테스트 데이터 요약")
print("="*60)
print(f"선생님 ID: {teacher.id}")
print(f"학생 1 ID: {student1.id}")
print(f"학생 2 ID: {student2.id}")
print(f"그룹 ID:   {group.id}")
print(f"일정 ID:   {schedule.id}")
print("="*60)

print("\n✅ 테스트 데이터 생성 완료!")
print("\n📝 다음 단계: 출결 API 테스트")
print(f"""
1. 배치 출결 체크:
   curl -X POST http://localhost:8000/api/v1/attendances/schedules/{schedule.id}/batch \\
     -H "Authorization: Bearer <TOKEN>" \\
     -H "Content-Type: application/json" \\
     -d '{{"attendances": [
       {{"student_id": "{student1.id}", "status": "PRESENT", "notes": "수업 집중"}},
       {{"student_id": "{student2.id}", "status": "LATE", "late_minutes": 10, "notes": "10분 지각"}}
     ]}}'

2. 일정별 출결 조회:
   curl -X GET http://localhost:8000/api/v1/attendances/schedules/{schedule.id} \\
     -H "Authorization: Bearer <TOKEN>"

3. 출결 통계 조회:
   curl -X GET "http://localhost:8000/api/v1/attendances/groups/{group.id}/stats?student_id={student1.id}" \\
     -H "Authorization: Bearer <TOKEN>"
""")

db.close()
