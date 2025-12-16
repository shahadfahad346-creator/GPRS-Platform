from fastapi import APIRouter, HTTPException, Depends, status
from config.database_config import db
from bson import ObjectId
from typing import List, Optional
from pydantic import BaseModel
from utils.auth import get_current_user
from datetime import datetime

router = APIRouter()
students_collection = db["student"]
ideas_collection = db["IdeaAnalysis"]

# ========================================
# 📚 Models
# ========================================

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    skills: Optional[List[str]] = None
    frameworks: Optional[List[str]] = None
    groupName: Optional[str] = None
    groupMembers: Optional[List[dict]] = None

class GroupMember(BaseModel):
    id: str
    name: str
    email: str
    isLeader: bool

class IdeaData(BaseModel):
    title: str
    description: str
    keywords: List[str]
    score: int
    strengths: List[str]
    improvements: List[str]
    recommendedSupervisors: List[str]
    status: Optional[str] = "Analyzed"
    date: Optional[str] = None

# ========================================
# 🔧 Helper Functions
# ========================================

def fix_id(doc):
    """تحويل ObjectId إلى string"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ========================================
# 📍 Profile Endpoints
# ========================================

@router.get("/profile")
async def get_current_student_profile(current_user = Depends(get_current_user)):
    """
    ✨ جلب بيانات الطالب الحالي من الـ token
    """
    try:
        print(f"📋 [Students] Getting profile for user: {current_user.email}")
        
        student = students_collection.find_one({"email": current_user.email})
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )
        
        print(f"✅ [Students] Profile found for: {student.get('name')}")
        return fix_id(student)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Students] Error fetching profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile"
        )

@router.put("/profile")
async def update_current_student_profile(
    update_data: StudentUpdate,
    current_user = Depends(get_current_user)
):
    """
    ✨ تحديث بيانات الطالب الحالي
    """
    try:
        student = students_collection.find_one({"email": current_user.email})
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )
        
        student_id = str(student["_id"])
        
        # تحضير البيانات للتحديث
        update_fields = {}
        if update_data.name is not None:
            update_fields["name"] = update_data.name
        if update_data.skills is not None:
            update_fields["skills"] = update_data.skills
        if update_data.frameworks is not None:
            update_fields["frameworks"] = update_data.frameworks
        if update_data.groupName is not None:
            update_fields["groupName"] = update_data.groupName
        if update_data.groupMembers is not None:
            update_fields["groupMembers"] = update_data.groupMembers
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        print(f"📝 [Students] Updating profile for {current_user.email}:", update_fields.keys())
        
        result = students_collection.update_one(
            {"_id": ObjectId(student_id)},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        updated_student = students_collection.find_one({"_id": ObjectId(student_id)})
        
        print(f"✅ [Students] Profile updated successfully")
        
        return {
            "message": "Profile updated successfully",
            "student": fix_id(updated_student)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Students] Error updating profile: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

# ========================================
# 💡 Ideas Endpoints (NEW)
# ========================================

@router.get("/profile/ideas")
async def get_current_student_ideas(current_user = Depends(get_current_user)):
    """
    ✨ جلب الأفكار المحللة للطالب الحالي
    يستخدمها Frontend لعرض الأفكار في My Profile
    """
    try:
        print(f"💡 [Students] Getting ideas for user: {current_user.email}")
        
        student = students_collection.find_one({"email": current_user.email})
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )
        
        student_id = str(student["_id"])
        
        # جلب الأفكار من collection "IdeaAnalysis"
        ideas = list(ideas_collection.find({"student_id": student_id}))
        
        print(f"✅ [Students] Found {len(ideas)} ideas for student")
        
        return [fix_id(idea) for idea in ideas]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Students] Error fetching ideas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch ideas"
        )

@router.post("/profile/ideas")
async def save_analyzed_idea(
    idea_data: IdeaData,
    current_user = Depends(get_current_user)
):
    """
    ✨ حفظ فكرة محللة جديدة
    يستدعيها Frontend بعد تحليل الفكرة في Smart Analysis
    """
    try:
        print(f"💾 [Students] Saving idea for user: {current_user.email}")
        
        student = students_collection.find_one({"email": current_user.email})
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )
        
        student_id = str(student["_id"])
        
        # تحضير بيانات الفكرة
        idea_document = {
            "student_id": student_id,
            "student_email": current_user.email,
            "student_name": student.get("name", ""),
            "title": idea_data.title,
            "description": idea_data.description,
            "keywords": idea_data.keywords,
            "status": idea_data.status,
            "score": idea_data.score,
            "strengths": idea_data.strengths,
            "improvements": idea_data.improvements,
            "recommendedSupervisors": idea_data.recommendedSupervisors,
            "date": idea_data.date or datetime.now().isoformat(),
            "created_at": datetime.now().isoformat()
        }
        
        # حفظ في قاعدة البيانات
        result = ideas_collection.insert_one(idea_document)
        
        print(f"✅ [Students] Idea saved with ID: {result.inserted_id}")
        
        # إرجاع الفكرة المحفوظة
        saved_idea = ideas_collection.find_one({"_id": result.inserted_id})
        return fix_id(saved_idea)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Students] Error saving idea: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save idea: {str(e)}"
        )

@router.delete("/profile/ideas/{idea_id}")
async def delete_analyzed_idea(
    idea_id: str,
    current_user = Depends(get_current_user)
):
    """
    ✨ حذف فكرة محللة
    """
    try:
        print(f"🗑️ [Students] Deleting idea {idea_id} for user: {current_user.email}")
        
        student = students_collection.find_one({"email": current_user.email})
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )
        
        student_id = str(student["_id"])
        
        # حذف الفكرة (فقط إذا كانت تخص هذا الطالب)
        result = ideas_collection.delete_one({
            "_id": ObjectId(idea_id),
            "student_id": student_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Idea not found or you don't have permission to delete it"
            )
        
        print(f"✅ [Students] Idea deleted successfully")
        
        return {
            "message": "Idea deleted successfully",
            "deleted_id": idea_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Students] Error deleting idea: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete idea"
        )

# ========================================
# 📍 Other Endpoints
# ========================================

@router.get("/")
async def get_all_students():
    """جلب كل الطلاب"""
    try:
        students = list(students_collection.find())
        return [fix_id(s) for s in students]
    except Exception as e:
        print(f"❌ [Students] Error fetching students: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch students"
        )

@router.get("/{student_id}")
async def get_student_by_id(student_id: str):
    """جلب بيانات طالب محدد"""
    try:
        student = students_collection.find_one({"_id": ObjectId(student_id)})
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        return fix_id(student)
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Students] Error fetching student: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student ID"
        )

@router.get("/{student_id}/ideas")
async def get_student_ideas(student_id: str):
    """جلب الأفكار المحللة للطالب (للمشرفين)"""
    try:
        ideas = list(ideas_collection.find({"student_id": student_id}))
        return [fix_id(idea) for idea in ideas]
    except Exception as e:
        print(f"❌ [Students] Error fetching ideas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch ideas"
        )

@router.get("/email/{email}")
async def get_student_by_email(email: str):
    """البحث عن طالب بالإيميل"""
    try:
        student = students_collection.find_one({"email": email})
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        return fix_id(student)
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Students] Error fetching student by email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch student"
        )