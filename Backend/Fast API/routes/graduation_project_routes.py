from fastapi import APIRouter, HTTPException, Query
from config.database_config import db
from models.graduation_project import GraduationProject
from bson import ObjectId
from typing import Optional

router = APIRouter()

projects_collection = db["Graduation Projects BU"]

def fix_id(project):
    """تحويل ObjectId إلى string وتنظيف البيانات"""
    if project is None:
        return None
    
    # ✅ تحويل _id
    project["_id"] = str(project["_id"])
    
    # ✅ إضافة title للتوافق مع Frontend
    if "project_title" in project and "title" not in project:
        project["title"] = project["project_title"]
    
    # ✅ التأكد من وجود abstract
    if "abstract" not in project or not project["abstract"]:
        project["abstract"] = "N/A"
    
    # ✅ التأكد من وجود supervisors
    if "supervisors" not in project:
        project["supervisors"] = []
    
    return project

@router.post("/")
def create_project(project: GraduationProject):
    """إضافة مشروع جديد"""
    result = projects_collection.insert_one(project.dict())
    return {"id": str(result.inserted_id), "message": "✅ Project added successfully"}

@router.get("/")
def get_projects():
    """
    ✅ جلب جميع المشاريع - Simple Version
    يرجع Array مباشرة للتوافق مع Frontend
    """
    projects = list(projects_collection.find().limit(100))
    return [fix_id(p) for p in projects]

@router.get("/{project_id}")
def get_project(project_id: str):
    """جلب مشروع واحد بالـ ID"""
    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
        if project:
            return fix_id(project)
        raise HTTPException(status_code=404, detail="❌ Project not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"❌ Invalid project ID: {str(e)}")

@router.get("/search/by-title")
def search_projects_by_title(q: str = Query(..., min_length=2)):
    """
    البحث في المشاريع بالعنوان
    """
    projects = list(
        projects_collection.find({
            "project_title": {"$regex": q, "$options": "i"}
        }).limit(50)
    )
    
    return [fix_id(p) for p in projects]

@router.put("/{project_id}")
def update_project(project_id: str, project: GraduationProject):
    """تحديث مشروع موجود"""
    try:
        result = projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": project.dict(exclude_unset=True)}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="❌ Project not found")
        
        return {"message": "✅ Project updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"❌ Error: {str(e)}")

@router.delete("/{project_id}")
def delete_project(project_id: str):
    """حذف مشروع"""
    try:
        result = projects_collection.delete_one({"_id": ObjectId(project_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="❌ Project not found")
        
        return {"message": "✅ Project deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"❌ Error: {str(e)}")