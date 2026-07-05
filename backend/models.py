from datetime import datetime
from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Text
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    slack_user_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MeetingRecord(Base):
    __tablename__ = "meeting_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    file_id = Column(String, nullable=False)
    title = Column(String, nullable=True)          # AI가 생성한 회의 제목
    summary = Column(String, nullable=True)
    action_items = Column(String, nullable=True)   # JSON string
    key_decisions = Column(String, nullable=True)  # JSON string
    transcript = Column(Text, nullable=True)       # 대화록 전체 (JSON string)
    summaries = Column(Text, nullable=True)        # 3개 모델 요약 전체 (JSON string)
    transcript_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
