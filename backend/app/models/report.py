from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
from .user import ReportLevel


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)   # 3줄 요약 (개행 구분)
    html_content = Column(Text, nullable=False)  # 전체 HTML 리포트

    level = Column(Enum(ReportLevel), nullable=False)
    indicators_used = Column(JSON, default=list)  # 사용된 지표 id 목록
    raw_data = Column(JSON, nullable=True)        # 수집된 원본 데이터

    is_read = Column(Boolean, default=False)

    user = relationship("User", back_populates="reports")
