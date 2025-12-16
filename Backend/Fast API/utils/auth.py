from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

# إعدادات JWT
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# إعداد bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class TokenData(BaseModel):
    email: str
    user_type: str
    user_id: str

def get_password_hash(password: str) -> str:
    """
    تشفير كلمة المرور
    bcrypt يدعم فقط 72 byte، لذا نقطع كلمة المرور إذا كانت أطول
    """
    # ✅ قطع كلمة المرور إلى 72 حرف كحد أقصى
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    التحقق من كلمة المرور
    """
    # ✅ قطع كلمة المرور إلى 72 حرف كحد أقصى
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """
    إنشاء JWT token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    الحصول على المستخدم الحالي من Token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        user_id: str = payload.get("user_id")
        
        if email is None or user_type is None:
            raise credentials_exception
        
        return TokenData(email=email, user_type=user_type, user_id=user_id)
    
    except JWTError:
        raise credentials_exception