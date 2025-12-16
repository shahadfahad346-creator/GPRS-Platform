from typing import List, Dict, Tuple
import asyncio
import numpy as np 
import datetime 

from bson.objectid import ObjectId 
from math import exp 
from sklearn.metrics.pairwise import cosine_similarity 

from bson.objectid import ObjectId # الاستيراد الحاسم لتصحيح خطأ ObjectId
import random # لاستخدامه مؤقتاً في دالة Supervision Match الافتراضية
from math import exp # لاستخدام الاضمحلال الأسي في حساب الحداثة

from config.database_config import db 
from services.serpapi_service import SerpAPIService as ScholarLookupService 
from services.embedding_service import embedding_service 
from services.gemini_service import gemini_service 
from services.qdrant_service import qdrant_service 


# يجب التأكد من مسار هذه الملفات
from config.database_config import db 
from services.serpapi_service import SerpAPIService as ScholarLookupService 
from services.embedding_service import embedding_service 
from services.gemini_service import gemini_service 
from services.qdrant_service import qdrant_service 

# تهيئة الخدمات
scholar_lookup_service = ScholarLookupService()

# 💡 تعريف الثوابت الجديدة للحداثة (Recency)
RECENCY_FULL_SCORE_WINDOW = 3 # عدد السنوات التي تُعتبر فيها الحداثة ممتازة (1.00)
RECENCY_DECAY_RATE = 0.25 # معدل اضمحلال مناسب بعد النافذة الزمنية (3 سنوات)
# MAX_SUPERVISOR_LOAD = 5 # 🗑️ تم حذف ثابت أقصى حمل المشرف

