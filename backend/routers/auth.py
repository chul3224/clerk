import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from auth_utils import create_jwt, get_current_user
from database import get_db
from models import User

router = APIRouter()


def _cfg():
    return {
        "client_id":     os.getenv("SLACK_CLIENT_ID"),
        "client_secret": os.getenv("SLACK_CLIENT_SECRET"),
        "redirect_uri":  os.getenv("SLACK_REDIRECT_URI", "http://localhost:8000/api/auth/slack/callback"),
        "frontend_url":  os.getenv("FRONTEND_URL", "http://localhost:5173"),
    }


@router.get("/auth/slack")
def slack_login():
    cfg = _cfg()
    if not cfg["client_id"]:
        raise HTTPException(status_code=500, detail="SLACK_CLIENT_ID 환경변수가 설정되지 않았습니다")
    url = (
        f"https://slack.com/oauth/v2/authorize"
        f"?client_id={cfg['client_id']}"
        f"&user_scope=identity.basic,identity.email,identity.avatar"
        f"&redirect_uri={cfg['redirect_uri']}"
    )
    return RedirectResponse(url)


@router.get("/auth/slack/callback")
async def slack_callback(
    code: str = None,
    error: str = None,
    db: Session = Depends(get_db),
):
    cfg = _cfg()
    if error or not code:
        return RedirectResponse(f"{cfg['frontend_url']}/auth/callback?error=access_denied")

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "client_id":     cfg["client_id"],
                "client_secret": cfg["client_secret"],
                "code":          code,
                "redirect_uri":  cfg["redirect_uri"],
            },
        )
    token_data = token_resp.json()
    if not token_data.get("ok"):
        return RedirectResponse(f"{cfg['frontend_url']}/auth/callback?error=slack_error")

    user_token = token_data["authed_user"]["access_token"]

    async with httpx.AsyncClient() as client:
        identity_resp = await client.get(
            "https://slack.com/api/users.identity",
            headers={"Authorization": f"Bearer {user_token}"},
        )
    identity = identity_resp.json()
    if not identity.get("ok"):
        return RedirectResponse(f"{cfg['frontend_url']}/auth/callback?error=identity_error")

    slack_user_id = identity["user"]["id"]
    name          = identity["user"]["name"]
    email         = identity["user"].get("email")
    avatar_url    = identity["user"].get("image_72")

    user = db.query(User).filter(User.slack_user_id == slack_user_id).first()
    if user:
        user.name = name
        user.email = email
        user.avatar_url = avatar_url
    else:
        user = User(slack_user_id=slack_user_id, name=name, email=email, avatar_url=avatar_url)
        db.add(user)
    db.commit()
    db.refresh(user)

    token = create_jwt(user.id)
    return RedirectResponse(f"{cfg['frontend_url']}/auth/callback?token={token}")


@router.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id":         current_user.id,
        "name":       current_user.name,
        "email":      current_user.email,
        "avatar_url": current_user.avatar_url,
    }


@router.post("/auth/logout")
def logout():
    return {"message": "로그아웃되었습니다"}
