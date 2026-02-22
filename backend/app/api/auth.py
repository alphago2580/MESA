from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from passlib.context import CryptContext

from ..core.database import get_db
from ..core.config import settings
from ..models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7일


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    email: str
    report_level: str
    report_frequency: str
    selected_indicators: list
    push_enabled: bool

    class Config:
        from_attributes = True


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증이 필요합니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        report_level=user.report_level.value,
        report_frequency=user.report_frequency.value,
        selected_indicators=user.selected_indicators or [],
        push_enabled=user.push_enabled,
    )


@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    token = create_access_token({"sub": user.email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        report_level=current_user.report_level.value,
        report_frequency=current_user.report_frequency.value,
        selected_indicators=current_user.selected_indicators or [],
        push_enabled=current_user.push_enabled,
    )


@router.patch("/me", response_model=UserResponse)
async def update_me(
    profile: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """프로필 수정 — 이메일 및/또는 비밀번호 변경"""
    # 새 비밀번호 변경 시 현재 비밀번호 필수
    if profile.new_password is not None:
        if profile.current_password is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비밀번호 변경 시 현재 비밀번호를 입력해야 합니다",
            )
        if not verify_password(profile.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 비밀번호가 올바르지 않습니다",
            )
        current_user.hashed_password = get_password_hash(profile.new_password)

    # 이메일 변경 시 중복 확인
    if profile.email is not None and profile.email != current_user.email:
        result = await db.execute(select(User).where(User.email == profile.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 이메일입니다",
            )
        current_user.email = profile.email

    await db.commit()
    await db.refresh(current_user)
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        report_level=current_user.report_level.value,
        report_frequency=current_user.report_frequency.value,
        selected_indicators=current_user.selected_indicators or [],
        push_enabled=current_user.push_enabled,
    )
