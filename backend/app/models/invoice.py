"""
Invoice Models - F-006 수업료 정산
데이터베이스_설계서.md 및 F-006_수업료_정산.md를 기반으로 구현

Related:
- F-006_수업료_정산.md
- F-002 (Group 모델과 연결)
- F-004 (Attendance - 정산 계산의 기반)
"""

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Integer, Date, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.database import Base


class BillingType(str, enum.Enum):
    """
    청구 방식
    F-006: 선불/후불 구분
    """
    PREPAID = "PREPAID"      # 선불 (수업 전 결제)
    POSTPAID = "POSTPAID"    # 후불 (수업 후 결제)


class InvoiceStatus(str, enum.Enum):
    """
    청구서 상태
    F-006: 청구서의 생애 주기
    """
    DRAFT = "DRAFT"                  # 초안 (발송 전)
    SENT = "SENT"                    # 발송됨 (학부모에게 전송)
    PARTIALLY_PAID = "PARTIALLY_PAID"  # 일부 결제
    PAID = "PAID"                    # 결제 완료
    OVERDUE = "OVERDUE"              # 연체 (기한 경과)
    CANCELED = "CANCELED"            # 취소됨


class Invoice(Base):
    """
    Invoices table - 청구서

    Related:
    - F-006: 수업료 정산
    - F-002: Group (과외 그룹)
    - F-004: Attendance (출결 기록 기반 정산)

    Business Rules:
    - 청구서 번호: TUT-YYYY-NNN (예: TUT-2025-001)
    - 한 학생·한 그룹·한 기간에 대해 유효한 청구서는 1개만 유지
    - 재발행 시 기존 Invoice는 CANCELED 처리 후 새 Invoice 발행
    """

    __tablename__ = "invoices"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Invoice Number (TUT-YYYY-NNN)
    # 예: TUT-2025-001, TUT-2025-002
    # 연도별 시퀀스, 전체 시스템에서 unique
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)

    # Foreign Keys
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    group_id = Column(String(36), ForeignKey("groups.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # Billing Period (청구 기간)
    billing_period_start = Column(Date, nullable=False, index=True)
    billing_period_end = Column(Date, nullable=False, index=True)

    # Billing Type (선불/후불)
    billing_type = Column(
        SQLEnum(BillingType, name="billing_type", native_enum=False),
        nullable=False,
        default=BillingType.POSTPAID,
    )

    # Status
    status = Column(
        SQLEnum(InvoiceStatus, name="invoice_status", native_enum=False),
        nullable=False,
        default=InvoiceStatus.DRAFT,
        index=True,
    )

    # Lesson Information (수업 정보)
    lesson_unit_price = Column(Integer, nullable=False)  # 수업 1회당 단가 (원)
    contracted_lessons = Column(Integer, nullable=False, default=0)  # 약정 수업 횟수
    attended_lessons = Column(Integer, nullable=False, default=0)  # 실제 진행 수업 횟수 (출석 + 보강)
    absent_lessons = Column(Integer, nullable=False, default=0)  # 결석 횟수

    # Amount (금액)
    amount_due = Column(Integer, nullable=False, default=0)  # 청구 금액 (원)
    amount_paid = Column(Integer, nullable=False, default=0)  # 실제 납부된 금액 합계 (원)
    discount_amount = Column(Integer, nullable=True, default=0)  # 할인 금액 (선택)

    # Due Date (지불 기한)
    # F-006: 발송일로부터 30일
    due_date = Column(Date, nullable=True)

    # Additional Info
    memo = Column(Text, nullable=True)  # 메모 (특이사항, 차액 처리 내역 등)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    sent_at = Column(DateTime, nullable=True)  # 청구서 발송 시각
    paid_at = Column(DateTime, nullable=True)  # 결제 완료 시각

    # Relationships
    # Payment와의 관계 (1:N)
    # 한 청구서에 여러 결제 시도가 있을 수 있음
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

    # Transaction과의 관계 (1:N)
    # 한 청구서에 여러 거래 내역이 있을 수 있음
    transactions = relationship("Transaction", back_populates="invoice", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Invoice {self.invoice_number} - {self.status} - {self.amount_due}원>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        """
        return {
            "invoice_id": self.id,
            "invoice_number": self.invoice_number,
            "teacher_id": self.teacher_id,
            "group_id": self.group_id,
            "student_id": self.student_id,
            "billing_period": {
                "start_date": self.billing_period_start.isoformat() if self.billing_period_start else None,
                "end_date": self.billing_period_end.isoformat() if self.billing_period_end else None,
            },
            "billing_type": self.billing_type.value,
            "status": self.status.value,
            "lesson_unit_price": self.lesson_unit_price,
            "contracted_lessons": self.contracted_lessons,
            "attended_lessons": self.attended_lessons,
            "absent_lessons": self.absent_lessons,
            "amount_due": self.amount_due,
            "amount_paid": self.amount_paid,
            "discount_amount": self.discount_amount,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "memo": self.memo,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
        }


class PaymentMethod(str, enum.Enum):
    """
    결제 수단
    F-006: 학부모가 선택 가능한 결제 방법
    """
    CARD = "CARD"              # 신용/체크카드
    ACCOUNT = "ACCOUNT"        # 계좌이체
    EASY_PAY = "EASY_PAY"      # 간편결제 (카카오페이, 네이버페이 등)
    CASH = "CASH"              # 현금 (수동 확인)
    OTHER = "OTHER"            # 기타


class PaymentStatus(str, enum.Enum):
    """
    결제 상태
    F-006: 결제 요청의 생애 주기
    """
    PENDING = "PENDING"        # 대기 중 (결제 요청됨)
    SUCCESS = "SUCCESS"        # 성공
    FAILED = "FAILED"          # 실패
    CANCELED = "CANCELED"      # 취소됨
    REFUNDED = "REFUNDED"      # 환불됨


class Payment(Base):
    """
    Payments table - 결제 기록

    Related:
    - F-006: 수업료 정산
    - Invoice (N:1)

    Notes:
    - 한 청구서(Invoice)에 여러 결제 시도가 있을 수 있음 (실패 후 재시도 등)
    - PG사 연동을 위한 필드 포함 (provider_payment_key 등)
    """

    __tablename__ = "payments"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Foreign Key
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)

    # Payment Method and Status
    method = Column(
        SQLEnum(PaymentMethod, name="payment_method", native_enum=False),
        nullable=False,
        default=PaymentMethod.CARD,
    )
    status = Column(
        SQLEnum(PaymentStatus, name="payment_status", native_enum=False),
        nullable=False,
        default=PaymentStatus.PENDING,
        index=True,
    )

    # Amount
    amount = Column(Integer, nullable=False)  # 결제 금액 (원)

    # PG Integration Fields (토스페이먼츠 등)
    provider = Column(String(50), nullable=True)  # PG사 이름 (예: "toss", "inicis")
    provider_payment_key = Column(String(200), nullable=True, index=True)  # PG사 결제 키
    provider_order_id = Column(String(200), nullable=True)  # PG사 주문 ID
    provider_transaction_id = Column(String(200), nullable=True)  # PG사 거래 ID

    # Card Info (마지막 4자리만 저장, 보안)
    card_last4 = Column(String(4), nullable=True)
    card_company = Column(String(50), nullable=True)  # 카드사 이름

    # Timestamps
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # 결제 요청 시각
    approved_at = Column(DateTime, nullable=True)  # 결제 승인 시각
    canceled_at = Column(DateTime, nullable=True)  # 결제 취소 시각
    refunded_at = Column(DateTime, nullable=True)  # 환불 처리 시각

    # Failure / Cancellation Reason
    failure_reason = Column(Text, nullable=True)  # 실패 사유
    cancel_reason = Column(Text, nullable=True)  # 취소 사유

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")

    def __repr__(self):
        return f"<Payment {self.id} - Invoice {self.invoice_id} - {self.status} - {self.amount}원>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        """
        return {
            "payment_id": self.id,
            "invoice_id": self.invoice_id,
            "method": self.method.value,
            "status": self.status.value,
            "amount": self.amount,
            "provider": self.provider,
            "provider_payment_key": self.provider_payment_key,
            "card_last4": self.card_last4,
            "card_company": self.card_company,
            "requested_at": self.requested_at.isoformat() if self.requested_at else None,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "canceled_at": self.canceled_at.isoformat() if self.canceled_at else None,
            "refunded_at": self.refunded_at.isoformat() if self.refunded_at else None,
            "failure_reason": self.failure_reason,
            "cancel_reason": self.cancel_reason,
        }


class TransactionType(str, enum.Enum):
    """
    거래 유형
    F-006: 청구서에 대한 거래 내역 분류
    """
    CHARGE = "CHARGE"          # 청구
    REFUND = "REFUND"          # 환불
    ADJUSTMENT = "ADJUSTMENT"  # 조정 (차액 처리 등)
    CARRYOVER = "CARRYOVER"    # 이월 (다음 달로 크레딧 이월)


class Transaction(Base):
    """
    Transactions table - 거래 내역

    Related:
    - F-006: 수업료 정산
    - Invoice (N:1)

    Notes:
    - 청구서에 대한 모든 금액 변동 기록
    - 청구, 환불, 조정, 이월 등
    """

    __tablename__ = "transactions"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Foreign Key
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)

    # Transaction Type
    type = Column(
        SQLEnum(TransactionType, name="transaction_type", native_enum=False),
        nullable=False,
        index=True,
    )

    # Amount (금액)
    # CHARGE, CARRYOVER: 양수
    # REFUND, ADJUSTMENT(차감): 음수
    amount = Column(Integer, nullable=False)

    # Note
    note = Column(Text, nullable=True)  # 거래 내역 메모

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    invoice = relationship("Invoice", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction {self.id} - {self.type} - {self.amount}원>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        """
        return {
            "transaction_id": self.id,
            "invoice_id": self.invoice_id,
            "type": self.type.value,
            "amount": self.amount,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# TODO(v2): 청구서 수정 이력 추적
# class InvoiceHistory(Base):
#     __tablename__ = "invoice_history"
#     id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
#     invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
#     changed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
#     field_name = Column(String(50), nullable=False)
#     old_value = Column(Text, nullable=True)
#     new_value = Column(Text, nullable=True)
#     reason = Column(Text, nullable=True)
#     changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
