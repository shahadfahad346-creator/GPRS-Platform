from typing import List, Dict
from services.embedding_service import embedding_service
from services.qdrant_service import qdrant_service
from services.gemini_service import gemini_service 

class RAGService:
    def __init__(self):
        self.embedding_service = embedding_service
        self.qdrant_service = qdrant_service
        self.gemini_service = gemini_service 
    
    def _interpret_score(self, score: float) -> str:
        """تفسير نسبة التشابه بشكل واضح"""
        if score >= 0.85:
            return "🔴 تشابه عالي جداً - احتمال تكرار"
        elif score >= 0.70:
            return "🟠 تشابه قوي - يحتاج مراجعة"
        elif score >= 0.55:
            return "🟡 تشابه متوسط - بعض التقاطع"
        elif score >= 0.40:
            return "🟢 تشابه ضعيف - مقبول"
        else:
            return "✅ تشابه طفيف - آمن"
    
    def _analyze_score_distribution(self, results: List[Dict]) -> Dict:
        """تحليل إحصائي لتوزيع درجات التشابه"""
        if not results:
            return {
                "max_score": 0,
                "min_score": 0,
                "avg_score": 0,
                "total_count": 0,
                "high_similarity_count": 0,
                "medium_similarity_count": 0,
                "low_similarity_count": 0
            }
        
        scores = [r.get('similarity_score', 0) for r in results]
        
        return {
            "max_score": max(scores),
            "min_score": min(scores),
            "avg_score": sum(scores) / len(scores),
            "total_count": len(scores),
            "high_similarity_count": len([s for s in scores if s >= 0.70]),
            "medium_similarity_count": len([s for s in scores if 0.40 <= s < 0.70]),
            "low_similarity_count": len([s for s in scores if s < 0.40])
        }
    
    def _get_dynamic_threshold(self, results: List[Dict]) -> float:
        """حساب عتبة ديناميكية بناءً على توزيع النتائج"""
        if not results:
            return 0.40
        
        stats = self._analyze_score_distribution(results)
        avg_score = stats['avg_score']
        
        # إذا كان متوسط النتائج مرتفع، نرفع العتبة
        if avg_score > 0.70:
            return 0.60  # عتبة أعلى للنتائج المرتفعة
        elif avg_score > 0.55:
            return 0.50
        elif avg_score > 0.45:
            return 0.45
        else:
            return 0.40  # العتبة الافتراضية
    
    async def find_similar_projects(self, idea_text: str, top_k: int = 5) -> Dict:
        """
        RAG المُحسّن: البحث في Qdrant فقط + تحليل بواسطة LLM.
        لا يوجد أي fallback أو بيانات وهمية.
        """
        print(f"🔍 RAG: البحث عن مشاريع مشابهة...")
        print(f"📝 الفكرة المدخلة: {idea_text[:150]}...")
        
        try:
            idea_embedding = self.embedding_service.embed_text(idea_text) 
        except AttributeError as e:
            print(f"❌ خطأ: اسم الدالة في EmbeddingService غير صحيح. {e}")
            raise 
            
        if not idea_embedding:
            print("❌ فشل توليد المتجه. إيقاف البحث.")
            return {
                "duplication_status": "Error",
                "analysis_report": "Failed to generate idea embedding.",
                "reranked_projects": [],
                "statistics": {}
            }

        # البحث في Qdrant عن أقرب 10 مشاريع (بدلاً من 5)
        results = self.qdrant_service.search_projects(
            query_vector=idea_embedding,
            top_k=10  # نسترجع عدد أكبر للتحليل الأفضل
        )
        
        print(f"   ✅ Qdrant: استرجع {len(results)} مشروع")
        
        # تحليل إحصائي للنتائج
        stats = self._analyze_score_distribution(results)
        
        if results:
            print("\n" + "="*80)
            print("📊 تحليل إحصائي للنتائج:")
            print(f"   • أعلى نسبة: {stats['max_score']:.4f}")
            print(f"   • أقل نسبة: {stats['min_score']:.4f}")
            print(f"   • المتوسط: {stats['avg_score']:.4f}")
            print(f"   • مشاريع تشابه عالي (≥0.70): {stats['high_similarity_count']}")
            print(f"   • مشاريع تشابه متوسط (0.40-0.70): {stats['medium_similarity_count']}")
            print(f"   • مشاريع تشابه ضعيف (<0.40): {stats['low_similarity_count']}")
            print("="*80)
            
            print("\n--- المشاريع المُسترجعة من Qdrant: ---")
            for i, proj in enumerate(results):
                title = proj.get('project_title') or proj.get('title', 'لا يوجد عنوان')
                score = proj.get('similarity_score', proj.get('score', 0.0))
                interpretation = self._interpret_score(score)
                
                print(f"    {i+1}. الدرجة: {score:.4f} {interpretation}")
                print(f"       العنوان: {title[:70]}...")
                
                # إضافة معلومات إضافية
                dept = proj.get('department', 'غير محدد')
                year = proj.get('year', 'غير محدد')
                print(f"       القسم: {dept} | السنة: {year}")
                print("-" * 80)

        # حساب العتبة الديناميكية
        dynamic_threshold = self._get_dynamic_threshold(results)
        print(f"\n🎯 العتبة المحسوبة: {dynamic_threshold:.2f}")
        
        # تصفية المشاريع بناءً على العتبة الديناميكية
        filtered_results = [r for r in results if r.get('similarity_score', 0) >= dynamic_threshold]
        
        print(f"   ✅ بعد التصفية (score >= {dynamic_threshold:.2f}): {len(filtered_results)} مشروع")
        
        # تحذير بناءً على أعلى نسبة تشابه
        if stats['max_score'] >= 0.85:
            print(f"   🚨 تحذير شديد: يوجد مشروع بتشابه {stats['max_score']:.2%} - احتمال تكرار عالي!")
        elif stats['max_score'] >= 0.70:
            print(f"   ⚠️ تحذير: يوجد مشروع بتشابه {stats['max_score']:.2%} - يحتاج مراجعة دقيقة")
        elif stats['max_score'] >= 0.55:
            print(f"   ℹ️ ملاحظة: يوجد تشابه متوسط {stats['max_score']:.2%} - مقبول مع تمييز الفكرة")
        else:
            print(f"   ✅ ممتاز: أعلى تشابه {stats['max_score']:.2%} - فكرة مميزة!")
        
        # تحذير إذا النتائج قليلة جدًا
        if len(filtered_results) < 3:
            print(f"   ⚠️ تحذير: نتائج قليلة ({len(filtered_results)} مشروع فقط) - قد يكون النظام بحاجة لمزيد من البيانات.")
        
        # نأخذ أقصى top_k من النتائج المصفاة (أو أقل إذا ما توفرت)
        final_projects = filtered_results[:top_k]
        
        print(f"\n🧠 إرسال {len(final_projects)} مشروع إلى Gemini للتحليل النهائي...")
        
        # إرسال المشاريع الحقيقية فقط إلى Gemini للتحليل
        analysis_report = await self._analyze_similarity(
            idea_text=idea_text, 
            similar_projects=final_projects,
            statistics=stats  # إضافة الإحصائيات للتقرير النهائي
        )
        
        # إضافة معلومات إضافية للتقرير
        analysis_report['search_statistics'] = stats
        analysis_report['threshold_used'] = dynamic_threshold
        analysis_report['total_projects_found'] = len(results)
        analysis_report['projects_after_filtering'] = len(filtered_results)
        
        return analysis_report
    
    async def _analyze_similarity(self, idea_text: str, similar_projects: List[Dict], statistics: Dict = None) -> Dict:
        """
        استخدام Gemini لتحليل النتائج الحقيقية فقط وتوليد تقرير مفصل.
        """
        print("🧠 تحليل مدى التشابه وتحديد التكرار بواسطة LLM...")

        data_for_llm = {
            "new_idea_abstract": idea_text,
            "retrieved_projects": [
                {
                    "id": p.get('project_id', p.get('_id')),
                    "title": p.get('project_title') or p.get('title') or p.get('projrct_title', 'عنوان مفقود'),
                    "year": p.get('year', 'غير محدد'),           
                    "department": p.get('department', 'غير محدد'), 
                    "abstract": p.get('abstract', 'لا يوجد وصف.'),
                    "similarity_score": p.get('similarity_score', p.get('score', 0.0)),
                } 
                for p in similar_projects
            ],
            "statistics": statistics  # إضافة الإحصائيات لسياق أفضل
        }
        
        try:
            report = await self.gemini_service.analyze_project_duplication(data_for_llm)
            
            duplication_status = report.get('duplication_status', 'Not Determined')
            print(f"   ✅ حالة التكرار: {duplication_status}")
            
            # طباعة ملخص التقرير
            if 'similarity_percentage' in report:
                print(f"   📊 نسبة التشابه الإجمالية: {report['similarity_percentage']}")
            
            return report
            
        except Exception as e:
            print(f"❌ فشل في تحليل LLM: {e}")
            return {
                "duplication_status": "Error",
                "analysis_report": f"Failed to run LLM analysis: {str(e)}",
                "reranked_projects": similar_projects,
                "error_details": str(e)
            }

# لا توجد دالة fallback نهائياً

rag_service = RAGService()