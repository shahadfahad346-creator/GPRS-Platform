from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Idea(BaseModel):
    title: str = Field(..., description="عنوان الفكرة")
    description: str = Field(..., description="وصف الفكرة")
    objectives: Optional[List[str]] = Field(default=[], description="الأهداف")
    technologies: Optional[List[str]] = Field(default=[], description="التقنيات المستخدمة")
    skills_required: Optional[List[str]] = Field(default=[], description="المهارات المطلوبة")
    student_id: str = Field(..., description="معرّف الطالب صاحب الفكرة")
    analysis: Optional[Dict[str, Any]] = Field(None, description="نتيجة التحليل الذكي")
    language: Optional[str] = Field(default="ar", description="لغة التحليل: ar أو en")