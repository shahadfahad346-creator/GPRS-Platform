from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    user_type: str  # "student" or "supervisor"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    
    # Student specific
    student_id: Optional[str] = None
    major: Optional[str] = None
    
    # Supervisor specific
    department: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_type: Optional[str] = None

class UserInDB(UserBase):
    hashed_password: str