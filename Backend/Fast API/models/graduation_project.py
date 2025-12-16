from pydantic import BaseModel, Field
from typing import List, Optional

class GraduationProject(BaseModel):
    project_title: str = Field(..., description="عنوان مشروع التخرج")
    collage: str = Field(..., description="اسم الكلية أو الجامعة")
    department: str = Field(..., description="القسم الأكاديمي")
    technologies_used: Optional[List[str]] = Field(default=[], description="التقنيات المستخدمة")
    year: int = Field(..., description="سنة المشروع")
    abstract: Optional[str] = Field(None, description="ملخص المشروع")
    supervisors: Optional[List[str]] = Field(default=[], description="قائمة المشرفين")
    tags: Optional[List[str]] = Field(default=[], description="الوسوم أو الكلمات المفتاحية")
    project_scope: Optional[str] = Field(None, description="نطاق المشروع")
    required_skills: Optional[List[str]] = Field(default=[], description="المهارات المطلوبة")
    project_domain: Optional[str] = Field(None, description="المجال أو التخصص")
    embedding: Optional[List[float]] = Field(default=[], description="تمثيل رقمي (Embedding) لاستخدامه مع GPT+RAG")
