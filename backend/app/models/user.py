from sqlalchemy import Column, String, Integer, Boolean, JSON, Enum
from sqlalchemy.orm import relationship
import enum
from .base import Base, TimestampMixin


class ReportLevel(str, enum.Enum):
    BEGINNER = "beginner"    # 주린이
    STANDARD = "standard"   # 일반
    EXPERT = "expert"        # 전문가


class ReportFrequency(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # 리포트 설정
    report_level = Column(Enum(ReportLevel), default=ReportLevel.STANDARD, nullable=False)
    report_frequency = Column(Enum(ReportFrequency), default=ReportFrequency.WEEKLY, nullable=False)
    selected_indicators = Column(JSON, default=list)  # indicator id 목록

    # Web Push 구독 정보
    push_subscription = Column(JSON, nullable=True)  # PushSubscription JSON
    push_enabled = Column(Boolean, default=False)

    reports = relationship("Report", back_populates="user")
