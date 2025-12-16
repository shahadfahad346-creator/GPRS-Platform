from pydantic import BaseModel, Field
from typing import List, Optional

class Student(BaseModel):
    full_name: str = Field(..., description="اسم الطالب")
    email: str = Field(..., description="البريد الجامعي")
    university_id: str = Field(..., description="الرقم الجامعي")
    major: str = Field(..., description="تخصص الطالب")
    skills: Optional[List[str]] = Field(default=[], description="المهارات")
    
    
