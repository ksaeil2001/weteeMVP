"""
Settlement Service - F-006 수업료 정산 비즈니스 로직
청구서 생성, 정산 계산, 결제 관리
"""

from datetime import datetime, date, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, extract
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from calendar import monthrange

from app.models.invoice import (
    Invoice, InvoiceStatus, BillingType,
    Payment, PaymentStatus, PaymentMethod,
    Transaction, TransactionType
)
from app.models.group import Group, GroupMember, GroupMemberRole, GroupMemberInviteStatus
from app.models.schedule import Schedule, ScheduleType, ScheduleStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.user import User, UserRole
from app.schemas.invoice import (
    InvoiceCreateRequest,
    InvoiceDetailResponse,
    InvoiceBasicInfo,
    InvoiceListResponse,
    SettlementSummaryItem,
    SettlementSummaryResponse,
    BillingPeriod,
    StudentInfo,
    PaymentCreateRequest,
    PaymentResponse,
)
from app.services.notification_service import NotificationService


class SettlementService:
    """
    정산 서비스 레이어
    F-006: 수업료 정산
    """

    # Constants
    DEFAULT_LESSON_UNIT_PRICE = 50000  # 기본 수업료 (원)
    DEFAULT_DUE_DAYS = 30  # 청구서 발송 후 기본 지불 기한 (일)
    MIN_INVOICE_AMOUNT = 10000  # 최소 청구 금액 (F-006: 1만원 미만은 이월)

    @staticmethod
    def _check_teacher_permission(db: Session, user: User, group_id: str) -> Group:
        """
        선생님 권한 확인 (청구서 생성/발송은 TEACHER만 가능)

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            group_id: 그룹 ID

        Returns:
            Group: 그룹 객체

        Raises:
            HTTPException: 권한이 없거나 그룹이 없는 경우
        """
        # 그룹 존재 확인
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "GROUP_NOT_FOUND", "message": "그룹을 찾을 수 없습니다."}
            )

        # 선생님 권한 확인 (그룹 소유자만)
        if group.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "청구서는 선생님만 생성할 수 있습니다."}
            )

        return group

    @staticmethod
    def _calculate_attended_lessons(
        db: Session,
        group_id: str,
        student_id: str,
        start_date: date,
        end_date: date
    ) -> Tuple[int, int]:
        """
        기간 내 실제 진행 수업 횟수 및 결석 횟수 계산

        Args:
            db: 데이터베이스 세션
            group_id: 그룹 ID
            student_id: 학생 ID
            start_date: 시작일
            end_date: 종료일

        Returns:
            Tuple[int, int]: (attended_lessons, absent_lessons)

        Business Logic (F-006):
        - 출석(PRESENT), 지각(LATE), 조퇴(EARLY_LEAVE): 1회로 계산
        - 결석(ABSENT): 0회 (카운트하지 않음)
        - 보강(MAKEUP) 수업도 포함
        """
        # 기간 내 일정 조회
        schedules = db.query(Schedule).filter(
            Schedule.group_id == group_id,
            Schedule.start_at >= datetime.combine(start_date, datetime.min.time()),
            Schedule.start_at <= datetime.combine(end_date, datetime.max.time()),
            Schedule.status == ScheduleStatus.DONE,  # 완료된 일정만
        ).all()

        attended_lessons = 0
        absent_lessons = 0

        for schedule in schedules:
            # 해당 학생의 출결 기록 조회
            attendance = db.query(Attendance).filter(
                Attendance.schedule_id == schedule.id,
                Attendance.student_id == student_id,
            ).first()

            if attendance:
                if attendance.status == AttendanceStatus.ABSENT:
                    absent_lessons += 1
                else:
                    # PRESENT, LATE, EARLY_LEAVE는 모두 출석으로 간주
                    attended_lessons += 1

        return attended_lessons, absent_lessons

    @staticmethod
    def _get_lesson_unit_price(group: Group) -> int:
        """
        그룹의 수업료 단가 조회

        TODO(F-006): Group 모델에 lesson_unit_price 필드 추가
        현재는 기본값 사용

        Args:
            group: 그룹 객체

        Returns:
            int: 수업 1회당 단가 (원)
        """
        # TODO: Group 모델에 lesson_unit_price 필드가 추가되면 해당 값 사용
        # return group.lesson_unit_price or SettlementService.DEFAULT_LESSON_UNIT_PRICE
        return SettlementService.DEFAULT_LESSON_UNIT_PRICE

    @staticmethod
    def _get_contracted_lessons(group: Group, year: int, month: int) -> int:
        """
        그룹의 월간 약정 수업 횟수 조회

        TODO(F-006): Group 모델에 contracted_lessons_per_month 필드 추가
        현재는 8회 기본값 사용

        Args:
            group: 그룹 객체
            year: 연도
            month: 월

        Returns:
            int: 약정 수업 횟수
        """
        # TODO: Group 모델에 contracted_lessons_per_month 필드가 추가되면 해당 값 사용
        # return group.contracted_lessons_per_month or 8
        return 8

    @staticmethod
    def generate_invoice_number(db: Session, year: int) -> str:
        """
        청구서 번호 생성

        Format: TUT-YYYY-NNN
        예: TUT-2025-001, TUT-2025-002

        Business Rule (F-006):
        - 연도별 시퀀스, 전체 시스템에서 unique
        - 3자리 고정 (001, 002, ..., 999)
        - 10,000번째부터는 4자리로 자동 확장

        Args:
            db: 데이터베이스 세션
            year: 연도

        Returns:
            str: 청구서 번호
        """
        # 해당 연도의 마지막 청구서 조회
        last_invoice = db.query(Invoice).filter(
            Invoice.invoice_number.like(f"TUT-{year}-%")
        ).order_by(desc(Invoice.invoice_number)).first()

        if last_invoice:
            # 기존 번호에서 시퀀스 추출
            parts = last_invoice.invoice_number.split("-")
            if len(parts) == 3:
                last_seq = int(parts[2])
                next_seq = last_seq + 1
            else:
                next_seq = 1
        else:
            next_seq = 1

        # 시퀀스 번호 포맷팅 (3자리 고정, 10000 이상이면 자동 확장)
        if next_seq < 1000:
            seq_str = f"{next_seq:03d}"
        else:
            seq_str = str(next_seq)

        return f"TUT-{year}-{seq_str}"

    @staticmethod
    def get_group_monthly_settlement_summary(
        db: Session,
        user: User,
        group_id: str,
        year: int,
        month: int
    ) -> SettlementSummaryResponse:
        """
        그룹 월간 정산 요약 조회

        GET /api/v1/settlements/groups/{group_id}/summary?year=YYYY&month=MM

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (TEACHER만 가능)
            group_id: 그룹 ID
            year: 정산 연도
            month: 정산 월 (1-12)

        Returns:
            SettlementSummaryResponse: 정산 요약

        Raises:
            HTTPException: 권한이 없거나 그룹이 없는 경우
        """
        # 선생님 권한 확인
        group = SettlementService._check_teacher_permission(db, user, group_id)

        # 기간 계산 (해당 월의 1일 ~ 말일)
        _, last_day = monthrange(year, month)
        start_date = date(year, month, 1)
        end_date = date(year, month, last_day)

        # 그룹 멤버 조회 (학생만)
        members = db.query(GroupMember).join(User).filter(
            GroupMember.group_id == group_id,
            GroupMember.role == GroupMemberRole.STUDENT,
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        ).all()

        items = []
        total_amount_due = 0

        for member in members:
            # 학생 정보 조회
            student = db.query(User).filter(User.id == member.user_id).first()
            if not student:
                continue

            # 수업료 단가 및 약정 횟수
            lesson_unit_price = SettlementService._get_lesson_unit_price(group)
            contracted_lessons = SettlementService._get_contracted_lessons(group, year, month)

            # 실제 진행 수업 횟수 계산
            attended_lessons, absent_lessons = SettlementService._calculate_attended_lessons(
                db, group_id, student.id, start_date, end_date
            )

            # 청구 금액 계산
            amount_due = attended_lessons * lesson_unit_price

            # 기존 청구서 존재 여부 확인
            existing_invoice = db.query(Invoice).filter(
                Invoice.group_id == group_id,
                Invoice.student_id == student.id,
                Invoice.billing_period_start == start_date,
                Invoice.billing_period_end == end_date,
                Invoice.status != InvoiceStatus.CANCELED,
            ).first()

            items.append(SettlementSummaryItem(
                student_id=student.id,
                student_name=student.name,
                contracted_lessons=contracted_lessons,
                attended_lessons=attended_lessons,
                absent_lessons=absent_lessons,
                lesson_unit_price=lesson_unit_price,
                amount_due=amount_due,
                has_existing_invoice=existing_invoice is not None,
            ))

            total_amount_due += amount_due

        return SettlementSummaryResponse(
            group_id=group_id,
            year=year,
            month=month,
            items=items,
            total_amount_due=total_amount_due,
            total_students=len(items),
        )

    @staticmethod
    def create_or_update_invoice_for_period(
        db: Session,
        user: User,
        group_id: str,
        payload: InvoiceCreateRequest
    ) -> InvoiceDetailResponse:
        """
        특정 학생·기간 청구서 생성 또는 갱신

        POST /api/v1/groups/{group_id}/invoices

        Business Logic (F-006):
        - 한 학생·한 그룹·한 기간에 대해 유효한 청구서는 1개만 유지
        - 재발행 시 기존 Invoice는 CANCELED 처리 후 새 Invoice 발행
        - 최소 청구 금액 미만(1만원)이면 다음 달로 이월

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (TEACHER만 가능)
            group_id: 그룹 ID
            payload: InvoiceCreateRequest

        Returns:
            InvoiceDetailResponse: 생성된 청구서 상세

        Raises:
            HTTPException: 권한이 없거나 데이터가 유효하지 않은 경우
        """
        # 선생님 권한 확인
        group = SettlementService._check_teacher_permission(db, user, group_id)

        # 학생 확인 (그룹 멤버인지)
        student_membership = db.query(GroupMember).join(User).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == payload.student_id,
            GroupMember.role == GroupMemberRole.STUDENT,
            GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
        ).first()

        if not student_membership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "STUDENT_NOT_FOUND", "message": "해당 학생을 그룹에서 찾을 수 없습니다."}
            )

        student = db.query(User).filter(User.id == payload.student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "STUDENT_NOT_FOUND", "message": "학생을 찾을 수 없습니다."}
            )

        # 기간 계산
        _, last_day = monthrange(payload.year, payload.month)
        start_date = date(payload.year, payload.month, 1)
        end_date = date(payload.year, payload.month, last_day)

        # 기존 청구서 확인
        existing_invoice = db.query(Invoice).filter(
            Invoice.group_id == group_id,
            Invoice.student_id == payload.student_id,
            Invoice.billing_period_start == start_date,
            Invoice.billing_period_end == end_date,
            Invoice.status != InvoiceStatus.CANCELED,
        ).first()

        if existing_invoice:
            # 기존 청구서 취소 처리
            existing_invoice.status = InvoiceStatus.CANCELED
            existing_invoice.updated_at = datetime.utcnow()
            db.commit()

        # 정산 계산
        lesson_unit_price = SettlementService._get_lesson_unit_price(group)
        contracted_lessons = SettlementService._get_contracted_lessons(group, payload.year, payload.month)
        attended_lessons, absent_lessons = SettlementService._calculate_attended_lessons(
            db, group_id, payload.student_id, start_date, end_date
        )

        # 청구 금액 계산
        amount_due = attended_lessons * lesson_unit_price

        # 최소 청구 금액 확인
        if amount_due < SettlementService.MIN_INVOICE_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "AMOUNT_TOO_LOW",
                    "message": f"청구 금액이 최소 금액({SettlementService.MIN_INVOICE_AMOUNT:,}원) 미만입니다. 다음 달로 이월하세요."
                }
            )

        # 청구서 번호 생성
        invoice_number = SettlementService.generate_invoice_number(db, payload.year)

        # 지불 기한 계산 (발송일로부터 30일)
        due_date = date.today() + timedelta(days=SettlementService.DEFAULT_DUE_DAYS)

        # 청구서 생성
        new_invoice = Invoice(
            invoice_number=invoice_number,
            teacher_id=user.id,
            group_id=group_id,
            student_id=payload.student_id,
            billing_period_start=start_date,
            billing_period_end=end_date,
            billing_type=BillingType(payload.billing_type),
            status=InvoiceStatus.DRAFT,
            lesson_unit_price=lesson_unit_price,
            contracted_lessons=contracted_lessons,
            attended_lessons=attended_lessons,
            absent_lessons=absent_lessons,
            amount_due=amount_due,
            amount_paid=0,
            discount_amount=0,
            due_date=due_date,
        )

        db.add(new_invoice)
        db.commit()
        db.refresh(new_invoice)

        # Transaction 생성 (CHARGE)
        transaction = Transaction(
            invoice_id=new_invoice.id,
            type=TransactionType.CHARGE,
            amount=amount_due,
            note=f"{payload.year}년 {payload.month}월 정규 수업 청구"
        )
        db.add(transaction)
        db.commit()

        # 응답 생성
        return InvoiceDetailResponse(
            invoice_id=new_invoice.id,
            invoice_number=new_invoice.invoice_number,
            teacher_id=new_invoice.teacher_id,
            group_id=new_invoice.group_id,
            student=StudentInfo(user_id=student.id, name=student.name),
            billing_period=BillingPeriod(start_date=start_date, end_date=end_date),
            billing_type=new_invoice.billing_type.value,
            status=new_invoice.status.value,
            lesson_unit_price=new_invoice.lesson_unit_price,
            contracted_lessons=new_invoice.contracted_lessons,
            attended_lessons=new_invoice.attended_lessons,
            absent_lessons=new_invoice.absent_lessons,
            amount_due=new_invoice.amount_due,
            amount_paid=new_invoice.amount_paid,
            discount_amount=new_invoice.discount_amount,
            due_date=new_invoice.due_date,
            memo=new_invoice.memo,
            created_at=new_invoice.created_at,
            updated_at=new_invoice.updated_at,
            sent_at=new_invoice.sent_at,
            paid_at=new_invoice.paid_at,
        )

    @staticmethod
    def get_invoice_detail(
        db: Session,
        user: User,
        invoice_id: str
    ) -> InvoiceDetailResponse:
        """
        청구서 상세 조회

        GET /api/v1/invoices/{invoice_id}

        권한:
        - TEACHER: 자신이 발행한 청구서만
        - 학부모/학생: 본인 관련 청구서만

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            invoice_id: 청구서 ID

        Returns:
            InvoiceDetailResponse: 청구서 상세

        Raises:
            HTTPException: 청구서가 없거나 권한이 없는 경우
        """
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "INVOICE_NOT_FOUND", "message": "청구서를 찾을 수 없습니다."}
            )

        # 권한 확인
        if user.role == UserRole.TEACHER:
            if invoice.teacher_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"code": "PERMISSION_DENIED", "message": "자신이 발행한 청구서만 조회할 수 있습니다."}
                )
        else:
            # 학부모/학생: 본인 관련 청구서만
            if invoice.student_id != user.id:
                # TODO: 학부모의 경우 자녀 청구서도 조회 가능하도록 확장
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"code": "PERMISSION_DENIED", "message": "본인 관련 청구서만 조회할 수 있습니다."}
                )

        # 학생 정보 조회
        student = db.query(User).filter(User.id == invoice.student_id).first()

        return InvoiceDetailResponse(
            invoice_id=invoice.id,
            invoice_number=invoice.invoice_number,
            teacher_id=invoice.teacher_id,
            group_id=invoice.group_id,
            student=StudentInfo(user_id=student.id, name=student.name) if student else StudentInfo(user_id=invoice.student_id, name="Unknown"),
            billing_period=BillingPeriod(
                start_date=invoice.billing_period_start,
                end_date=invoice.billing_period_end
            ),
            billing_type=invoice.billing_type.value,
            status=invoice.status.value,
            lesson_unit_price=invoice.lesson_unit_price,
            contracted_lessons=invoice.contracted_lessons,
            attended_lessons=invoice.attended_lessons,
            absent_lessons=invoice.absent_lessons,
            amount_due=invoice.amount_due,
            amount_paid=invoice.amount_paid,
            discount_amount=invoice.discount_amount,
            due_date=invoice.due_date,
            memo=invoice.memo,
            created_at=invoice.created_at,
            updated_at=invoice.updated_at,
            sent_at=invoice.sent_at,
            paid_at=invoice.paid_at,
        )

    @staticmethod
    def send_invoice(
        db: Session,
        user: User,
        invoice_id: str
    ) -> InvoiceDetailResponse:
        """
        청구서 발송 (DRAFT → SENT)

        POST /api/v1/invoices/{invoice_id}/send

        Business Logic (F-006):
        - 청구서 상태를 DRAFT → SENT로 변경
        - sent_at 타임스탬프 기록
        - 학부모/학생에게 F-008 알림 발송
        - TEACHER만 가능

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (TEACHER만 가능)
            invoice_id: 청구서 ID

        Returns:
            InvoiceDetailResponse: 발송된 청구서 상세

        Raises:
            HTTPException: 권한이 없거나 청구서가 없거나 이미 발송된 경우
        """
        # 청구서 조회
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "INVOICE_NOT_FOUND", "message": "청구서를 찾을 수 없습니다."}
            )

        # 선생님 권한 확인
        if invoice.teacher_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "자신이 발행한 청구서만 발송할 수 있습니다."}
            )

        # 상태 확인 (DRAFT만 발송 가능)
        if invoice.status != InvoiceStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_STATUS",
                    "message": f"DRAFT 상태의 청구서만 발송할 수 있습니다. 현재 상태: {invoice.status.value}"
                }
            )

        # 상태 변경
        invoice.status = InvoiceStatus.SENT
        invoice.sent_at = datetime.utcnow()
        invoice.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(invoice)

        # F-008: 알림 발송 (학생 + 학부모에게)
        try:
            from app.models.notification import NotificationType, NotificationPriority

            # 학생 및 학부모 ID 조회
            recipient_ids = [invoice.student_id]
            parents = db.query(GroupMember.user_id).filter(
                GroupMember.group_id == invoice.group_id,
                GroupMember.role == GroupMemberRole.PARENT,
                GroupMember.invite_status == GroupMemberInviteStatus.ACCEPTED,
            ).all()
            recipient_ids.extend([p[0] for p in parents])

            if recipient_ids:
                NotificationService.create_notifications_for_group(
                    db=db,
                    user_ids=recipient_ids,
                    notification_type=NotificationType.BILLING_ISSUED,
                    title=f"💳 {invoice.billing_period_start.month}월 과외비 청구서 도착",
                    message=f"{invoice.invoice_number} - {invoice.amount_due:,}원이 청구되었습니다.",
                    priority=NotificationPriority.CRITICAL,
                    related_resource_type="invoice",
                    related_resource_id=invoice.id,
                    is_required=True,
                )
        except Exception as e:
            print(f"⚠️ Warning: Failed to send billing notification: {e}")
            # 알림 실패는 메인 로직에 영향을 주지 않음

        # 응답 생성
        student = db.query(User).filter(User.id == invoice.student_id).first()
        return InvoiceDetailResponse(
            invoice_id=invoice.id,
            invoice_number=invoice.invoice_number,
            teacher_id=invoice.teacher_id,
            group_id=invoice.group_id,
            student=StudentInfo(user_id=student.id, name=student.name) if student else StudentInfo(user_id=invoice.student_id, name="Unknown"),
            billing_period=BillingPeriod(
                start_date=invoice.billing_period_start,
                end_date=invoice.billing_period_end
            ),
            billing_type=invoice.billing_type.value,
            status=invoice.status.value,
            lesson_unit_price=invoice.lesson_unit_price,
            contracted_lessons=invoice.contracted_lessons,
            attended_lessons=invoice.attended_lessons,
            absent_lessons=invoice.absent_lessons,
            amount_due=invoice.amount_due,
            amount_paid=invoice.amount_paid,
            discount_amount=invoice.discount_amount,
            due_date=invoice.due_date,
            memo=invoice.memo,
            created_at=invoice.created_at,
            updated_at=invoice.updated_at,
            sent_at=invoice.sent_at,
            paid_at=invoice.paid_at,
        )

    @staticmethod
    def cancel_invoice(
        db: Session,
        user: User,
        invoice_id: str,
        reason: Optional[str] = None
    ) -> InvoiceDetailResponse:
        """
        청구서 취소 (CANCELED 상태로 변경)

        POST /api/v1/invoices/{invoice_id}/cancel

        Business Logic (F-006):
        - 청구서 상태를 CANCELED로 변경
        - DRAFT 또는 SENT 상태에서만 취소 가능
        - 이미 결제된 청구서는 취소 불가
        - TEACHER만 가능

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (TEACHER만 가능)
            invoice_id: 청구서 ID
            reason: 취소 사유 (선택)

        Returns:
            InvoiceDetailResponse: 취소된 청구서 상세

        Raises:
            HTTPException: 권한이 없거나 청구서가 없거나 취소 불가능한 상태인 경우
        """
        # 청구서 조회
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "INVOICE_NOT_FOUND", "message": "청구서를 찾을 수 없습니다."}
            )

        # 선생님 권한 확인
        if invoice.teacher_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "자신이 발행한 청구서만 취소할 수 있습니다."}
            )

        # 상태 확인 (DRAFT, SENT만 취소 가능)
        if invoice.status not in [InvoiceStatus.DRAFT, InvoiceStatus.SENT]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_STATUS",
                    "message": f"DRAFT 또는 SENT 상태의 청구서만 취소할 수 있습니다. 현재 상태: {invoice.status.value}"
                }
            )

        # 결제 확인 (결제된 금액이 있으면 취소 불가)
        if invoice.amount_paid > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "PAYMENT_EXISTS",
                    "message": f"이미 {invoice.amount_paid:,}원이 결제되어 취소할 수 없습니다."
                }
            )

        # 상태 변경
        invoice.status = InvoiceStatus.CANCELED
        invoice.updated_at = datetime.utcnow()

        # 메모에 취소 사유 추가
        if reason:
            cancel_memo = f"[취소] {reason}"
            if invoice.memo:
                invoice.memo = f"{invoice.memo}\n{cancel_memo}"
            else:
                invoice.memo = cancel_memo

        db.commit()
        db.refresh(invoice)

        # 응답 생성
        student = db.query(User).filter(User.id == invoice.student_id).first()
        return InvoiceDetailResponse(
            invoice_id=invoice.id,
            invoice_number=invoice.invoice_number,
            teacher_id=invoice.teacher_id,
            group_id=invoice.group_id,
            student=StudentInfo(user_id=student.id, name=student.name) if student else StudentInfo(user_id=invoice.student_id, name="Unknown"),
            billing_period=BillingPeriod(
                start_date=invoice.billing_period_start,
                end_date=invoice.billing_period_end
            ),
            billing_type=invoice.billing_type.value,
            status=invoice.status.value,
            lesson_unit_price=invoice.lesson_unit_price,
            contracted_lessons=invoice.contracted_lessons,
            attended_lessons=invoice.attended_lessons,
            absent_lessons=invoice.absent_lessons,
            amount_due=invoice.amount_due,
            amount_paid=invoice.amount_paid,
            discount_amount=invoice.discount_amount,
            due_date=invoice.due_date,
            memo=invoice.memo,
            created_at=invoice.created_at,
            updated_at=invoice.updated_at,
            sent_at=invoice.sent_at,
            paid_at=invoice.paid_at,
        )

    @staticmethod
    def mark_invoice_paid(
        db: Session,
        user: User,
        invoice_id: str,
        payload: PaymentCreateRequest
    ) -> PaymentResponse:
        """
        결제 처리 (수동 결제 확인)

        POST /api/v1/invoices/{invoice_id}/payments

        Business Logic (F-006):
        - Payment 레코드 생성
        - Transaction 레코드 생성 (CHARGE)
        - Invoice의 amount_paid 업데이트
        - 전액 결제 시 상태를 PAID로 변경, paid_at 기록
        - 부분 결제 시 상태를 PARTIALLY_PAID로 변경
        - TEACHER만 가능 (현금 수령 등 수동 확인)

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자 (TEACHER만 가능)
            invoice_id: 청구서 ID
            payload: PaymentCreateRequest

        Returns:
            PaymentResponse: 결제 정보

        Raises:
            HTTPException: 권한이 없거나 청구서가 없는 경우
        """
        # 청구서 조회
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "INVOICE_NOT_FOUND", "message": "청구서를 찾을 수 없습니다."}
            )

        # 선생님 권한 확인
        if invoice.teacher_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "자신이 발행한 청구서만 결제 처리할 수 있습니다."}
            )

        # 상태 확인 (이미 취소된 청구서는 결제 불가)
        if invoice.status == InvoiceStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVOICE_CANCELED", "message": "취소된 청구서는 결제할 수 없습니다."}
            )

        # Payment 생성
        payment = Payment(
            invoice_id=invoice.id,
            method=PaymentMethod(payload.method),
            status=PaymentStatus.SUCCESS,
            amount=payload.amount,
            requested_at=datetime.utcnow(),
            approved_at=datetime.utcnow(),
        )

        db.add(payment)
        db.flush()  # ID 생성

        # Transaction 생성
        transaction = Transaction(
            invoice_id=invoice.id,
            type=TransactionType.CHARGE,
            amount=payload.amount,
            note=payload.memo or f"{payment.method.value} 결제 - {payload.amount:,}원"
        )

        db.add(transaction)

        # Invoice 업데이트
        invoice.amount_paid += payload.amount
        invoice.updated_at = datetime.utcnow()

        # 결제 완료 여부 확인
        if invoice.amount_paid >= invoice.amount_due:
            invoice.status = InvoiceStatus.PAID
            invoice.paid_at = datetime.utcnow()
        elif invoice.amount_paid > 0:
            invoice.status = InvoiceStatus.PARTIALLY_PAID

        db.commit()
        db.refresh(payment)

        # F-008: 결제 완료 알림 발송 (선생님에게)
        try:
            from app.models.notification import NotificationType, NotificationPriority

            NotificationService.create_notification(
                db=db,
                user_id=invoice.teacher_id,
                notification_type=NotificationType.PAYMENT_CONFIRMED,
                title=f"💰 {invoice.billing_period_start.month}월 과외비 결제 완료",
                message=f"{invoice.invoice_number} - {payload.amount:,}원이 결제되었습니다.",
                priority=NotificationPriority.NORMAL,
                related_resource_type="payment",
                related_resource_id=payment.id,
            )
        except Exception as e:
            print(f"⚠️ Warning: Failed to send payment confirmation notification: {e}")
            # 알림 실패는 메인 로직에 영향을 주지 않음

        # 응답 생성
        return PaymentResponse(
            payment_id=payment.id,
            invoice_id=payment.invoice_id,
            method=payment.method.value,
            status=payment.status.value,
            amount=payment.amount,
            provider=payment.provider,
            provider_payment_key=payment.provider_payment_key,
            card_last4=payment.card_last4,
            card_company=payment.card_company,
            requested_at=payment.requested_at,
            approved_at=payment.approved_at,
            canceled_at=payment.canceled_at,
            failure_reason=payment.failure_reason,
            cancel_reason=payment.cancel_reason,
        )

    @staticmethod
    def list_group_invoices(
        db: Session,
        user: User,
        group_id: str,
        year: Optional[int] = None,
        month: Optional[int] = None,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 20
    ) -> InvoiceListResponse:
        """
        그룹별 청구서 목록 조회 (필터링, 페이징)

        GET /api/v1/settlements/groups/{group_id}/invoices

        Args:
            db: 데이터베이스 세션
            user: 현재 사용자
            group_id: 그룹 ID
            year: 필터 - 연도 (선택)
            month: 필터 - 월 (선택)
            status: 필터 - 상태 (선택)
            page: 페이지 번호 (1부터 시작)
            size: 페이지 크기

        Returns:
            InvoiceListResponse: 청구서 목록 + 페이징 정보

        Raises:
            HTTPException: 권한이 없거나 그룹이 없는 경우
        """
        # 그룹 존재 확인
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "GROUP_NOT_FOUND", "message": "그룹을 찾을 수 없습니다."}
            )

        # 권한 확인
        if user.role == UserRole.TEACHER:
            # 선생님: 자신이 소유한 그룹의 청구서만
            if group.owner_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"code": "PERMISSION_DENIED", "message": "자신이 소유한 그룹의 청구서만 조회할 수 있습니다."}
                )
        # TODO: 학부모/학생 권한 확인 (본인 관련 청구서만)

        # 기본 쿼리
        query = db.query(Invoice).filter(Invoice.group_id == group_id)

        # 필터 적용
        if year:
            query = query.filter(extract('year', Invoice.billing_period_start) == year)

        if month:
            query = query.filter(extract('month', Invoice.billing_period_start) == month)

        if status and status != "all":
            try:
                status_enum = InvoiceStatus(status)
                query = query.filter(Invoice.status == status_enum)
            except ValueError:
                pass  # 잘못된 status는 무시

        # 전체 개수 계산
        total = query.count()

        # 페이징
        offset = (page - 1) * size
        invoices = query.order_by(desc(Invoice.created_at)).offset(offset).limit(size).all()

        # 응답 변환
        items = []
        for invoice in invoices:
            student = db.query(User).filter(User.id == invoice.student_id).first()
            items.append(InvoiceBasicInfo(
                invoice_id=invoice.id,
                invoice_number=invoice.invoice_number,
                student=StudentInfo(
                    user_id=student.id,
                    name=student.name
                ) if student else StudentInfo(user_id=invoice.student_id, name="Unknown"),
                billing_period=BillingPeriod(
                    start_date=invoice.billing_period_start,
                    end_date=invoice.billing_period_end
                ),
                status=invoice.status.value,
                amount_due=invoice.amount_due,
                amount_paid=invoice.amount_paid,
                due_date=invoice.due_date,
                created_at=invoice.created_at,
                sent_at=invoice.sent_at,
            ))

        # 페이징 정보
        total_pages = (total + size - 1) // size  # 올림 계산

        return InvoiceListResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            total_pages=total_pages,
        )
