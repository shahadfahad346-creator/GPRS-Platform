import json
import re

def extract_json_safely(text: str) -> dict:
    """
    استخراج JSON من نص قد يحتوي على markdown أو نصوص إضافية، مع معالجة أخطاء شائعة.
    
    Args:
        text: النص الذي قد يحتوي على JSON
        
    Returns:
        dict: الكائن JSON المستخرج
        
    Raises:
        ValueError: إذا لم يُعثر على JSON صالح
    """
    # 1. إزالة markdown code blocks والمسافات الزائدة
    # (```json...) (```) (``` ...)
    text = re.sub(r'```(?:json)?\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    
    # 2. البحث عن JSON object (أول { إلى آخر })
    # نستخدم search بدلاً من findall لضمان إيجاد الكتلة الرئيسية
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in response")
    
    json_str = match.group(0)
    
    # 3. التنظيف قبل التحميل (معالجة الأخطاء الشائعة من LLMs)
    
    # أ. إزالة الفواصل الزائدة (مثل: "key": "value", } )
    json_str = re.sub(r',\s*([}\]])', r'\1', json_str) 
    
    # ب. إزالة التعليقات (//...)
    json_str = re.sub(r'//.*?\n', '\n', json_str) 
    
    # ج. استبدال الاقتباسات الفردية لـ double quotes (مهم جداً إذا لم يلتزم النموذج)
    # هذه الخطوة قد تكسر النصوص التي تحتوي على single quotes كجزء من القيمة، لذا يجب استخدامها بحذر.
    # يمكن تجاوزها إذا كان النموذج يلتزم بقواعد JSON (وهذا هو المفترض مع Gemini).
    # للتجربة: إذا استمرت الأخطاء، قم بإلغاء التعليق عن السطر التالي:
    # json_str = json_str.replace("'", '"') 
    
    # د. معالجة الـ Unescaped control characters (مثل \n \t داخل سلاسل نصية)
    # نقوم بمحاولة استبدالهم إذا لم يتم الهروب منهم بشكل صحيح (قد يكون قوياً جداً)
    # الأفضل ترك النموذج يصحح نفسه إذا كان يستخدم JSON Mode
    
    # 4. محاولة التحويل لـ JSON
    try:
        # نقوم بتحميل JSON
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        # محاولة أخيرة: إذا فشل التحميل بسبب الـ Single Quotes، نجرب طريقة استبدال أكثر قوة (Eval)
        # وهي غير آمنة في بيئات الإنتاج، لذا نستخدم مكتبة `ast` أو حلول أخرى، لكن نعتمد على محرك JSON.
        
        print(f"❌ JSON Parse Error (1st attempt): {str(e)}")
        print(f"📄 Problematic JSON (first 500 chars):\n{json_str[:500]}")
        
        # محاولة ثانية لمعالجة مشكلة الـ Single quotes (أقل أماناً لكن قد تنجح)
        try:
            # استبدال single quotes في أسماء المفاتيح والقيم (قد يكون هذا هو سبب الفشل)
            json_str_fixed = json_str.replace("'", '"')
            
            # محاولة التحميل مرة أخرى
            return json.loads(json_str_fixed)
        except json.JSONDecodeError as e2:
             print(f"❌ JSON Parse Error (2nd attempt): {str(e2)}")
             raise ValueError(f"Invalid JSON format after fixing quotes: {str(e2)}")


# ============================================================================
# 📋 Prompt 1: التحليل المبدئي (Initial Analysis)
# ============================================================================

# (بقية الدوال تبقى كما هي)
# ...
# ============================================================================
# 📋 Prompt 1: التحليل المبدئي (Initial Analysis)
# ============================================================================

# utils/prompts.py - تحديث الدالة الأولى فقط

def create_initial_analysis_prompt(idea: dict, student: dict, language: str = "en") -> str:
    """
    إنشاء Prompt للتحليل المبدئي مع دعم اللغتين
    
    Args:
        idea: معلومات الفكرة (title, description, ...)
        student: معلومات الطالب (skills, ...)
        language: "ar" للعربي، "en" للإنجليزي (default: "en")
        
    Returns:
        نص الـ Prompt بالكامل
    """
    
    title = idea.get("title", "")
    description = idea.get("description", "")
    student_skills = student.get("skills", [])
    student_skills_text = ', '.join(student_skills) if student_skills else 'No skills specified'
    
    # ========== إذا اللغة عربي ==========
    if language == "ar":
        prompt = f"""أنت محلل أكاديمي خبير في تقييم مشاريع التخرج الجامعية.

**معلومات المشروع:**
- العنوان: {title}
- الوصف: {description}

**مهارات الطالب الحالية:**
{student_skills_text}

**المطلوب منك:**
قم بتحليل شامل لفكرة المشروع وأخرج النتائج بصيغة JSON فقط (بدون أي نص إضافي قبله أو بعده).

**هيكل JSON المطلوب:**
{{
  "Project_Title": "عنوان المشروع بالعربية",
  "Executive_Summary": "ملخص تنفيذي شامل (100-150 كلمة) يوضح الفكرة والأهداف والفائدة المتوقعة",
  "Domain": {{
    "General_Domain": "المجال العام (مثل: الرعاية الصحية، التجارة الإلكترونية، الأمن السيبراني)",
    "Technical_Domain": "المجال التقني (مثل: تعلم الآلة، تطوير الويب، تطبيقات الهاتف)"
  }},
  "Required_Skills": {{
    "Skills": ["المهارة 1", "المهارة 2", "المهارة 3", "..."],
    "Matches": [],
    "Gaps": [],
    "Match_Percentage": 0
  }},
  "SWOT_Analysis": {{
    "Strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
    "Weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
    "Opportunities": ["فرصة 1", "فرصة 2", "فرصة 3"],
    "Threats": ["تهديد 1", "تهديد 2"]
  }},
  "Target_Audience": {{
    "Primary": ["الجمهور الرئيسي 1", "الجمهور الرئيسي 2"],
    "Secondary": ["الجمهور الثانوي 1", "الجمهور الثانوي 2"]
  }}
}}

**ملاحظات مهمة جداً:**
1. اكتب جميع المخرجات باللغة العربية فقط
2. كن دقيقاً في تحديد المهارات التقنية المطلوبة للمشروع
3. اجعل التحليل واقعياً وقابلاً للتنفيذ
4. أخرج JSON صالح فقط بدون أي نص إضافي أو شرح"""

    # ========== إذا اللغة إنجليزي ==========
    else:
        prompt = f"""You are an expert academic analyst specializing in evaluating university graduation projects.

**Project Information:**
- Title: {title}
- Description: {description}

**Student's Current Skills:**
{student_skills_text}

**Your Task:**
Provide a comprehensive analysis of the project idea and output ONLY valid JSON (no additional text before or after).

**Required JSON Structure:**
{{
  "Project_Title": "Project title in English",
  "Executive_Summary": "Comprehensive executive summary (100-150 words) explaining the idea, objectives, and expected benefits",
  "Domain": {{
    "General_Domain": "General domain (e.g., Healthcare, E-commerce, Cybersecurity)",
    "Technical_Domain": "Technical domain (e.g., Machine Learning, Web Development, Mobile Apps)"
  }},
  "Required_Skills": {{
    "Skills": ["Skill 1", "Skill 2", "Skill 3", "..."],
    "Matches": [],
    "Gaps": [],
    "Match_Percentage": 0
  }},
  "SWOT_Analysis": {{
    "Strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "Weaknesses": ["Weakness 1", "Weakness 2"],
    "Opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
    "Threats": ["Threat 1", "Threat 2"]
  }},
  "Target_Audience": {{
    "Primary": ["Primary audience 1", "Primary audience 2"],
    "Secondary": ["Secondary audience 1", "Secondary audience 2"]
  }}
}}

**Important Notes:**
1. Write ALL outputs in English only
2. Be precise in identifying required technical skills for the project
3. Make the analysis realistic and actionable
4. Output valid JSON only without any additional text or explanation"""

    return prompt

# ============================================================================
# 📋 Prompt 2: التحليل الموسع (Extended Analysis)
# ============================================================================

# utils/prompts.py - تحديث الدالة الثانية (كاملة)

def create_extended_analysis_prompt(
    initial_analysis: dict,
    student: dict,
    supervisors: list,
    similar_projects: list,
    language: str = "en"
) -> str:
    """
    إنشاء Prompt للتحليل الموسع مع دعم اللغتين
    
    Args:
        initial_analysis: نتائج التحليل المبدئي
        student: معلومات الطالب
        supervisors: قائمة المشرفين المقترحين
        similar_projects: قائمة المشاريع المشابهة
        language: "ar" للعربي، "en" للإنجليزي
        
    Returns:
        نص الـ Prompt للتحليل الموسع
    """
    
    # تحضير بيانات المشرفين (أول 5)
    supervisors_text = ""
    for i, sup in enumerate(supervisors[:5], 1):
        name = sup.get("Name") or sup.get("name", "N/A")
        dept = sup.get("Department") or sup.get("department", "N/A")
        email = sup.get("Email") or sup.get("email", "N/A")
        papers_count = len(sup.get("recent_papers", []))
        supervisors_text += f"\n{i}. {name} | {dept} | {email} | {papers_count} recent papers"
    
    # تحضير بيانات المشاريع المشابهة (أول 5)
    projects_text = ""
    for i, proj in enumerate(similar_projects[:5], 1):
        title = proj.get("title") or proj.get("project_title", "N/A")
        year = proj.get("year", "N/A")
        dept = proj.get("department", "N/A")
        score = proj.get("similarity_score", proj.get("final_similarity", 0.0))
        projects_text += f"\n{i}. {title} | {year} | {dept} | Similarity: {score:.2f}"
    
    # ========== النسخة العربية ==========
    if language == "ar":
        prompt = f"""أنت خبير أكاديمي متخصص في مشاريع التخرج الجامعية.

**التحليل المبدئي للمشروع:**
{initial_analysis}

**المشرفون المقترحون ({len(supervisors[:5])}):**
{supervisors_text}

**المشاريع المشابهة ({len(similar_projects[:5])}):**
{projects_text}

---

**المطلوب منك:**
قم بإعداد تقرير موسع بصيغة JSON فقط (بدون أي نص إضافي).

**هيكل JSON المطلوب:**
{{
  "Supervisors": [
    {{
      "Name": "اسم المشرف الكامل",
      "Department": "القسم الأكاديمي",
      "Email": "البريد الإلكتروني",
      "Justification": "سبب مفصل ومهني للترشيح (2-3 جمل) يوضح لماذا هذا المشرف مناسب لهذا المشروع بالتحديد."
    }}
  ],
  "Similar_Projects": [
    {{
      "Title": "عنوان المشروع المشابه",
      "Year": 2023,
      "Department": "القسم",
      "Relevance": "تحليل مفصل (2-3 جمل) يوضح أوجه التشابه والاختلاف مع المشروع الحالي."
    }}
  ],
  "Improvements": [
    "اقتراح تحسين تفصيلي 1 - كن محدداً وقابلاً للتطبيق",
    "اقتراح تحسين تفصيلي 2 - ركز على الجوانب التقنية",
    "اقتراح تحسين تفصيلي 3 - اقترح إضافات أو تعديلات واقعية"
  ],
  "Final_Proposal": {{
    "Summary": "ملخص نهائي شامل (150-200 كلمة) يجمع كل التحليلات السابقة ويقدم رؤية متكاملة للمشروع."
  }}
}}

**ملاحظات مهمة:**
1. اكتب جميع المخرجات باللغة العربية فقط
2. كن محدداً ومهنياً في التبريرات والتحليلات
3. أخرج JSON صالح فقط بدون أي نص إضافي"""

    # ========== النسخة الإنجليزية ==========
    else:
        prompt = f"""You are an expert academic advisor specializing in graduation projects.

**Initial Project Analysis:**
{initial_analysis}

**Recommended Supervisors ({len(supervisors[:5])}):**
{supervisors_text}

**Similar Projects ({len(similar_projects[:5])}):**
{projects_text}

---

**Your Task:**
Prepare an extended report in JSON format only (no additional text).

**Required JSON Structure:**
{{
  "Supervisors": [
    {{
      "Name": "Full supervisor name",
      "Department": "Academic department",
      "Email": "Email address",
      "Justification": "Detailed professional reason for recommendation (2-3 sentences) explaining why this supervisor is suitable for THIS specific project."
    }}
  ],
  "Similar_Projects": [
    {{
      "Title": "Similar project title",
      "Year": 2023,
      "Department": "Department",
      "Relevance": "Detailed analysis (2-3 sentences) explaining similarities and differences with the current project."
    }}
  ],
  "Improvements": [
    "Detailed improvement suggestion 1 - be specific and actionable",
    "Detailed improvement suggestion 2 - focus on technical aspects",
    "Detailed improvement suggestion 3 - suggest realistic additions or modifications"
  ],
  "Final_Proposal": {{
    "Summary": "Comprehensive final summary (150-200 words) combining all previous analyses and providing an integrated vision for the project."
  }}
}}

**Important Notes:**
1. Write ALL outputs in English only
2. Be specific and professional in justifications and analyses
3. Output valid JSON only without any additional text"""

    return prompt