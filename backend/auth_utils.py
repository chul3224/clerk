import os
from datetime import datetime, timedelta

from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models import User

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30


def create_jwt(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> int | None:
    """토큰 문자열을 검증하고 user_id를 돌려준다. 실패하면 None.
    EventSource(SSE)는 헤더를 못 붙이므로 쿼리스트링 토큰 검증용으로 사용."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        return None


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    token = authorization[7:]
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다")
    return user
