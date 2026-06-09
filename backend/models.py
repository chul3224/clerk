from datetime import datetime
from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
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
    summary = Column(String, nullable=True)
    action_items = Column(String, nullable=True)  # JSON string
    key_decisions = Column(String, nullable=True)  # JSON string
    transcript_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
