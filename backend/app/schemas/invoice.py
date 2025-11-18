"""
Invoice Schemas - F-006 수업료 정산
API_명세서.md 6.6 F-006 기반 요청/응답 스키마
프론트엔드 타입 정의와 일치
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Literal, List
from datetime import datetime, date


# Enums (프론트엔드와 동일)
BillingTypeEnum = Literal["PREPAID", "POSTPAID"]
InvoiceStatusEnum = Literal["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELED"]
PaymentMethodEnum = Literal["CARD", "ACCOUNT", "EASY_PAY", "CASH", "OTHER"]
PaymentStatusEnum = Literal["PENDING", "SUCCESS", "FAILED", "CANCELED", "REFUNDED"]
TransactionTypeEnum = Literal["CHARGE", "REFUND", "ADJUSTMENT", "CARRYOVER"]


# ==========================
# Invoice Request Schemas
# ==========================


class InvoiceCreateRequest(BaseModel):
    """
    청구서 생성 요청 스키마

    POST /api/v1/groups/{group_id}/invoices
    """
    year: int = Field(..., ge=2020, le=2100, description="정산 연도")
    month: int = Field(..., ge=1, le=12, description="정산 월")
    student_id: str = Field(..., description="학생 ID (GroupMember의 user_id)")
    billing_type: Optional[BillingTypeEnum] = Field(
        "POSTPAID",
        description="청구 방식 (선불/후불)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "year": 2025,
                "month": 11,
                "student_id": "student-uuid-123",
                "billing_type": "POSTPAID"
            }
        }


class InvoiceUpdateRequest(BaseModel):
    """
    청구서 수정 요청 스키마 (발송 전만 가능)

    PATCH /api/v1/invoices/{invoice_id}
    """
    discount_amount: Optional[int] = Field(None, ge=0, description="할인 금액 (원)")
    memo: Optional[str] = Field(None, max_length=1000, description="메모")
    due_date: Optional[date] = Field(None, description="지불 기한 (YYYY-MM-DD)")

    class Config:
        json_schema_extra = {
            "example": {
                "discount_amount": 10000,
                "memo": "첫 달 할인 10,000원 적용",
                "due_date": "2025-12-05"
            }
        }


# ==========================
# Settlement (정산 요약) Schemas
# ==========================


class SettlementSummaryItem(BaseModel):
    """
    학생별 정산 요약 아이템
    """
    student_id: str = Field(..., description="학생 ID")
    student_name: str = Field(..., description="학생 이름")
    contracted_lessons: int = Field(..., ge=0, description="약정 수업 횟수")
    attended_lessons: int = Field(..., ge=0, description="실제 진행 수업 횟수 (출석 + 보강)")
    absent_lessons: int = Field(..., ge=0, description="결석 횟수")
    lesson_unit_price: int = Field(..., ge=0, description="수업 1회당 단가 (원)")
    amount_due: int = Field(..., ge=0, description="청구 금액 (원)")
    has_existing_invoice: bool = Field(False, description="이미 청구서가 발행되었는지 여부")

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "student-uuid-123",
                "student_name": "박민수",
                "contracted_lessons": 8,
                "attended_lessons": 7,
                "absent_lessons": 1,
                "lesson_unit_price": 50000,
                "amount_due": 350000,
                "has_existing_invoice": False
            }
        }


class SettlementSummaryResponse(BaseModel):
    """
    그룹 월간 정산 요약 응답

    GET /api/v1/settlements/groups/{group_id}/summary?year=YYYY&month=MM
    """
    group_id: str = Field(..., description="그룹 ID")
    year: int = Field(..., description="정산 연도")
    month: int = Field(..., description="정산 월")
    items: List[SettlementSummaryItem] = Field(..., description="학생별 정산 요약 목록")
    total_amount_due: int = Field(..., ge=0, description="전체 청구 금액 합계 (원)")
    total_students: int = Field(..., ge=0, description="학생 수")

    class Config:
        json_schema_extra = {
            "example": {
                "group_id": "group-uuid-456",
                "year": 2025,
                "month": 11,
                "items": [
                    {
                        "student_id": "student-uuid-123",
                        "student_name": "박민수",
                        "contracted_lessons": 8,
                        "attended_lessons": 7,
                        "absent_lessons": 1,
                        "lesson_unit_price": 50000,
                        "amount_due": 350000,
                        "has_existing_invoice": False
                    }
                ],
                "total_amount_due": 350000,
                "total_students": 1
            }
        }


# ==========================
# Invoice Response Schemas
# ==========================


class BillingPeriod(BaseModel):
    """
    청구 기간
    """
    start_date: date = Field(..., description="시작일 (YYYY-MM-DD)")
    end_date: date = Field(..., description="종료일 (YYYY-MM-DD)")

    class Config:
        json_schema_extra = {
            "example": {
                "start_date": "2025-11-01",
                "end_date": "2025-11-30"
            }
        }


class StudentInfo(BaseModel):
    """
    학생 정보 (간략)
    """
    user_id: str = Field(..., description="학생 ID")
    name: str = Field(..., description="학생 이름")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "student-uuid-123",
                "name": "박민수"
            }
        }


class InvoiceBasicInfo(BaseModel):
    """
    청구서 기본 정보 (리스트용)
    """
    invoice_id: str = Field(..., description="청구서 ID")
    invoice_number: str = Field(..., description="청구서 번호 (TUT-YYYY-NNN)")
    student: StudentInfo = Field(..., description="학생 정보")
    billing_period: BillingPeriod = Field(..., description="청구 기간")
    status: InvoiceStatusEnum = Field(..., description="청구서 상태")
    amount_due: int = Field(..., ge=0, description="청구 금액 (원)")
    amount_paid: int = Field(..., ge=0, description="실제 납부 금액 (원)")
    due_date: Optional[date] = Field(None, description="지불 기한")
    created_at: datetime = Field(..., description="생성 시각 (ISO 8601)")
    sent_at: Optional[datetime] = Field(None, description="발송 시각 (ISO 8601)")

    class Config:
        json_schema_extra = {
            "example": {
                "invoice_id": "invoice-uuid-789",
                "invoice_number": "TUT-2025-001",
                "student": {
                    "user_id": "student-uuid-123",
                    "name": "박민수"
                },
                "billing_period": {
                    "start_date": "2025-11-01",
                    "end_date": "2025-11-30"
                },
                "status": "SENT",
                "amount_due": 350000,
                "amount_paid": 0,
                "due_date": "2025-12-05",
                "created_at": "2025-11-12T09:30:00Z",
                "sent_at": "2025-11-12T10:00:00Z"
            }
        }


class InvoiceDetailResponse(BaseModel):
    """
    청구서 상세 정보

    GET /api/v1/invoices/{invoice_id}
    """
    invoice_id: str = Field(..., description="청구서 ID")
    invoice_number: str = Field(..., description="청구서 번호 (TUT-YYYY-NNN)")
    teacher_id: str = Field(..., description="선생님 ID")
    group_id: str = Field(..., description="그룹 ID")
    student: StudentInfo = Field(..., description="학생 정보")
    billing_period: BillingPeriod = Field(..., description="청구 기간")
    billing_type: BillingTypeEnum = Field(..., description="청구 방식 (선불/후불)")
    status: InvoiceStatusEnum = Field(..., description="청구서 상태")

    # Lesson Information
    lesson_unit_price: int = Field(..., ge=0, description="수업 1회당 단가 (원)")
    contracted_lessons: int = Field(..., ge=0, description="약정 수업 횟수")
    attended_lessons: int = Field(..., ge=0, description="실제 진행 수업 횟수")
    absent_lessons: int = Field(..., ge=0, description="결석 횟수")

    # Amount
    amount_due: int = Field(..., ge=0, description="청구 금액 (원)")
    amount_paid: int = Field(..., ge=0, description="실제 납부 금액 (원)")
    discount_amount: Optional[int] = Field(None, ge=0, description="할인 금액 (원)")

    due_date: Optional[date] = Field(None, description="지불 기한")
    memo: Optional[str] = Field(None, description="메모")

    # Timestamps
    created_at: datetime = Field(..., description="생성 시각 (ISO 8601)")
    updated_at: datetime = Field(..., description="수정 시각 (ISO 8601)")
    sent_at: Optional[datetime] = Field(None, description="발송 시각 (ISO 8601)")
    paid_at: Optional[datetime] = Field(None, description="결제 완료 시각 (ISO 8601)")

    class Config:
        json_schema_extra = {
            "example": {
                "invoice_id": "invoice-uuid-789",
                "invoice_number": "TUT-2025-001",
                "teacher_id": "teacher-uuid-456",
                "group_id": "group-uuid-789",
                "student": {
                    "user_id": "student-uuid-123",
                    "name": "박민수"
                },
                "billing_period": {
                    "start_date": "2025-11-01",
                    "end_date": "2025-11-30"
                },
                "billing_type": "POSTPAID",
                "status": "SENT",
                "lesson_unit_price": 50000,
                "contracted_lessons": 8,
                "attended_lessons": 7,
                "absent_lessons": 1,
                "amount_due": 350000,
                "amount_paid": 0,
                "discount_amount": 0,
                "due_date": "2025-12-05",
                "memo": None,
                "created_at": "2025-11-12T09:30:00Z",
                "updated_at": "2025-11-12T09:30:00Z",
                "sent_at": "2025-11-12T10:00:00Z",
                "paid_at": None
            }
        }


class InvoiceListResponse(BaseModel):
    """
    청구서 목록 응답

    GET /api/v1/groups/{group_id}/invoices
    """
    items: List[InvoiceBasicInfo] = Field(..., description="청구서 목록")
    total: int = Field(..., ge=0, description="전체 항목 수")
    page: int = Field(..., ge=1, description="현재 페이지")
    size: int = Field(..., ge=1, description="페이지 크기")
    total_pages: int = Field(..., ge=0, description="전체 페이지 수")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 0,
                "page": 1,
                "size": 20,
                "total_pages": 0
            }
        }


# ==========================
# Payment Schemas
# ==========================


class PaymentCreateRequest(BaseModel):
    """
    결제 생성 요청 스키마 (수동 결제 확인용)

    POST /api/v1/invoices/{invoice_id}/payments
    """
    method: PaymentMethodEnum = Field(..., description="결제 수단")
    amount: int = Field(..., gt=0, description="결제 금액 (원)")
    memo: Optional[str] = Field(None, max_length=500, description="결제 메모")

    class Config:
        json_schema_extra = {
            "example": {
                "method": "CASH",
                "amount": 350000,
                "memo": "현금 수령 확인"
            }
        }


class PaymentResponse(BaseModel):
    """
    결제 정보 응답

    GET /api/v1/payments/{payment_id}
    """
    payment_id: str = Field(..., description="결제 ID")
    invoice_id: str = Field(..., description="청구서 ID")
    method: PaymentMethodEnum = Field(..., description="결제 수단")
    status: PaymentStatusEnum = Field(..., description="결제 상태")
    amount: int = Field(..., ge=0, description="결제 금액 (원)")
    provider: Optional[str] = Field(None, description="PG사 이름")
    provider_payment_key: Optional[str] = Field(None, description="PG사 결제 키")
    card_last4: Optional[str] = Field(None, description="카드 마지막 4자리")
    card_company: Optional[str] = Field(None, description="카드사 이름")
    requested_at: datetime = Field(..., description="결제 요청 시각 (ISO 8601)")
    approved_at: Optional[datetime] = Field(None, description="결제 승인 시각 (ISO 8601)")
    canceled_at: Optional[datetime] = Field(None, description="결제 취소 시각 (ISO 8601)")
    failure_reason: Optional[str] = Field(None, description="실패 사유")
    cancel_reason: Optional[str] = Field(None, description="취소 사유")

    class Config:
        json_schema_extra = {
            "example": {
                "payment_id": "payment-uuid-abc",
                "invoice_id": "invoice-uuid-789",
                "method": "CARD",
                "status": "SUCCESS",
                "amount": 350000,
                "provider": "toss",
                "provider_payment_key": "toss_payment_key_123",
                "card_last4": "1234",
                "card_company": "신한카드",
                "requested_at": "2025-12-01T14:00:00Z",
                "approved_at": "2025-12-01T14:00:30Z",
                "canceled_at": None,
                "failure_reason": None,
                "cancel_reason": None
            }
        }


# ==========================
# Transaction Schemas
# ==========================


class TransactionResponse(BaseModel):
    """
    거래 내역 응답
    """
    transaction_id: str = Field(..., description="거래 ID")
    invoice_id: str = Field(..., description="청구서 ID")
    type: TransactionTypeEnum = Field(..., description="거래 유형")
    amount: int = Field(..., description="금액 (원, 양수/음수)")
    note: Optional[str] = Field(None, description="메모")
    created_at: datetime = Field(..., description="생성 시각 (ISO 8601)")

    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "txn-uuid-def",
                "invoice_id": "invoice-uuid-789",
                "type": "CHARGE",
                "amount": 350000,
                "note": "11월 정규 수업 청구",
                "created_at": "2025-11-12T09:30:00Z"
            }
        }


# ==========================
# Common Response Wrapper
# ==========================


class InvoiceCreateResponse(BaseModel):
    """
    청구서 생성 성공 응답

    POST /api/v1/groups/{group_id}/invoices
    """
    success: bool = Field(True, description="성공 여부")
    data: InvoiceDetailResponse = Field(..., description="생성된 청구서 상세")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "invoice_id": "invoice-uuid-789",
                    "invoice_number": "TUT-2025-001",
                    # ... (InvoiceDetailResponse 예제)
                }
            }
        }
