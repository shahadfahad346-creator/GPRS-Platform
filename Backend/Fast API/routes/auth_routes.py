from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from config.database_config import db
from models.user import UserCreate, Token
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from datetime import datetime
from bson import ObjectId
import re

router = APIRouter()

students_collection = db["student"]
supervisors_collection = db["Instructors"]

# ========================================
# ✅ Login Model (بدون Pydantic BaseModel منفصل)
# ========================================
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ========================================
# دوال التحقق (Validators)
# ========================================

def validate_student_email(email: str) -> bool:
    """التحقق من صيغة بريد الطالب"""
    pattern = r'^\d{9}@stu\.bu\.edu\.sa$'
    if not re.match(pattern, email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student email. Must be: 9digits@stu.bu.edu.sa"
        )
    return True

def validate_supervisor_email(email: str) -> bool:
    """التحقق من صيغة بريد المشرف"""
    if email.endswith('@stu.bu.edu.sa'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supervisors cannot use @stu.bu.edu.sa email"
        )
    
    if not email.endswith('@bu.edu.sa'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid supervisor email. Must end with @bu.edu.sa"
        )
    return True

def validate_password(password: str) -> bool:
    """التحقق من قوة كلمة المرور"""
    errors = []
    
    if len(password) < 8:
        errors.append("At least 8 characters")
    if not re.search(r'[A-Z]', password):
        errors.append("One uppercase letter (A-Z)")
    if not re.search(r'[a-z]', password):
        errors.append("One lowercase letter (a-z)")
    if not re.search(r'\d', password):
        errors.append("One number (0-9)")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("One special character (!@#$%...)")
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Password does not meet requirements",
                "requirements": errors
            }
        )
    
    return True

# ========================================
# ✅ Authentication Routes
# ========================================

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """تسجيل مستخدم جديد"""
    try:
        # التحقق من صيغة البريد
        if user.user_type == "student":
            validate_student_email(user.email)
        else:
            validate_supervisor_email(user.email)
        
        # التحقق من قوة كلمة المرور
        validate_password(user.password)
        
        # التحقق من وجود البريد مسبقاً
        if user.user_type == "student":
            existing = students_collection.find_one({"email": user.email})
            collection = students_collection
        else:
            existing = supervisors_collection.find_one({"Email": user.email})
            collection = supervisors_collection
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # تشفير كلمة المرور
        hashed_password = get_password_hash(user.password)
        
        print(f"🔐 [Register] Hashing password for: {user.email}")
        
        # إنشاء بيانات المستخدم
        if user.user_type == "student":
            user_data = {
                "email": user.email,
                "full_name": user.full_name,
                "hashed_password": hashed_password,
                "user_type": user.user_type,
                "student_id": user.student_id,
                "major": user.major,
                "skills": [],
                "team_id": None,
                "created_at": datetime.utcnow()
            }
        else:
            user_data = {
                "Email": user.email,
                "Name": user.full_name,
                "hashed_password": hashed_password,
                "user_type": user.user_type,
                "Department": user.department,
                "research_interests": [],
                "created_at": datetime.utcnow()
            }
        
        result = collection.insert_one(user_data)
        print(f"✅ [Register] User created with ID: {result.inserted_id}")
        
        # إنشاء token
        access_token = create_access_token(
            data={
                "sub": user.email,
                "user_type": user.user_type,
                "user_id": str(result.inserted_id)
            }
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_type": user.user_type,
            "user_id": str(result.inserted_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Register] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """
    ✅ تسجيل الدخول - يقبل JSON مباشرة
    """
    try:
        print(f"🔐 [Login] Attempt for: {user.email}")
        print(f"📦 [Login] Password length: {len(user.password)}")
        
        # البحث في students أولاً
        student = students_collection.find_one({"email": user.email})
        
        if student:
            print(f"👤 [Login] Student found: {user.email}")
            print(f"🔑 [Login] Has hashed_password: {bool(student.get('hashed_password'))}")
            
            stored_hash = student.get("hashed_password", "")
            if not stored_hash:
                print(f"❌ [Login] No password hash in database!")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Account configuration error. Please contact support."
                )
            
            print(f"🔐 [Login] Verifying password...")
            if not verify_password(user.password, stored_hash):
                print(f"❌ [Login] Invalid password for: {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )
            
            print(f"✅ [Login] Password verified for: {user.email}")
            
            access_token = create_access_token(
                data={
                    "sub": user.email,
                    "user_type": "student",
                    "user_id": str(student["_id"])
                }
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_type": "student",
                "user_id": str(student["_id"])
            }
        
        # البحث في supervisors
        supervisor = supervisors_collection.find_one({"Email": user.email})
        
        if supervisor:
            print(f"👨‍🏫 [Login] Supervisor found: {user.email}")
            print(f"🔑 [Login] Has hashed_password: {bool(supervisor.get('hashed_password'))}")
            
            stored_hash = supervisor.get("hashed_password", "")
            if not stored_hash:
                print(f"❌ [Login] No password hash in database!")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Account configuration error. Please contact support."
                )
            
            print(f"🔐 [Login] Verifying password...")
            if not verify_password(user.password, stored_hash):
                print(f"❌ [Login] Invalid password for: {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )
            
            print(f"✅ [Login] Password verified for: {user.email}")
            
            access_token = create_access_token(
                data={
                    "sub": user.email,
                    "user_type": "supervisor",
                    "user_id": str(supervisor["_id"])
                }
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_type": "supervisor",
                "user_id": str(supervisor["_id"])
            }
        
        print(f"❌ [Login] User not found: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Login] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    """الحصول على معلومات المستخدم الحالي"""
    try:
        print(f"👤 [Get User] Fetching info for: {current_user.email}")
        
        if current_user.user_type == "student":
            user = students_collection.find_one({"email": current_user.email})
        else:
            user = supervisors_collection.find_one({"Email": current_user.email})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Convert ObjectId to string
        user["_id"] = str(user["_id"])
        
        # Remove sensitive data
        user.pop("hashed_password", None)
        user.pop("password", None)  # احتياطي
        
        print(f"✅ [Get User] User data retrieved for: {current_user.email}")
        
        return user
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Get User] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )