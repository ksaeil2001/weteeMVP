"""
SMS Service - F-008 필수 알림 시스템 (고도화)
SMS 게이트웨이 연동 서비스 (AWS SNS / NAVER SENS 지원)
"""

import logging
import json
import hmac
import hashlib
import base64
import time
import requests
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class SMSConfig:
    """SMS 서비스 설정"""

    def __init__(
        self,
        provider: str = "",  # "aws_sns" or "naver_sens"
        enabled: bool = False,
        # AWS SNS
        aws_region: str = "",
        aws_access_key: str = "",
        aws_secret_key: str = "",
        # NAVER SENS
        naver_service_id: str = "",
        naver_access_key: str = "",
        naver_secret_key: str = "",
        naver_from_number: str = "",
    ):
        self.provider = provider
        self.enabled = enabled
        # AWS SNS
        self.aws_region = aws_region
        self.aws_access_key = aws_access_key
        self.aws_secret_key = aws_secret_key
        # NAVER SENS
        self.naver_service_id = naver_service_id
        self.naver_access_key = naver_access_key
        self.naver_secret_key = naver_secret_key
        self.naver_from_number = naver_from_number


class SMSService:
    """SMS 발송 서비스"""

    def __init__(self, config: Optional[SMSConfig] = None):
        """
        Args:
            config: SMS 설정. None이면 환경변수에서 로드
        """
        self.config = config or self._load_config_from_env()

    def _load_config_from_env(self) -> SMSConfig:
        """환경변수에서 SMS 설정 로드"""
        import os

        return SMSConfig(
            provider=os.getenv("SMS_PROVIDER", ""),
            enabled=os.getenv("SMS_ENABLED", "false").lower() == "true",
            # AWS SNS
            aws_region=os.getenv("AWS_REGION", "ap-northeast-2"),
            aws_access_key=os.getenv("AWS_ACCESS_KEY_ID", ""),
            aws_secret_key=os.getenv("AWS_SECRET_ACCESS_KEY", ""),
            # NAVER SENS
            naver_service_id=os.getenv("NAVER_SENS_SERVICE_ID", ""),
            naver_access_key=os.getenv("NAVER_SENS_ACCESS_KEY", ""),
            naver_secret_key=os.getenv("NAVER_SENS_SECRET_KEY", ""),
            naver_from_number=os.getenv("NAVER_SENS_FROM_NUMBER", ""),
        )

    def is_enabled(self) -> bool:
        """SMS 서비스 활성화 여부"""
        if not self.config.enabled or not self.config.provider:
            return False

        if self.config.provider == "aws_sns":
            return bool(self.config.aws_access_key and self.config.aws_secret_key)
        elif self.config.provider == "naver_sens":
            return bool(
                self.config.naver_service_id
                and self.config.naver_access_key
                and self.config.naver_secret_key
                and self.config.naver_from_number
            )

        return False

    def send_sms(
        self,
        to_phone: str,
        message: str,
    ) -> bool:
        """
        SMS 발송

        Args:
            to_phone: 수신자 전화번호 (예: 010-1234-5678)
            message: 메시지 내용 (80자 이내 권장)

        Returns:
            bool: 성공 여부
        """
        if not self.is_enabled():
            logger.warning("SMS service is disabled. Skipping SMS send.")
            return False

        # 전화번호 정규화 (하이픈 제거)
        normalized_phone = to_phone.replace("-", "").replace(" ", "")

        # 국제 형식으로 변환 (+82)
        if normalized_phone.startswith("0"):
            normalized_phone = "+82" + normalized_phone[1:]
        elif not normalized_phone.startswith("+"):
            normalized_phone = "+82" + normalized_phone

        try:
            if self.config.provider == "aws_sns":
                return self._send_via_aws_sns(normalized_phone, message)
            elif self.config.provider == "naver_sens":
                return self._send_via_naver_sens(normalized_phone, message)
            else:
                logger.error(f"Unknown SMS provider: {self.config.provider}")
                return False

        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return False

    def _send_via_aws_sns(self, to_phone: str, message: str) -> bool:
        """AWS SNS를 통한 SMS 발송"""
        try:
            import boto3

            client = boto3.client(
                "sns",
                region_name=self.config.aws_region,
                aws_access_key_id=self.config.aws_access_key,
                aws_secret_access_key=self.config.aws_secret_key,
            )

            response = client.publish(
                PhoneNumber=to_phone,
                Message=message,
                MessageAttributes={
                    "AWS.SNS.SMS.SMSType": {
                        "DataType": "String",
                        "StringValue": "Transactional",  # 중요 알림용
                    }
                },
            )

            logger.info(f"SMS sent via AWS SNS: {response.get('MessageId')}")
            return True

        except ImportError:
            logger.error("boto3 is not installed. Install with: pip install boto3")
            return False
        except Exception as e:
            logger.error(f"AWS SNS error: {e}")
            return False

    def _send_via_naver_sens(self, to_phone: str, message: str) -> bool:
        """NAVER SENS를 통한 SMS 발송"""
        try:
            # NAVER SENS API
            timestamp = str(int(time.time() * 1000))
            uri = f"/sms/v2/services/{self.config.naver_service_id}/messages"
            url = f"https://sens.apigw.ntruss.com{uri}"

            # Signature 생성
            signature = self._make_naver_signature(timestamp, uri)

            headers = {
                "Content-Type": "application/json; charset=utf-8",
                "x-ncp-apigw-timestamp": timestamp,
                "x-ncp-iam-access-key": self.config.naver_access_key,
                "x-ncp-apigw-signature-v2": signature,
            }

            # 전화번호에서 + 제거 (NAVER SENS는 국가코드 없이 사용)
            local_phone = to_phone.replace("+82", "0")

            body = {
                "type": "SMS",
                "from": self.config.naver_from_number,
                "content": message,
                "messages": [{"to": local_phone}],
            }

            response = requests.post(url, headers=headers, json=body)

            if response.status_code == 202:
                result = response.json()
                logger.info(f"SMS sent via NAVER SENS: {result.get('requestId')}")
                return True
            else:
                logger.error(f"NAVER SENS error: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            logger.error(f"NAVER SENS error: {e}")
            return False

    def _make_naver_signature(self, timestamp: str, uri: str) -> str:
        """NAVER API 서명 생성"""
        message = f"POST {uri}\n{timestamp}\n{self.config.naver_access_key}"
        signature = hmac.new(
            self.config.naver_secret_key.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        return base64.b64encode(signature).decode("utf-8")

    def send_notification_sms(
        self,
        to_phone: str,
        notification_type: str,
        title: str,
        message: str,
    ) -> bool:
        """
        알림 SMS 발송

        Args:
            to_phone: 수신자 전화번호
            notification_type: 알림 타입
            title: 알림 제목
            message: 알림 메시지

        Returns:
            bool: 성공 여부
        """
        # SMS는 80자 제한이 있으므로 간결하게 작성
        # 타입별 이모지 매핑
        type_emoji = {
            "SCHEDULE_REMINDER": "🔔",
            "SCHEDULE_CHANGED": "📅",
            "SCHEDULE_CANCELLED": "❌",
            "ATTENDANCE_CHANGED": "✅",
            "BILLING_ISSUED": "💳",
            "PAYMENT_CONFIRMED": "✅",
            "PAYMENT_FAILED": "⚠️",
        }

        emoji = type_emoji.get(notification_type, "📢")
        sms_content = f"[WeTee] {emoji} {title}\n{message}"

        # 80자 제한
        if len(sms_content) > 80:
            sms_content = sms_content[:77] + "..."

        return self.send_sms(to_phone, sms_content)

    def send_test_sms(self, to_phone: str) -> bool:
        """
        테스트 SMS 발송

        Args:
            to_phone: 수신자 전화번호

        Returns:
            bool: 성공 여부
        """
        return self.send_sms(
            to_phone=to_phone,
            message=f"[WeTee] 테스트 SMS입니다. {datetime.now().strftime('%H:%M:%S')}",
        )


# 전역 SMS 서비스 인스턴스
sms_service = SMSService()