class SupervisorRecommendation:
    def __init__(self):
        self.supervisors_collection = db["Supervisor"] 
        self.projects_collection = db["Graduation Projects BU"] 
        self.QDRANT_COLLECTION = qdrant_service.supervisors_collection
        self.EMBEDDING_LENGTH = 768


    # -------------------------------------------------------------
    # 1. دالة حساب الحداثة (معدلة لقراءة صيغ التاريخ غير الكاملة)
    # -------------------------------------------------------------
    def _calculate_recency_score(self, last_updated_date_str: str) -> float:
        """
        يحسب درجة الحداثة بناءً على آخر تاريخ نشر ذي صلة أو آخر تحديث عام.
        تم تعديلها لتقبل صيغ التاريخ غير الكاملة (مثل السنة فقط).
        """
        if not last_updated_date_str or last_updated_date_str.lower() == 'n/a':
            return 0.00
        
        latest_date = None
        try:
            # محاولة التحويل القياسي (YYYY-MM-DD)
            latest_date = datetime.datetime.strptime(last_updated_date_str, "%Y-%m-%d") 
        except ValueError:
            try:
                # 💡 محاولة التحويل من السنة فقط
                year = int(last_updated_date_str.split('-')[0])
                if year < 1900 or year > datetime.datetime.now().year + 1:
                     return 0.00 
                latest_date = datetime.datetime(year, 1, 1) # إضافة شهر ويوم افتراضيين
            except Exception:
                return 0.00 
            
        today = datetime.datetime.now()
        years_since_last_update = (today - latest_date).days / 365.25
        
        if years_since_last_update <= RECENCY_FULL_SCORE_WINDOW:
            recency_score = 1.00
        else:
            years_to_decay = years_since_last_update - RECENCY_FULL_SCORE_WINDOW
            recency_score = exp(-RECENCY_DECAY_RATE * years_to_decay)
        
        return round(min(1.00, recency_score), 2)
    # -------------------------------------------------------------


    # -------------------------------------------------------------
    # 2. 🏆 دالة التوافق الإشرافي (بدون تغيير)
    # -------------------------------------------------------------
    async def _calculate_supervision_match(
        self,
        supervisor_id: str,
        idea_embedding: List[float] 
    ) -> Tuple[float, Dict]: 
        """
        يحسب متوسط التشابه الدلالي بين فكرة الطالب والمشاريع السابقة للمشرف 
        ويحدد أفضل مشروع مطابق كدليل لدمجه في التبرير.
        """
        
        try:
            supervisor_doc = self.supervisors_collection.find_one(
                {"_id": ObjectId(supervisor_id)}, 
                {"Name": 1} 
            )
        except Exception:
            return 0.0, {} 
            
        supervisor_name = supervisor_doc.get("Name") if supervisor_doc else None
        
        if not supervisor_name:
            return 0.0, {} 
            
        # 2. البحث عن المشاريع التي أشرف عليها
        projects = list(
            self.projects_collection.find(
                {"supervisors": supervisor_name},
                {"embedding": 1, "title": 1, "keywords": 1} 
            )
        )
        
        if not projects:
            return 0.0, {} 
        
        # 3. استخراج متجهات المشاريع السابقة
        project_embeddings = []
        comparable_projects = [] 
        for project in projects:
            embedding = project.get("embedding")
            if embedding and len(embedding) == self.EMBEDDING_LENGTH: 
                project_embeddings.append(embedding)
                comparable_projects.append(project) 
                
        if not project_embeddings:
            return 0.0, {} 
            
        # 4. حساب التشابه وتحديد الأفضل
        try:
            idea_np = np.array(idea_embedding).reshape(1, -1)
            projects_np = np.array(project_embeddings)
            
            similarities = cosine_similarity(idea_np, projects_np)[0] 
            avg_similarity = np.mean(similarities)
            
            best_match_index = np.argmax(similarities)
            best_project = comparable_projects[best_match_index]
            
            best_project_score = float(similarities[best_match_index])
            best_project_info = {
                "title": best_project.get("title", "عنوان غير متوفر"),
                "keywords": best_project.get("keywords", "غير متوفرة"),
                "match_score": round(best_project_score, 2)
            }
            
            return round(float(avg_similarity), 2), best_project_info
            
        except Exception as e:
            # print(f"❌ خطأ في حساب Cosine Similarity: {e}")
            return 0.0, {}
    # -------------------------------------------------------------
    
    # -------------------------------------------------------------
    # 3. دالة الجلب والتحديث (معدلة لإجبار الجلب من Google Scholar)
    # -------------------------------------------------------------
    async def _get_or_update_papers(self, supervisor: Dict) -> Tuple[Dict, List[Dict]]:
        """
        تُجلب الأبحاث الحديثة دائمًا من SerpAPI (Google Scholar) وتُحدثها في MongoDB للعرض.
        """
        # 1. جلب المعرفات
        author_id = str(supervisor.get("Author_ID", "")).strip()
        orcid_id = str(supervisor.get("ORCID_ID", "")).strip() 

        
        
        search_id = None
        search_type = None

        if author_id:
            search_id = author_id
            search_type = "scholar_author_id"
        elif orcid_id: 
            search_id = orcid_id
            search_type = "orcid_id" 
        else:
            return supervisor, supervisor.get("recent_papers", [])

        # 💡 التعديل الجوهري: يتم إجبار الجلب من Google Scholar في كل مرة
        new_papers = []
        
        if search_type == "scholar_author_id" or search_type == "orcid_id":
            
            # print(f"🔄 جاري جلب الأبحاث الحديثة للدكتور {supervisor.get('Name')} من Google Scholar...")
            
            try:
                new_papers = await asyncio.to_thread(
                    scholar_lookup_service.search_scholar_by_author_id,
                    search_id, 
                    max_results=15
                )
            except Exception as e:
                # print(f"❌ فشل جلب أبحاث الدكتور {supervisor.get('Name')}: {e}")
                pass

        if new_papers:
            # 4. تحديث سجل MongoDB بآخر الأبحاث
            most_recent_paper_date = max(
                (p.get("year", 1900) for p in new_papers if p.get("year")), 
                default=datetime.datetime.now().year
            )
            
            last_updated_str = f"{most_recent_paper_date}-01-01" 

            # نحدث MongoDB (للعرض في الواجهة)
            self.supervisors_collection.update_one(
                {"_id": supervisor["_id"]},
                {
                    "$set": {
                        "recent_papers": new_papers,
                        "papers_count": len(new_papers),
                        "last_updated": last_updated_str 
                    }
                }
            )
            # نحدث كائن المشرف الحالي للاستخدام في نفس العملية
            supervisor["last_updated"] = last_updated_str
            return supervisor, new_papers
        
        # إذا فشل الجلب، نعتمد على البيانات المخزنة القديمة (ملاذ أخير)
        return supervisor, supervisor.get("recent_papers", [])
    # -------------------------------------------------------------

    # -------------------------------------------------------------
    # 4. دالة فحص تشابه الأقسام (بدون تغيير)
    # -------------------------------------------------------------
    def _check_department_similarity(self, dept1: str, dept2: str) -> bool:
        """فحص تشابه الأقسام العلمية باستخدام مرادفات بسيطة."""
        synonyms = {
            "computer science": ["cs", "computing", "informatics", "it"],
            "information technology": ["it", "computer science", "computing"],
            "software engineering": ["cs", "computer science", "engineering"],
            "electrical engineering": ["ee", "electronics", "electrical"],
            "mechanical engineering": ["me", "mechanics"],
            "civil engineering": ["ce", "civil"],
            "information systems": ["is", "mis", "information technology"],
        }
        
        dept1 = dept1.lower().strip()
        dept2 = dept2.lower().strip()
        
        for key, values in synonyms.items():
            if (key in dept1 and dept2 in values) or (key in dept2 and dept1 in values):
                return True
            
        if ("computer" in dept1 and "computer" in dept2) or ("engineering" in dept1 and "engineering" in dept2):
            return True
            
        return False
    # -------------------------------------------------------------
    
    # -------------------------------------------------------------
    # 5. دالة التسجيل (معدلة لتطبيق منطق الحداثة الجديد)
    # -------------------------------------------------------------
    async def _score_supervisors(
        self, 
        supervisors: List[Dict], 
        idea_keywords: List[str],
        label: str,
        idea_embedding: List[float] 
    ) -> List[Dict]:
        """تحليل وتسجيل المشرفين بناءً على المطابقة الدلالية، التوافق الإشرافي، والحداثة."""
        scored = []
        
        tasks_papers = []
        tasks_supervision_match = []
        for supervisor in supervisors:
            tasks_papers.append(self._get_or_update_papers(supervisor))
            tasks_supervision_match.append(self._calculate_supervision_match(str(supervisor.get("_id")), idea_embedding))
            
        papers_results = await asyncio.gather(*tasks_papers)
        supervision_match_results = await asyncio.gather(*tasks_supervision_match) 
        
        for idx, (supervisor, recent_papers) in enumerate(papers_results):
            name = supervisor.get("Name", "Unknown")
            
            supervision_match_score, best_matched_project = supervision_match_results[idx] 
            
            # 🗑️ تم حذف حساب current_load و load_multiplier
            # current_load = supervisor.get("current_load", 0)
            # load_multiplier = 1.0 if current_load < MAX_SUPERVISOR_LOAD else 0.5 

            semantic_similarity = supervisor.get('qdrant_score', 0.0)
            
            if recent_papers and (supervisor.get("Author_ID") or supervisor.get("ORCID_ID")):
                
                # 1. إنشاء قائمة كلمات مفتاحية بسيطة وموسعة لزيادة دقة التطابق اللغوي
                simple_keywords = set()
                for k in idea_keywords:
                    k_lower = k.lower()
                    simple_keywords.add(k_lower)
                    # تفكيك العبارات المركبة لضمان الاكتشاف (تصحيح مشكلة الليحيدي)
                    if 'deep learning' in k_lower: simple_keywords.add('deep learning')
                    if 'transportation' in k_lower: simple_keywords.add('transportation')
                    if 'anomaly detection' in k_lower: simple_keywords.add('anomaly')
                    if 'traffic analysis' in k_lower: simple_keywords.add('traffic')


                # 2. تصفية الأوراق البحثية المطابقة (النشاط المرتبط بالفكرة)
                relevant_matched_papers = [
                    p for p in recent_papers 
                    if p.get('title') and any(simple_k in p['title'].lower() or simple_k in p.get('abstract', '').lower() 
                                                 for simple_k in simple_keywords)
                ]
                
                # 3. استخراج تاريخ أحدث ورقة مطابقة للمجال
                latest_relevant_date_str = "N/A"
                if relevant_matched_papers:
                    latest_year = max(p.get("year", 1900) for p in relevant_matched_papers if p.get("year"))
                    if latest_year > 1900:
                        latest_relevant_date_str = f"{latest_year}-01-01"

                # الأوراق المطابقة (للتبرير في النهاية)
                top_matched_papers = [p['title'] for p in relevant_matched_papers][:3]


                # 💡 4. حساب الحداثة بناءً على الصلة (Recency Score)
                recency_score = self._calculate_recency_score(latest_relevant_date_str) 
                
                # 💡 5. منطق الوزن الأدنى: إذا كانت النتيجة صفر (لعدم التطابق اللغوي المباشر)، نستخدم الوزن الأدنى (0.50)
                if recency_score == 0.00 and latest_relevant_date_str == "N/A":
                    general_last_updated = supervisor.get("last_updated", "N/A") 
                    general_recency_score = self._calculate_recency_score(general_last_updated) 
                    
                    # تطبيق التخفيض بنسبة 50% كوزن أدنى
                    recency_score = round(general_recency_score * 0.5, 2)
                    
                semantic_weight = 0.50
                supervision_weight = 0.30
                recency_weight = 0.20
                
                final_score = (
                    semantic_similarity * semantic_weight + 
                    supervision_match_score * supervision_weight + 
                    recency_score * recency_weight 
                )
                
                # 🗑️ تم حذف سطر تطبيق load_multiplier
                # final_score *= load_multiplier 
                
                print(f"   ✅ {name} Score: {final_score:.2f} (Case 1: Research, Semantic: {semantic_similarity:.2f} | Super: {supervision_match_score:.2f} | Recency: {recency_score:.2f})")
                
                
            elif not recent_papers and supervision_match_score > 0:
                
                semantic_interest = semantic_similarity
                
                final_score = (
                    semantic_interest * 0.50 + 
                    supervision_match_score * 0.50 
                )
                
                # 🗑️ تم حذف سطر تطبيق load_multiplier
                # final_score *= load_multiplier 
                
                print(f"   🔹 {name} Score: {final_score:.2f} (Case 2: Interest/Supervision, Semantic_Int: {semantic_interest:.2f} | Super: {supervision_match_score:.2f})")
                
                
            else: 
                
                semantic_interest = semantic_similarity
                
                final_score = semantic_interest * 0.80 
                
                # 🗑️ تم حذف سطر تطبيق load_multiplier
                # final_score *= load_multiplier 
                
                print(f"   ❌ {name} Score: {final_score:.2f} (Case 3: Pure Interest, Semantic_Int: {semantic_similarity:.2f})")

            
            final_score = max(0.0, min(float(final_score), 1.0))
            
            
            if final_score > 0.15: 
                scored.append({
                    "supervisor": supervisor,
                    "similarity": final_score,
                    "recent_papers": recent_papers, 
                    "supervision_match_score": supervision_match_score, 
                    "final_score": final_score,
                    "semantic_similarity": semantic_similarity,
                    "top_matched_papers": top_matched_papers if 'top_matched_papers' in locals() else [],
                    "research_relevance": {"matched_keywords": simple_keywords if 'simple_keywords' in locals() else []},
                    "best_matched_project": best_matched_project
                })
        
        return scored
    # -------------------------------------------------------------

    # -------------------------------------------------------------
    # 6. دالة إعادة الترتيب (بدون تغيير باستثناء إصلاح خطأ JSON)
    # -------------------------------------------------------------
    async def _rerank_and_explain(self, recommendations: List[Dict], idea_text: str) -> List[Dict]:
        """
        تطبيق تقنية إعادة الترتيب (Re-ranking) والشرح باستخدام نموذج لغة (Gemini).
        """
        if not recommendations:
            return []
            
        print("\n🧠 تطبيق إعادة الترتيب (Re-ranking) وتوليد سبب الترشيح...")
        
        reranking_data = []
        for i, rec in enumerate(recommendations):
            
            best_project = rec.get("best_matched_project", {})
            
            reranking_data.append({
                "id": i,
                "name": rec["supervisor"].get("Name"),
                "department": rec["supervisor"].get("Department"),
                "initial_score": rec["final_score"],
                "semantic_similarity": rec["semantic_similarity"],
                "supervision_match_score": rec.get("supervision_match_score", 0.0), 
                # 💡 إصلاح خطأ "set is not JSON serializable"
                "matching_keywords": list(rec.get("research_relevance", {}).get("matched_keywords", [])),
                "is_same_major": rec.get("is_same_major", False),
                "top_matched_papers": rec.get("top_matched_papers", []),
                "best_matched_project_title": best_project.get("title", ""), 
                "best_matched_project_score": best_project.get("match_score", 0.0) 
            })
            
        try:
            reranked_results = await gemini_service.get_reranked_recommendations(
                reranking_data=reranking_data,
                idea_text=idea_text 
            )
            
            if not isinstance(reranked_results, list) or not reranked_results:
                raise ValueError("Gemini returned invalid or empty Reranking results.")
            
            reranked_map = {item.get('id'): item for item in reranked_results}
            
            final_recommendations = []
            for rec in recommendations:
                original_id = rec["id"]
                rerank_info = reranked_map.get(original_id)
                
                if rerank_info:
                    rec["final_score"] = float(rerank_info.get("reranked_score", rec["final_score"]))
                    rec["justification"] = rerank_info.get("Justification", "لا يوجد تبرير من النموذج.")
                else:
                    rec["justification"] = "تم الاحتفاظ بالترتيب الأولي بسبب عدم وجود نتيجة ريرنكنج." 
                
                final_recommendations.append(rec)

            final_recommendations.sort(key=lambda x: x["final_score"], reverse=True)
            
            print("✅ إعادة الترتيب وتوليد الشرح بنجاح.")
            return final_recommendations
            
        except Exception as e:
            print(f"❌ فشل في تطبيق Reranking: {e}. سيتم اعتماد الترتيب الأولي.")
            
            recommendations.sort(key=lambda x: x["final_score"], reverse=True)
            
            for rec in recommendations:
                if 'justification' not in rec:
                    rec["justification"] = f"تم الاعتماد على النتيجة الأولية: {rec['final_score']:.2f} (فشل الريرنكنج)."
                    
            return recommendations
    # -------------------------------------------------------------
    
    # -------------------------------------------------------------
    # 7. الدالة الرئيسية (بدون تغيير)
    # -------------------------------------------------------------
    async def recommend_supervisors(
        self, 
        idea_text: str, 
        student_major: str,
        top_k: int = 5
    ) -> List[Dict]:
        """
        توصية المشرفين: استخدام Qdrant للترشيح الأولي ثم تطبيق التسجيل التفصيلي.
        """
        
        # 0. توليد المتجه والكلمات المفتاحية لفكرة الطالب
        print("\n--- 🧠 جاري تحليل فكرة الطالب (توليد المتجه والكلمات المفتاحية) ---")
        # 💡 تم تحديث الكلمات المفتاحية لتناسب فكرة "المرور الذكي" بدقة أكبر
        idea_keywords = ["Intelligent Transportation Systems", "Deep Learning", "Anomaly Detection", "Smart Cities", "Traffic Analysis", "Optimization", "Pedestrian Safety", "Computer Vision", "Machine Learning"] 
        idea_embedding = embedding_service.embed_text(idea_text)
        
        if not idea_embedding:
            print("❌ فشل توليد المتجه. إيقاف الترشيح.")
            return []
            
        print(f"✅ تم تحليل الفكرة. الكلمات المفتاحية: {', '.join(idea_keywords[:3])}...")
        
        # 1. البحث الأولي في Qdrant 
        print(f"\n1. 🗃️ البحث الأولي في Qdrant عن أفضل {top_k * 4} مشرف...")
        qdrant_matches = qdrant_service.search_supervisors_by_vector(
            query_vector=idea_embedding,
            top_k=top_k * 4
        )
        
        if not qdrant_matches:
            print("❌ لا يوجد مشرفين مطابقين في Qdrant.")
            return []

        # 2. جلب البيانات الكاملة من MongoDB 
        matched_mongo_ids = []
        for m in qdrant_matches:
            mongo_id_str = m.get('mongo_id')
            
            if mongo_id_str and isinstance(mongo_id_str, str) and len(mongo_id_str) == 24:
                try:
                    matched_mongo_ids.append(ObjectId(mongo_id_str))
                except Exception:
                    pass
        
        if not matched_mongo_ids:
            print("❌ لا يوجد معرّفات (IDs) صالحة من Qdrant لاستخدامها في MongoDB.")
            return []
        
        # print(f"📌 IDs صالحة لـ MongoDB: {matched_mongo_ids[:3]}...")
        
        all_supervisors = list(
            self.supervisors_collection.find(
                {"_id": {"$in": matched_mongo_ids}},
                max_time_ms=60000 
            )
        )
        
        if not all_supervisors:
            print("❌ لم يتم جلب أي مشرفين من MongoDB. تحقق من تطابق الـ IDs بين Qdrant و MongoDB.")
            return []
        
        qdrant_scores_map = {str(m.get('mongo_id')): m.get('similarity_score', 0.0) 
                             for m in qdrant_matches 
                             if m.get('mongo_id') and len(str(m.get('mongo_id'))) == 24}
        
        for sup in all_supervisors:
            sup['qdrant_score'] = qdrant_scores_map.get(str(sup['_id']), 0.0) 
        
        print(f"✅ تم جلب {len(all_supervisors)} مشرف للتقييم التفصيلي.")
        
        # 3. تصنيف المشرفين
        same_major = []
        different_major = []
        
        for supervisor in all_supervisors:
            dept = str(supervisor.get("Department", "")).lower()
            major_lower = student_major.lower()
            
            is_same = (
                major_lower in dept or 
                dept in major_lower or
                self._check_department_similarity(dept, major_lower) 
            )
            
            if is_same:
                same_major.append(supervisor)
            else:
                different_major.append(supervisor)
        
        print(f"📊 تصنيف المشرفين (بعد Qdrant):")
        print(f"   ✅ نفس التخصص: {len(same_major)}")
        print(f"   🔹 خارج التخصص: {len(different_major)}\n")
        
        # 4. تحليل أبحاث المشرفين وتطبيق خوارزمية التسجيل
        print("🔍 تطبيق خوارزمية التسجيل الموزون...")
        
        idea_embedding_list = idea_embedding.tolist() if isinstance(idea_embedding, np.ndarray) else idea_embedding
        
        # 💡 يتم تجميع مهام جلب الأبحاث والتوافق الإشرافي داخل _score_supervisors
        same_major_scored = await self._score_supervisors(
            supervisors=same_major, 
            idea_keywords=idea_keywords, 
            label="نفس التخصص",
            idea_embedding=idea_embedding_list
        )
        
        different_major_scored = await self._score_supervisors(
            supervisors=different_major, 
            idea_keywords=idea_keywords, 
            label="خارج التخصص",
            idea_embedding=idea_embedding_list
        )
        
        # 5. ترتيب حسب النتيجة وتطبيق قاعدة 3+2
        same_major_scored.sort(key=lambda x: x["final_score"], reverse=True)
        different_major_scored.sort(key=lambda x: x["final_score"], reverse=True)
        
        recommendations = []
        
        recommendations.extend(same_major_scored[:3])
        recommendations.extend(different_major_scored[:2])
        
        # 6. إضافة علامة التخصص
        for i, rec in enumerate(recommendations):
            dept = str(rec["supervisor"].get("Department", "")).lower()
            is_same_major = (student_major.lower() in dept or 
                             dept in student_major.lower() or 
                             self._check_department_similarity(dept, student_major.lower()))
            rec["is_same_major"] = is_same_major
            rec["id"] = i 
            
        # 7. تطبيق إعادة الترتيب (Re-ranking) وتوليد سبب الترشيح 
        recommendations = await self._rerank_and_explain(recommendations, idea_text)
        
        print(f"\n{'='*80}")
        print("🏆 Recommended Supervisors Analytical Report (Weighted Scores)")
        print(f"{'='*80}")
        
        # طباعة أفضل عدد (top_k) باستخدام الدرجات المحسوبة
        for i, rec in enumerate(recommendations[:top_k]):
            name = rec["supervisor"].get("Name", "Unknown")
            is_same_major = "✅  Same Major" if rec.get("is_same_major") else "🔹 Outside Major"
            
            # استخراج الدرجات الأولية (الدرجات الكمية)
            semantic_score = rec.get("semantic_similarity", 0.0) 
            supervision_score = rec.get("supervision_match_score", 0.0) 
            initial_score = rec.get("initial_score", rec["final_score"]) 
            
            print(f"🥇 Candidate #{i+1}: {name} ({is_same_major})")
            print(f"   Final Score (After Reranking): {rec['final_score']:.2f}")
            
            # ************************************************************
            # عرض تفاصيل العملية الحسابية
            # ************************************************************
            print(f" 📊 Initial Quantitative Analysis: :")
            print(f"      - Semantic Similarity: tic Similarity): {semantic_score:.2f} (Weight 50%)")
            print(f"      - Supervision Match: (Supervision Match): {supervision_score:.2f} (Weight 30%)")
            # لا يمكننا الوصول لـ Recency Score مباشرة هنا، لكن النتيجة الأولية تشملها
            print(f"      - Initial Weighted Score (Pre-Rerank): {initial_score:.2f}") 
            
            
            # هذا السطر تم تصحيح المسافة البادئة له ليكون داخل حلقة for
            print(f"{'-'*80}") 


        print(f"\n✅ تم عرض تقرير التحليل الكمي للـ {top_k} مشرف الأفضل.")
        print(f"{'='*80}\n")
        
        return recommendations[:top_k]
        
    # -------------------------------------------------------------

# 🛑 يجب إبقاء هذا السطر خارج نطاق الكلاس لتعريف الكائن
supervisor_recommendation = SupervisorRecommendation()