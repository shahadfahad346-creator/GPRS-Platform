from fastapi import APIRouter, HTTPException, Query
from config.database_config import db
from models.supervisor import Supervisor
from bson import ObjectId
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# ========================================
# 📌 Router Configuration
# ========================================
router = APIRouter(prefix="/api/supervisors")
supervisors_collection = db["Supervisor"]
ideas_collection = db["ProjectIdeas"]

# ========================================
# 🔧 Helper Functions
# ========================================
def fix_id(doc):
    """تحويل ObjectId إلى string"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ========================================
# 📋 Pydantic Models
# ========================================
class ResearchPaper(BaseModel):
    title: str
    year: int
    journal: Optional[str] = None
    doi: Optional[str] = None
    researchInterest: Optional[str] = None

class SupervisorProfileUpdate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    specialization: Optional[str] = None
    researchInterests: Optional[List[str]] = []
    researchPapers: Optional[List[ResearchPaper]] = []
    publications: Optional[int] = 0

class ProjectIdea(BaseModel):
    title: str
    description: str
    category: str
    supervisorEmail: EmailStr

class IdeaManageRequest(BaseModel):
    action: str  # "update" or "delete"
    ideaId: str
    ideaData: Optional[ProjectIdea] = None

# ========================================
# 👥 Supervisor Endpoints (للطلاب)
# ========================================

@router.get("/")
async def get_supervisors():
    """
    ✅ جلب جميع المشرفين (للطلاب)
    GET /api/supervisors/
    """
    try:
        supervisors = list(supervisors_collection.find())
        return {
            "success": True,
            "data": [fix_id(s) for s in supervisors],
            "count": len(supervisors)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching supervisors: {str(e)}")

@router.post("/")
async def add_supervisor(supervisor: Supervisor):
    """
    ✅ إضافة مشرف جديد
    POST /api/supervisors/
    """
    try:
        result = supervisors_collection.insert_one(supervisor.dict())
        return {
            "success": True,
            "id": str(result.inserted_id),
            "message": "✅ Supervisor added successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding supervisor: {str(e)}")

@router.get("/{supervisor_id}")
async def get_supervisor(supervisor_id: str):
    """
    ✅ جلب مشرف محدد بالـ ID
    GET /api/supervisors/{supervisor_id}
    """
    try:
        supervisor = supervisors_collection.find_one({"_id": ObjectId(supervisor_id)})
        if supervisor:
            return {
                "success": True,
                "data": fix_id(supervisor)
            }
        raise HTTPException(status_code=404, detail="❌ Supervisor not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"❌ Invalid supervisor ID: {str(e)}")

# ========================================
# 👨‍🏫 Supervisor Profile Management
# ========================================

@router.get("/profile")
async def get_supervisor_profile(email: str = Query(..., description="Supervisor email")):
    """
    ✅ جلب بروفايل المشرف بالـ email
    GET /api/supervisors/profile?email=...
    """
    try:
        print(f"🔍 [Supervisor Routes] Fetching profile for: {email}")
        
        supervisor = supervisors_collection.find_one({"email": email})
        
        if not supervisor:
            print(f"❌ [Supervisor Routes] Supervisor not found: {email}")
            raise HTTPException(status_code=404, detail="Supervisor not found")
        
        print(f"✅ [Supervisor Routes] Found supervisor: {supervisor.get('name', 'N/A')}")
        print(f"📖 [Supervisor Routes] Research field check:")
        print(f"   - Research: {supervisor.get('Research', [])}")
        print(f"   - researchInterests: {supervisor.get('researchInterests', [])}")
        
        # ✅ ربط Research من MongoDB
        research_interests = supervisor.get('researchInterests') or supervisor.get('Research') or []
        
        supervisor_data = {
            "_id": str(supervisor["_id"]),
            "email": supervisor["email"],
            "name": supervisor.get("name", ""),
            "specialization": supervisor.get("specialization", ""),
            "researchInterests": research_interests if isinstance(research_interests, list) else [],
            "researchPapers": supervisor.get("researchPapers", []),
            "publications": len(supervisor.get("researchPapers", [])),
            "hasProfile": True
        }
        
        print(f"✅ [Supervisor Routes] Returning researchInterests count: {len(supervisor_data['researchInterests'])}")
        
        return {
            "success": True,
            "data": supervisor_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Supervisor Routes] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@router.put("/profile")
async def update_supervisor_profile(profile: SupervisorProfileUpdate):
    """
    ✅ تحديث بروفايل المشرف
    PUT /api/supervisors/profile
    """
    try:
        print(f"💾 [Supervisor Routes] Updating profile for: {profile.email}")
        
        supervisor = supervisors_collection.find_one({"email": profile.email})
        
        if not supervisor:
            raise HTTPException(status_code=404, detail="Supervisor not found")
        
        # تحديث البيانات
        update_data = {
            "name": profile.name,
            "specialization": profile.specialization,
            "researchInterests": profile.researchInterests,
            "Research": profile.researchInterests,  # ✅ تحديث Research أيضاً
            "researchPapers": [paper.dict() for paper in profile.researchPapers] if profile.researchPapers else [],
            "publications": profile.publications,
            "hasProfile": True
        }
        
        # حذف القيم الـ None
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = supervisors_collection.update_one(
            {"email": profile.email},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            print(f"✅ [Supervisor Routes] Profile updated successfully")
            return {
                "success": True,
                "message": "Profile updated successfully"
            }
        else:
            print(f"⚠️ [Supervisor Routes] No changes made")
            return {
                "success": True,
                "message": "No changes made"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Supervisor Routes] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

# ========================================
# 💡 Supervisor Ideas Management
# ========================================

@router.get("/ideas", tags=["Ideas"])
async def get_supervisor_ideas(email: str = Query(..., description="Supervisor email")):
    """
    ✅ جلب جميع أفكار المشرف
    GET /api/supervisor/ideas?email=...
    """
    try:
        print(f"🔍 [Supervisor Routes] Fetching ideas for: {email}")
        
        ideas = list(ideas_collection.find({"supervisorEmail": email}))
        
        print(f"✅ [Supervisor Routes] Found {len(ideas)} ideas")
        
        return {
            "success": True,
            "data": [fix_id(idea) for idea in ideas],
            "count": len(ideas)
        }
        
    except Exception as e:
        print(f"❌ [Supervisor Routes] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching ideas: {str(e)}")

@router.post("/ideas", tags=["Ideas"])
async def add_supervisor_idea(idea: ProjectIdea):
    """
    ✅ إضافة فكرة مشروع جديدة
    POST /api/supervisor/ideas
    """
    try:
        print(f"➕ [Supervisor Routes] Adding new idea: {idea.title}")
        
        idea_data = {
            "title": idea.title,
            "description": idea.description,
            "category": idea.category,
            "supervisorEmail": idea.supervisorEmail,
            "createdAt": "2025-01-26"  # يمكن استخدام datetime
        }
        
        result = ideas_collection.insert_one(idea_data)
        
        print(f"✅ [Supervisor Routes] Idea added with ID: {result.inserted_id}")
        
        return {
            "success": True,
            "id": str(result.inserted_id),
            "message": "Idea added successfully"
        }
        
    except Exception as e:
        print(f"❌ [Supervisor Routes] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding idea: {str(e)}")

@router.post("/ideas/manage", tags=["Ideas"])
async def manage_supervisor_idea(request: IdeaManageRequest):
    """
    ✅ تعديل أو حذف فكرة مشروع
    POST /api/supervisor/ideas/manage
    Body: { "action": "update" | "delete", "ideaId": "...", "ideaData": {...} }
    """
    try:
        print(f"🔧 [Supervisor Routes] Managing idea: {request.action} - {request.ideaId}")
        
        if request.action == "update":
            if not request.ideaData:
                raise HTTPException(status_code=400, detail="ideaData is required for update")
            
            update_data = {
                "title": request.ideaData.title,
                "description": request.ideaData.description,
                "category": request.ideaData.category
            }
            
            result = ideas_collection.update_one(
                {"_id": ObjectId(request.ideaId)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Idea not found")
            
            print(f"✅ [Supervisor Routes] Idea updated successfully")
            return {
                "success": True,
                "message": "Idea updated successfully"
            }
            
        elif request.action == "delete":
            result = ideas_collection.delete_one({"_id": ObjectId(request.ideaId)})
            
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Idea not found")
            
            print(f"✅ [Supervisor Routes] Idea deleted successfully")
            return {
                "success": True,
                "message": "Idea deleted successfully"
            }
            
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'update' or 'delete'")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Supervisor Routes] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error managing idea: {str(e)}")