from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import get_db
from app.models.models import User, AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="بيانات الدخول غير صالحة أو منتهية الصلاحية",
    )
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_error
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise credentials_error
    return user


def require_roles(*allowed_roles: str):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="لا تملك الصلاحية للوصول إلى هذا المورد",
            )
        return current_user
    return checker


def log_action(db: Session, user_id: int, action: str, entity: str, entity_id: int | None = None, metadata: dict | None = None):
    entry = AuditLog(user_id=user_id, action=action, entity=entity, entity_id=entity_id, log_metadata=metadata)
    db.add(entry)
    db.commit()
