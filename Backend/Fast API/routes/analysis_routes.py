# routes/analysis_routes.py (محسّن - مع مقارنة المهارات الذكية + دعم اللغتين)

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from config.database_config import db
from services.rag_service import rag_service
from services.gemini_service import gemini_service 
from services.embedding_service import embedding_service
from services.supervisor_recommendation import supervisor_recommendation
from utils.prompts import (
    create_initial_analysis_prompt, 
    create_extended_analysis_prompt,
    extract_json_safely
)
from routes.language_detector import detect_combined_language
from bson import ObjectId
import datetime
from datetime import UTC 

import json 
import traceback

router = APIRouter()

students_collection = db["users"]
ideas_collection = db["IdeaAnalysis"]

# ============================================================================
# 📚 Models
# ============================================================================
class AnalysisRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20, max_length=2000)
    technologies: Optional[List[str]] = Field(default=None)
    student_id: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    language: str = Field(default="en")

class AnalysisResult(BaseModel):
    id: str
    message: str
    stage_1_initial_analysis: dict
    stage_2_extended_analysis: dict
    similar_projects: list
    recommended_supervisors: list

# ============================================================================
# 🛠️ Helper Functions
# ============================================================================

def fix_id(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def clean_objectid_recursive(obj):
    if isinstance(obj, dict):
        return {k: clean_objectid_recursive(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_objectid_recursive(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

# 🆕 دالة جديدة: مقارنة المهارات وتصنيفها
def compare_skills(required_skills: List[str], student_skills: List[str]) -> Dict:
    """
    مقارنة ذكية بين المهارات المطلوبة ومهارات الطالب
    
    Returns:
        {
            "matched": [...],  # مهارات موجودة (أخضر)
            "gaps": [...],     # مهارات ناقصة (أحمر)
            "match_percentage": 75.0
        }
    """
    if not required_skills:
        return {"matched": [], "gaps": [], "match_percentage": 0.0}
    
    if not student_skills:
        return {
            "matched": [], 
            "gaps": required_skills, 
            "match_percentage": 0.0
        }
    
    # تحويل إلى lowercase للمقارنة
    student_skills_lower = [s.lower().strip() for s in student_skills]
    required_skills_lower = [s.lower().strip() for s in required_skills]
    
    matched = []
    gaps = []
    
    # خوارزمية مطابقة ذكية (تدعم المرادفات والاختصارات)
    synonyms = {
        "python": ["python3", "py"],
        "javascript": ["js", "node", "nodejs", "node.js"],
        "react": ["reactjs", "react.js"],
        "machine learning": ["ml", "deep learning", "dl"],
        "artificial intelligence": ["ai", "ml"],
        "database": ["sql", "mysql", "postgresql", "mongodb"],
        "git": ["github", "version control"],
        "docker": ["containerization", "containers"],
        "api": ["rest api", "restful", "rest"],
    }
    
    for req_skill in required_skills:
        req_lower = req_skill.lower().strip()
        found = False
        
        # 1. مطابقة مباشرة
        if req_lower in student_skills_lower:
            matched.append(req_skill)
            found = True
            continue
        
        # 2. مطابقة جزئية (substring)
        for student_skill in student_skills_lower:
            if req_lower in student_skill or student_skill in req_lower:
                matched.append(req_skill)
                found = True
                break
        
        if found:
            continue
        
        # 3. مطابقة المرادفات
        for key, values in synonyms.items():
            if req_lower == key or req_lower in values:
                for student_skill in student_skills_lower:
                    if student_skill == key or student_skill in values:
                        matched.append(req_skill)
                        found = True
                        break
            if found:
                break
        
        # إذا لم توجد مطابقة، تُضاف للفجوات
        if not found:
            gaps.append(req_skill)
    
    # حساب نسبة التطابق
    match_percentage = (len(matched) / len(required_skills)) * 100 if required_skills else 0.0
    
    return {
        "matched": matched,
        "gaps": gaps,
        "match_percentage": round(match_percentage, 1)
    }

def create_fallback_extended_analysis(
    initial_analysis: dict, 
    supervisors: list, 
    similar_projects: list
) -> dict:
    """Fallback محسّن مع دعم المهارات"""
    project_title = initial_analysis.get('Project_Title', 'the project')
    technical_domain = initial_analysis.get('Domain', {}).get('Technical_Domain', 'related technologies')
    general_domain = initial_analysis.get('Domain', {}).get('General_Domain', 'the field')
    
    formatted_supervisors = []
    for i, s in enumerate(supervisors[:5]):
        name = s.get("Name") or s.get("name", "Unknown Supervisor")
        dept = s.get("Department") or s.get("department", "N/A")
        email = s.get("Email") or s.get("email", "N/A")
        papers_count = len(s.get("recent_papers", []))
        
        justification = (
            f"{s.get('justification', '') or s.get('explanation', '') or f'هذا المشرف من قسم {dept} يمتلك خبرة في {technical_domain} ولديه {papers_count} بحث حديث مما يجعله مناسباً لإشراف {project_title}.'}"
        )
        
        formatted_supervisors.append({
            "Name": name,
            "Department": dept,
            "Email": email,
            "Justification": justification
        })
    
    formatted_projects = []
    for p in similar_projects[:5]:
        title = p.get("title") or p.get("project_title") or p.get("projrct_title", "Related Project")
        year = p.get("year", "N/A")
        dept = p.get("department", "N/A")
        domain = p.get("project_domain", general_domain)
        
        relevance = (
            f"هذا المشروع من عام {year} وقسم {dept} يستكشف تحديات مماثلة في مجال {domain}، ويوفر نظرة قيمة لفكرة {project_title}."
        )
        
        formatted_projects.append({
            "Title": title,
            "Year": year,
            "Department": dept,
            "Relevance": relevance
        })
    
    improvements = [
        f"يجب تحسين صياغة المشكلة لتكون أكثر تركيزاً على جانب {technical_domain}.",
        f"اقترح استخدام ممارسات {technical_domain} الحديثة لتعزيز قابلية التوسع.",
        f"يجب تطبيق اختبارات أداء قوية للتأكد من كفاءة {project_title}.",
    ]
    
    executive_summary = initial_analysis.get('Executive_Summary', '')
    
    final_summary = (
        f"{executive_summary} "
        f"يهدف هذا المشروع إلى معالجة الاحتياجات في مجال {general_domain} باستخدام تقنيات {technical_domain} المذكورة."
    )
    
    return {
        "Supervisors": formatted_supervisors,
        "Similar_Projects": formatted_projects,
        "Improvements": improvements,
        "Final_Proposal": {
            "Summary": final_summary
        }
    }

# ============================================================================
# 🎯 MAIN ENDPOINT - POST /analyze (محسّن + دعم اللغتين)
# ============================================================================

@router.post("/analyze")
async def analyze_idea(request: AnalysisRequest):
    """
    🔍 تحليل فكرة مشروع التخرج مع مقارنة المهارات ودعم اللغتين
    """
    try:
        print(f"\n{'='*60}")
        print(f"🔥 Analysis Request:")
        print(f"   Title: {request.title}")
        print(f"   Student ID: {request.student_id}")
        print(f"   Email: {request.email}")
        print(f"{'='*60}\n")
        
        # ========== التحقق من الطالب وجلب مهاراته ==========
        student = {}
        student_skills = []
        
        if request.student_id or request.email:
            try:
                query = {}
                if request.student_id:
                    if ObjectId.is_valid(request.student_id):
                        query["_id"] = ObjectId(request.student_id)
                    else:
                        raise ValueError("Invalid student_id format")
                elif request.email:
                    query["email"] = request.email
                
                student = students_collection.find_one(query)
                if student:
                    print(f"✅ Student found: {student.get('full_name', 'N/A')}")
                    student = clean_objectid_recursive(student)
                    
                    # 🆕 جلب المهارات من الملف الشخصي
                    student_skills = student.get("skills", [])
                    print(f"📊 Student Skills ({len(student_skills)}): {', '.join(student_skills[:5])}...")
                else:
                    print(f"⚠️ Student not found")
                    student = {}
            except Exception as e:
                print(f"⚠️ Error loading student: {str(e)}")
                student = {}
        
        # ========== 🆕 الكشف التلقائي عن اللغة ==========
        detected_language = detect_combined_language(request.title, request.description)
        print(f"🌍 Detected Language: {detected_language.upper()}")
        print(f"   {'Arabic' if detected_language == 'ar' else 'English'} content detected\n")
        
        # تنظيم البيانات
        idea_dict = {
            "title": request.title,
            "description": request.description,
            "technologies": request.technologies or [],
            "student_id": request.student_id if request.student_id else None,
            "email": request.email if request.email else None,
            "created_at": datetime.datetime.now(UTC)
        }
        
        # ========== المرحلة 1: التحليل المبدئي (مع المهارات + اللغة) ==========
        print("🔵 Stage 1: Initial Analysis (with Skills Comparison)...")
        
        initial_prompt = create_initial_analysis_prompt(
            idea=idea_dict, 
            student=student,
            language=detected_language  # 🆕 تمرير اللغة المكتشفة
        )
        initial_analysis_text = await gemini_service.analyze_idea(initial_prompt)
        
        try:
            initial_analysis = extract_json_safely(initial_analysis_text)
            print("✅ Stage 1: Success\n")
        except (ValueError, Exception) as e:
            print(f"⚠️ Stage 1 JSON Error: {str(e)}")
            print("🔄 Retrying with simplified prompt...\n")
            
            simple_prompt = f"""Output ONLY valid JSON for project analysis.
Project: {request.title}
Description: {request.description}
Student Skills: {', '.join(student.get('skills', []))}
Required JSON:
{{
  "Project_Title": "title",
  "Executive_Summary": "100-150 words",
  "Domain": {{"General_Domain": "domain", "Technical_Domain": "technical"}},
  "Required_Skills": {{"Skills": [], "Matches": [], "Gaps": []}},
  "SWOT_Analysis": {{"Strengths": [], "Weaknesses": [], "Opportunities": [], "Threats": []}},
  "Target_Audience": {{"Primary": [], "Secondary": []}}
}}
JSON only:"""
            
            retry_text = await gemini_service.analyze_idea(simple_prompt)
            initial_analysis = extract_json_safely(retry_text)
            print("✅ Stage 1: Success (after retry)\n")
        
        # 🆕 مقارنة المهارات وإضافة البيانات المحسّنة
        required_skills_obj = initial_analysis.get("Required_Skills", {})
        required_skills_list = required_skills_obj.get("Skills", [])
        
        # استخدام دالة المقارنة الذكية
        skills_comparison = compare_skills(required_skills_list, student_skills)
        
        # تحديث التحليل بالمقارنة الذكية
        initial_analysis["Required_Skills"]["Matches"] = skills_comparison["matched"]
        initial_analysis["Required_Skills"]["Gaps"] = skills_comparison["gaps"]
        initial_analysis["Required_Skills"]["Match_Percentage"] = skills_comparison["match_percentage"]
        
        print(f"📊 Skills Analysis:")
        print(f"   ✅ Matched: {len(skills_comparison['matched'])}")
        print(f"   ❌ Gaps: {len(skills_comparison['gaps'])}")
        print(f"   📈 Match Rate: {skills_comparison['match_percentage']}%\n")
        
        # ========== التحضير للمرحلة 2 ==========
        print("🔵 Preparing Stage 2: Finding similar projects & supervisors...")
        
        idea_text = f"{request.title} {request.description}"
        similarity_report = await rag_service.find_similar_projects(idea_text, top_k=5)
        
        similar_projects_raw = similarity_report.get("reranked_projects", [])
        similar_projects = [clean_objectid_recursive(proj) for proj in similar_projects_raw]
        
        print(f"\n--- 🔍 تقرير تحليل التكرار ---")
        print(f"   - حالة التكرار: {similarity_report.get('duplication_status', 'N/A')}")
        print(f"   - المشاريع المشابهة: {len(similar_projects)}")
        
        # استخراج الكلمات المفتاحية
        technical_keywords = []
        if "Domain" in initial_analysis:
            domain = initial_analysis["Domain"]
            if isinstance(domain, dict):
                general = domain.get("General_Domain", "")
                technical = domain.get("Technical_Domain", "")
                if general:
                    technical_keywords.extend([w.strip() for w in general.split(",")[:2]])
                if technical:
                    parts = technical.split(",")
                    for part in parts[:3]:
                        technical_keywords.extend(part.strip().split()[:2])
        
        all_keywords = list(set([
            k.strip().lower() 
            for k in (request.technologies or []) + technical_keywords 
            if k and len(k.strip()) > 2
        ]))
        
        search_text = " ".join(all_keywords[:20])
        print(f"🔎 Search keywords: {search_text[:150]}...\n")
        
        # توصية المشرفين
        recommended_supervisors_data = await supervisor_recommendation.recommend_supervisors(
            idea_text=idea_text,
            student_major=student.get("major", "Computer Science"),
            top_k=15
        )
        
        supervisors_for_prompt = []
        for s in recommended_supervisors_data:
            supervisor_clean = clean_objectid_recursive(s["supervisor"])
            supervisor_clean["reranked_score"] = s.get("final_score", 0.0)
            supervisor_clean["justification"] = s.get("justification", "No specific explanation.")
            
            recent_papers_clean = clean_objectid_recursive(s.get("recent_papers", []))
            supervisor_clean["recent_papers"] = recent_papers_clean
            supervisors_for_prompt.append(supervisor_clean)
        
        # ========== المرحلة 2: التقرير النهائي (مع اللغة) ==========
        print("🔵 Stage 2: Extended Analysis & Report...")
        
        extended_prompt = create_extended_analysis_prompt(
            initial_analysis=initial_analysis,
            student=student,
            supervisors=supervisors_for_prompt,
            similar_projects=similar_projects,
            language=detected_language  # 🆕 تمرير اللغة المكتشفة
        )
        
        extended_analysis_text = await gemini_service.analyze_idea(extended_prompt)
        
        try:
            extended_analysis = extract_json_safely(extended_analysis_text)
            print("✅ Stage 2: Success\n")
        except (ValueError, Exception) as e:
            print(f"⚠️ Stage 2 JSON Error: {str(e)}")
            print("🔄 Using enhanced fallback analysis...\n")
            extended_analysis = create_fallback_extended_analysis(
                initial_analysis,
                supervisors_for_prompt, 
                similar_projects
            )
            print("✅ Stage 2: Fallback completed\n")
        
        # ========== حفظ النتائج ==========
        print("💾 Saving results to MongoDB...")
        
        idea_data = idea_dict.copy()
        idea_data["initial_analysis"] = initial_analysis
        idea_data["extended_analysis"] = extended_analysis
        idea_data["duplication_status"] = similarity_report.get("duplication_status", "Not Analyzed")
        idea_data["duplication_report"] = similarity_report.get("analysis_report", "No RAG report available.")
        
        # حفظ المشاريع المشابهة
        idea_data["similar_projects"] = [
            {
                "_id": str(p.get("id", "") or p.get("_id", "")),
                "title": p.get("title") or p.get("project_title", "بدون عنوان"),
                "department": p.get("department", "غير محدد"),
                "year": p.get("year", "غير محدد"),
                "abstract": (p.get("abstract") or "")[:200],
                "similarity_score": p.get("similarity_score", p.get("final_similarity", 0.0))
            }
            for p in similar_projects 
        ]
        
        # حفظ المشرفين الموصى بهم
        idea_data["recommended_supervisors"] = [
            {
                "_id": str(s.get("_id", "")),
                "name": s.get("Name") or s.get("name", "غير محدد"),
                "email": s.get("Email") or s.get("email", "غير محدد"),
                "department": s.get("Department") or s.get("department", "غير محدد"),
                "recent_papers": [
                    {"title": p.get("title", "N/A"), "year": p.get("year", 0)}
                    for p in s.get("recent_papers", [])[:3]
                    if p
                ],
                "research_match_score": float(s.get("reranked_score", 0.0)),
                "justification": s.get("justification", "N/A")
            }
            for s in supervisors_for_prompt[:5]
        ]
        
        result = ideas_collection.insert_one(idea_data)
        print(f"✅ Saved to MongoDB: {result.inserted_id}\n")
        print(f"{'='*60}\n")
        
        return {
            "id": str(result.inserted_id),
            "message": "✅ تم التحليل بنجاح" if detected_language == "ar" else "✅ Analysis completed successfully",
            "detected_language": detected_language,  # 🆕 إضافة اللغة المكتشفة
            "stage_1_initial_analysis": initial_analysis,
            "stage_2_extended_analysis": extended_analysis,
            "similar_projects": idea_data["similar_projects"], 
            "recommended_supervisors": idea_data["recommended_supervisors"],
            "skills_analysis": {
                "matched_skills": skills_comparison["matched"],
                "gap_skills": skills_comparison["gaps"],
                "match_percentage": skills_comparison["match_percentage"]
            }
        }
        
    except Exception as e:
        print(f"\n❌ ERROR in analyze_idea:")
        print(f"   {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Analysis failed: {str(e)}"
        )
