"""
Email Service - F-008 필수 알림 시스템 (고도화)
SMTP 기반 이메일 발송 서비스
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailConfig:
    """이메일 서비스 설정"""

    def __init__(
        self,
        smtp_host: str = "",
        smtp_port: int = 587,
        smtp_user: str = "",
        smtp_password: str = "",
        from_email: str = "",
        from_name: str = "WeTee",
        use_tls: bool = True,
        enabled: bool = False,
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_password = smtp_password
        self.from_email = from_email
        self.from_name = from_name
        self.use_tls = use_tls
        self.enabled = enabled


class EmailTemplate:
    """이메일 템플릿 관리"""

    # 기본 HTML 템플릿 (모든 이메일에 공통 적용)
    BASE_TEMPLATE = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background-color: #4F46E5;
                color: white;
                padding: 24px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
            }}
            .content {{
                padding: 32px 24px;
            }}
            .footer {{
                background-color: #f8f9fa;
                padding: 16px 24px;
                text-align: center;
                font-size: 12px;
                color: #6c757d;
            }}
            .button {{
                display: inline-block;
                padding: 12px 24px;
                background-color: #4F46E5;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 16px 0;
            }}
            .priority-critical {{
                border-left: 4px solid #dc3545;
            }}
            .priority-high {{
                border-left: 4px solid #fd7e14;
            }}
            .priority-normal {{
                border-left: 4px solid #4F46E5;
            }}
            .priority-low {{
                border-left: 4px solid #6c757d;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>WeTee</h1>
            </div>
            <div class="content {priority_class}">
                {content}
            </div>
            <div class="footer">
                <p>이 이메일은 WeTee 알림 서비스에서 자동으로 발송되었습니다.</p>
                <p>알림 설정은 앱 설정에서 변경할 수 있습니다.</p>
            </div>
        </div>
    </body>
    </html>
    """

    # 알림 타입별 템플릿
    TEMPLATES = {
        # 수업 일정 관련
        "SCHEDULE_REMINDER": {
            "subject": "[WeTee] 🔔 {title}",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
                <p><strong>일시:</strong> {scheduled_time}</p>
                {action_button}
            """,
        },
        "SCHEDULE_CHANGED": {
            "subject": "[WeTee] 📅 일정 변경 알림",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
                <p>변경 사항을 확인해 주세요.</p>
                {action_button}
            """,
        },
        "SCHEDULE_CANCELLED": {
            "subject": "[WeTee] ❌ 수업 취소 알림",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
                <p style="color: #dc3545;">수업이 취소되었습니다.</p>
                {action_button}
            """,
        },

        # 출결 관련
        "ATTENDANCE_CHANGED": {
            "subject": "[WeTee] ✅ 출결 상태 변경",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
                {action_button}
            """,
        },

        # 수업 기록 관련
        "LESSON_RECORD_CREATED": {
            "subject": "[WeTee] 📝 수업 기록 등록",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
                <p>수업 내용과 과제를 확인해 주세요.</p>
                {action_button}
            """,
        },
        "HOMEWORK_ASSIGNED": {
            "subject": "[WeTee] 📚 새로운 숙제 등록",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
                <p>숙제 내용을 확인해 주세요.</p>
                {action_button}
            """,
        },

        # 보강 관련
        "MAKEUP_CLASS_AVAILABLE": {
            "subject": "[WeTee] 🕐 보강 일정 오픈",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
                <p>보강 신청을 원하시면 앱에서 신청해 주세요.</p>
                {action_button}
            """,
        },
        "MAKEUP_CLASS_REQUESTED": {
            "subject": "[WeTee] 📋 보강 신청 알림",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
                {action_button}
            """,
        },

        # 정산 관련 (필수)
        "BILLING_ISSUED": {
            "subject": "[WeTee] 💳 수업료 청구서 발행",
            "content": """
                <h2 style="color: #dc3545;">{title}</h2>
                <p>{message}</p>
                <p><strong>청구 금액:</strong> {amount}</p>
                <p><strong>결제 기한:</strong> {due_date}</p>
                <p style="color: #dc3545;">기한 내 결제를 부탁드립니다.</p>
                {action_button}
            """,
        },
        "PAYMENT_CONFIRMED": {
            "subject": "[WeTee] ✅ 결제 완료",
            "content": """
                <h2 style="color: #28a745;">{title}</h2>
                <p>{message}</p>
                <p><strong>결제 금액:</strong> {amount}</p>
                <p>감사합니다.</p>
                {action_button}
            """,
        },
        "PAYMENT_FAILED": {
            "subject": "[WeTee] ⚠️ 결제 실패",
            "content": """
                <h2 style="color: #dc3545;">{title}</h2>
                <p>{message}</p>
                <p>결제 정보를 확인하고 다시 시도해 주세요.</p>
                {action_button}
            """,
        },

        # 그룹 관련
        "GROUP_INVITE": {
            "subject": "[WeTee] 📨 그룹 초대",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
                <p>초대를 수락하려면 아래 버튼을 클릭하세요.</p>
                {action_button}
            """,
        },

        # 시스템 공지
        "SYSTEM_NOTICE": {
            "subject": "[WeTee] 📢 {title}",
            "content": """
                <h2>{title}</h2>
                <p>{message}</p>
            """,
        },
    }

    @classmethod
    def get_template(cls, notification_type: str) -> Dict[str, str]:
        """알림 타입에 맞는 템플릿 반환"""
        return cls.TEMPLATES.get(notification_type, cls.TEMPLATES["SYSTEM_NOTICE"])

    @classmethod
    def render(
        cls,
        notification_type: str,
        title: str,
        message: str,
        priority: str = "NORMAL",
        action_url: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        """
        이메일 템플릿 렌더링

        Args:
            notification_type: 알림 타입
            title: 알림 제목
            message: 알림 메시지
            priority: 우선순위 (CRITICAL, HIGH, NORMAL, LOW)
            action_url: 액션 URL (버튼 링크)
            extra_data: 추가 데이터 (amount, due_date 등)

        Returns:
            Dict with 'subject' and 'html_body'
        """
        template = cls.get_template(notification_type)

        # 우선순위에 따른 CSS 클래스
        priority_class = f"priority-{priority.lower()}"

        # 액션 버튼
        action_button = ""
        if action_url:
            action_button = f'<a href="{action_url}" class="button">자세히 보기</a>'

        # 템플릿 변수 준비
        template_vars = {
            "title": title,
            "message": message,
            "action_button": action_button,
            "scheduled_time": "",
            "amount": "",
            "due_date": "",
        }

        # 추가 데이터 병합
        if extra_data:
            template_vars.update(extra_data)

        # 컨텐츠 렌더링
        content = template["content"].format(**template_vars)

        # 전체 HTML 렌더링
        html_body = cls.BASE_TEMPLATE.format(
            content=content,
            priority_class=priority_class,
        )

        # 제목 렌더링
        subject = template["subject"].format(title=title, **template_vars)

        return {
            "subject": subject,
            "html_body": html_body,
        }


class EmailService:
    """이메일 발송 서비스"""

    def __init__(self, config: Optional[EmailConfig] = None):
        """
        Args:
            config: 이메일 설정. None이면 환경변수에서 로드
        """
        self.config = config or self._load_config_from_env()
        self._connection: Optional[smtplib.SMTP] = None

    def _load_config_from_env(self) -> EmailConfig:
        """환경변수에서 이메일 설정 로드"""
        import os

        return EmailConfig(
            smtp_host=os.getenv("SMTP_HOST", ""),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_user=os.getenv("SMTP_USER", ""),
            smtp_password=os.getenv("SMTP_PASSWORD", ""),
            from_email=os.getenv("SMTP_FROM_EMAIL", ""),
            from_name=os.getenv("SMTP_FROM_NAME", "WeTee"),
            use_tls=os.getenv("SMTP_USE_TLS", "true").lower() == "true",
            enabled=os.getenv("EMAIL_ENABLED", "false").lower() == "true",
        )

    def is_enabled(self) -> bool:
        """이메일 서비스 활성화 여부"""
        return (
            self.config.enabled
            and bool(self.config.smtp_host)
            and bool(self.config.smtp_user)
            and bool(self.config.smtp_password)
        )

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        """
        이메일 발송

        Args:
            to_email: 수신자 이메일
            subject: 제목
            html_body: HTML 본문
            text_body: 텍스트 본문 (선택)

        Returns:
            bool: 성공 여부
        """
        if not self.is_enabled():
            logger.warning("Email service is disabled. Skipping email send.")
            return False

        try:
            # MIME 메시지 생성
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.config.from_name} <{self.config.from_email}>"
            msg["To"] = to_email

            # 텍스트 버전 (HTML을 지원하지 않는 클라이언트용)
            if text_body:
                text_part = MIMEText(text_body, "plain", "utf-8")
                msg.attach(text_part)

            # HTML 버전
            html_part = MIMEText(html_body, "html", "utf-8")
            msg.attach(html_part)

            # SMTP 연결 및 발송
            with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port) as server:
                if self.config.use_tls:
                    server.starttls()

                server.login(self.config.smtp_user, self.config.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            return False
        except smtplib.SMTPRecipientsRefused as e:
            logger.error(f"Recipients refused: {e}")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    def send_notification_email(
        self,
        to_email: str,
        notification_type: str,
        title: str,
        message: str,
        priority: str = "NORMAL",
        action_url: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        알림 이메일 발송

        Args:
            to_email: 수신자 이메일
            notification_type: 알림 타입
            title: 알림 제목
            message: 알림 메시지
            priority: 우선순위
            action_url: 액션 URL
            extra_data: 추가 데이터

        Returns:
            bool: 성공 여부
        """
        # 템플릿 렌더링
        rendered = EmailTemplate.render(
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
            extra_data=extra_data,
        )

        # 이메일 발송
        return self.send_email(
            to_email=to_email,
            subject=rendered["subject"],
            html_body=rendered["html_body"],
        )

    def send_test_email(self, to_email: str) -> bool:
        """
        테스트 이메일 발송

        Args:
            to_email: 수신자 이메일

        Returns:
            bool: 성공 여부
        """
        return self.send_notification_email(
            to_email=to_email,
            notification_type="SYSTEM_NOTICE",
            title="테스트 이메일",
            message=f"이 이메일은 WeTee 이메일 서비스 테스트입니다. 발송 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            priority="NORMAL",
        )


# 전역 이메일 서비스 인스턴스
email_service = EmailService()
