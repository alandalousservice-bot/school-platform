from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password, create_access_token, generate_refresh_token,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.core.deps import get_current_user
from app.database import get_db
from app.models.models import User, RefreshToken
from app.schemas.schemas import LoginRequest, TokenResponse, RefreshRequest

router = APIRouter(prefix="/api/auth", tags=["المصادقة"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="اسم المستخدم أو كلمة المرور غير صحيحة")

    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = generate_refresh_token()
    db.add(RefreshToken(
        token=refresh_token,
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    user.last_login_at = datetime.utcnow()
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role.value,
        full_name=user.full_name,
        user_id=user.id,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_row = db.query(RefreshToken).filter(RefreshToken.token == payload.refresh_token).first()
    if not token_row or token_row.revoked or token_row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="جلسة العمل منتهية، الرجاء تسجيل الدخول من جديد")

    user = db.query(User).filter(User.id == token_row.user_id).first()
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return TokenResponse(
        access_token=access_token,
        refresh_token=payload.refresh_token,
        role=user.role.value,
        full_name=user.full_name,
        user_id=user.id,
    )


@router.post("/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_row = db.query(RefreshToken).filter(RefreshToken.token == payload.refresh_token).first()
    if token_row:
        token_row.revoked = True
        db.commit()
    return {"message": "تم تسجيل الخروج بنجاح"}


@router.post("/heartbeat")
def heartbeat(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """تحديث آخر ظهور للحساب؛ تستعمله التطبيقات المثبتة كل 30 ثانية."""
    current_user.last_login_at = datetime.utcnow()
    db.commit()
    return {"status": "online", "last_seen": current_user.last_login_at.isoformat()}
