

import os
import google.generativeai as genai
from typing import List, Dict, Optional
from dotenv import load_dotenv
import json
import asyncio 
import re 
from google.generativeai.types import GenerationConfig 

load_dotenv()

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY غير موجود في .env")
        
        genai.configure(api_key=api_key)
        
        self.model = genai.GenerativeModel('gemini-2.5-flash') 
        
    
    
    
    
    async def analyze_idea(self, prompt: str) -> str:
        """ يرسل موجه لتحليل الفكرة (المرحلة 1 أو 2) إلى نموذج Gemini. """
        try:
            print("🤖 LLM: جاري تحليل الفكرة (Gemini) [JSON Mode]...")
            
            config = GenerationConfig(response_mime_type="application/json")
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                contents=prompt,
                generation_config=config 
            )
            return response.text.strip()
        except Exception as e:
            print(f"❌ خطأ في تحليل فكرة Gemini: {str(e)}")
            return '{"error": "Failed to generate AI analysis due to service error."}'
            
    
    
    

    def analyze_supervisor_research(self, papers: List[Dict], supervisor_name: str) -> Dict:
        """
        تحليل أبحاث المشرف واستخراج: الاهتمامات البحثية، المجال الأكاديمي، التخصص الدقيق.
        """
        if not papers:
            return self._fallback_analysis(papers)
        
        papers_text = "\n".join([
            f"- ({p.get('year', 'N/A')}) {p.get('title', 'No Title')}"
            for p in papers[:10]
        ])
        
        prompt = f"""
أنت محلل أكاديمي متخصص. لديك قائمة بأحدث أبحاث المشرف "{supervisor_name}".

**الأبحاث:**
{papers_text}

**المطلوب:** حلل هذه الأبحاث واستخرج بصيغة JSON:
{{
  "research_interests": ["قائمة بـ 5-8 اهتمامات بحثية دقيقة (باللغة الإنجليزية)"],
  "academic_field": "المجال الأكاديمي العام (مثل: Computer Science, Information Systems)",
  "specialization": "التخصص الدقيق (مثل: Machine Learning, IoT Security)"
}}

أجب فقط بـ JSON بدون أي نص إضافي.
"""
        
        try:
            config = GenerationConfig(response_mime_type="application/json")
            
            response = self.model.generate_content(
                prompt,
                generation_config=config 
            )
            return self._parse_json_response(response.text, papers) 
                
        except Exception as e:
            print(f"❌ خطأ في تحليل المشرف Gemini: {str(e)}")
            return self._fallback_analysis(papers)
            
    
    
    
    
    def _parse_json_response(self, result_text: str, fallback_data: Optional[Dict | List] = None) -> Dict | List:
        """منطق استخراج وتحليل JSON الموحد، يفترض أن النموذج يعمل في JSON Mode."""
        try:
            cleaned_text = result_text.strip()
            return json.loads(cleaned_text)
            
        except Exception as e:
            print(f"⚠️ فشل استخراج JSON في وضع JSON Mode: {str(e)}. محاولة التنظيف الاحتياطية...")
            match = re.search(r'(\{.*\}|\[.*\])', cleaned_text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except:
                    pass 
            
            print(f"❌ فشل التنظيف الاحتياطي. اللجوء لبيانات الخطأ.")
            
            if isinstance(fallback_data, list):
                return []
            
            if isinstance(fallback_data, list) and fallback_data: 
                return self._fallback_analysis(fallback_data)
                
            return {}

    def _fallback_analysis(self, papers: List[Dict]) -> Dict:
        """تحليل احتياطي بسيط بدون AI (يستخدم فقط في تحليل المشرفين)"""
        all_titles = " ".join([p.get("title", "") for p in papers[:5]]).lower()
        
        keywords = []
        common_terms = [
            "machine learning", "deep learning", "security", "network",
            "iot", "ai", "data", "wireless", "cloud", "blockchain"
        ]
        
        for term in common_terms:
            if term in all_titles:
                keywords.append(term.title())
        
        return {
            "research_interests": keywords[:5] if keywords else ["Computer Science"],
            "academic_field": "Computer Science",
            "specialization": keywords[0] if keywords else "General Computing"
        }

    
    
    

    async def get_reranked_recommendations(self, reranking_data: List[Dict], idea_text: str) -> List[Dict]:
        """
        إعادة ترتيب المشرفين وتوليد سبب الترشيح (Re-ranking).
        """
        print("🤖 LLM: إعادة ترتيب المشرفين وتوليد الشرح [JSON Mode]...")
        
        
        supervisors_data = []
        for item in reranking_data:
            top_matched_papers = [t[:100] for t in item.get("top_matched_papers", [])]
            
            
            supervision_match = item.get("supervision_match_score", 0.0)
            
            supervisors_data.append({
                "id": item.get("id"),
                "Name": item.get("name"),
                "Department": item.get("department"),
                "Initial_Score": f"{item.get('initial_score', 0.0):.4f}", 
                "Similarity_Vector_Score": f"{item.get('semantic_similarity', 0.0):.4f}",
                "Matching_Keywords": item.get("matching_keywords", []),
                "Is_Same_Major": item.get("is_same_major", False),
                "Top_Matched_Papers": top_matched_papers,
                
                "Supervision_Match_Score": f"{supervision_match:.2f}" 
            })
            
        data_str = json.dumps(supervisors_data, indent=2, ensure_ascii=False)
        
        
        prompt = f"""
أنت خبير في الإشراف الأكاديمي والتحليل الدلالي للمشاريع. مهمتك هي **إعادة ترتيب** قائمة المشرفين وتوليد تبرير مفصل لترشيحهم.

**بيانات المدخلات:**

* **فكرة الطالب:** {idea_text}
* **المشرفون المرشحون (الترتيب الأولي):**
{data_str}

**قواعد العمل CRITICAL RULES:**

1.  يجب أن يكون الإخراج مصفوفة JSON (Array of Objects) تحتوي على جميع المشرفين المدخلين.
2.  قم **بإعادة ترتيب** المشرفين داخل المصفوفة من الأكثر ملاءمة إلى الأقل ملاءمة.
3.  يجب أن تحتوي كل نتيجة (كائن) على حقلين جديدين إلزاميّين:
    * **reranked_score**: قيمة جديدة بين 0.0 و 1.0 تعكس مدى ملاءمة المشرف بعد التحليل النوعي (يجب أن تكون متوافقة مع الترتيب الجديد).
    * **Justification**: **تبرير موجز ومهني (100-150 كلمة)** يربط بشكل صريح بين **فكرة الطالب**، و **مجال المشرف (Department)**، و **اهتماماته البحثية**.
        **يجب أن يشمل التبرير ما يلي (إن وجد):**
        * **الدليل الإشرافي:** ذكر إذا كانت درجة `Supervision_Match_Score` عالية (أعلى من 0.60) وأن المشرف لديه خبرة في مشاريع مشابهة.
        * **الدليل البحثي:** **استخدم عناوين البحوث في حقل `Top_Matched_Papers`** كدليل على التخصص الدقيق للمشرف ومطابقتها للفكرة.

**تنسيق الإخراج المطلوب (مصفوفة JSON):**

[
    {{
        "id": 0, 
        "Name": "الاسم",
        "reranked_score": 0.95, 
        "Justification": "تبرير موجز يربط فكرة الطالب بأبحاث المشرف (100-150 كلمة)"
    }},
    {{
        // ... المشرف الثاني
    }}
]

**Output ONLY the JSON array. No extra text before or after.**
"""
        
        
        try:
            config = GenerationConfig(response_mime_type="application/json")

            response = await asyncio.to_thread(
                self.model.generate_content,
                contents=prompt,
                generation_config=config 
            )
            return self._parse_json_response(response.text, [])
        except Exception as e:
            print(f"❌ خطأ في Reranking: {str(e)}")
            return []


    
    
    

    async def analyze_project_duplication(self, data_for_llm: Dict) -> Dict:
        """
        تحليل نتائج RAG، تحديد مدى تكرار المشروع، وإعادة ترتيبه.
        """
        print("🤖 LLM: تحليل التكرار وتوليد التقرير [JSON Mode]...")
        
        abstract = data_for_llm.get("new_idea_abstract", "غير متوفر")
        projects_data = data_for_llm.get("retrieved_projects", [])
        projects_str = json.dumps(projects_data, indent=2, ensure_ascii=False)

        prompt = f"""
أنت خبير في مشاريع التخرج الأكاديمية والتحليل الأكاديمي. مهمتك هي تحليل مدى تكرار فكرة مشروع جديدة مقارنة بالمشاريع والأبحاث المرجعية السابقة.

**البيانات المُدخلة:**
* **ملخص فكرة الطالب الجديدة (new_idea_abstract):** {abstract}
* **المشاريع والأبحاث المُسترجعة (retrieved_projects):** هذه هي قائمة المشاريع التي وجد أنها الأكثر تشابهاً (بما في ذلك درجة التشابه score).
{projects_str}

---

**التحليل المطلوب:**

1.  **حالة التكرار (duplication_status):** قم بتصنيف حالة التكرار إلى واحدة من الآتي بناءً على أعلى درجات التشابه:
    * **Direct Overlap:** إذا كان هناك مشروع أو أكثر متشابه جداً (Similarity Score > 0.85) ويقدم نفس الحل.
    * **Potential Overlap:** إذا كان التشابه متوسط (Similarity Score > 0.60).
    * **No direct overlap:** إذا كان التشابه ضعيفاً (< 0.60).

2.  **تقرير التحليل (analysis_report):** تقرير مهني موجز (50-100 كلمة) يوضح جوانب التشابه والاختلاف.

3.  **المشاريع المعاد ترتيبها (reranked_projects):** 
    - أعد ترتيب المشاريع من الأكثر تشابهاً إلى الأقل.
    - **CRITICAL: احتفظ بالـ abstract الأصلي لكل مشروع كما هو تمامًا بدون أي تعديل أو إعادة صياغة أو تلخيص.**
    - لا تضيف أي نصوص إضافية أو تفسيرات في حقل abstract.
    - احتفظ بجميع المفاتيح الأصلية الأخرى (id, title, year, department, similarity_score).

**تنسيق الإخراج المطلوب (JSON):**

{{
    "duplication_status": "Direct Overlap" | "Potential Overlap" | "No direct overlap",
    "analysis_report": "تقرير تحليلي موجز",
    "reranked_projects": [
        // نفس الهيكل الأصلي للمشاريع مع abstract الأصلي غير معدل
    ]
}}

**Output ONLY the JSON object. No extra text.**
"""

        try:
            config = GenerationConfig(response_mime_type="application/json")
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                contents=prompt,
                generation_config=config 
            )
            return self._parse_json_response(response.text, {}) 
        except Exception as e:
            print(f"❌ خطأ في تحليل التكرار: {str(e)}")
            return {
                "duplication_status": "Error",
                "analysis_report": "فشل في تشغيل تحليل LLM، يرجى التحقق من الاتصال بالخدمة.",
                "reranked_projects": data_for_llm.get("retrieved_projects", [])
            }

gemini_service = GeminiService()