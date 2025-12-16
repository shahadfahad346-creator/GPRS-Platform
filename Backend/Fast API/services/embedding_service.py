# services/embedding_service.py

from typing import List, Union
import numpy as np
from sentence_transformers import SentenceTransformer
# يجب توفير اسم النموذج في ملف .env أو كمتغير ثابت
# MODEL_NAME هو الاسم المفترض لـ 'paraphrase-multilingual-mpnet-base-v2'
MODEL_NAME = "paraphrase-multilingual-mpnet-base-v2" 

# استدعاء قاعدة البيانات MongoDB للحفظ
from config.database_config import db 
import warnings
import os

# 🚨 ثوابت الأبعاد 🚨
# الأبعاد الصحيحة للنموذج المستخدم
VECTOR_DIMENSION = 768 

class EmbeddingService:
    def __init__(self):
        self.model_name = MODEL_NAME
        self.vector_size = VECTOR_DIMENSION
        # ✅ الخاصية التي يبحث عنها سكريبت reindex_projects.py
        self.embedding_dim = self.vector_size 

        # 🔄 الاتصال وتحميل النموذج باستخدام SentenceTransformer
        # تم دمج منطق تحميل النموذج الذي أرسلته مع التعديلات
        print("🚀 تحميل نموذج Embedding...")
        
        # تعطيل تحذيرات التحويل أثناء تحميل النموذج
        warnings.filterwarnings("ignore")
        
        try:
            # استخدام 'cpu' إذا لم يتم تعيينه لتجنب مشكلات GPU إذا كانت غير مدعومة
            self.model = SentenceTransformer(self.model_name, device='cpu') 
            print(f"✅ تم تحميل النموذج بنجاح: {self.model_name} (Dim: {self.vector_size})")
        except Exception as e:
            print(f"❌ خطأ فادح في تحميل النموذج {self.model_name}: {e}")
            self.model = None
        
        warnings.filterwarnings("default")

    
    def embed_text(self, text: Union[str, List[str]]) -> List[float]:
        """
        توليد متجه نصي (Embedding) باستخدام SentenceTransformer.
        استبدلت create_text_embedding بـ embed_text لتوحيد الأسماء.
        """
        # إذا لم يتم تحميل النموذج بنجاح
        if self.model is None:
            print("❌ النموذج غير محمل. تعذر إنشاء المتجه.")
            return []
            
        # الحماية 1: التحقق من النص الفارغ أو المسافات البيضاء
        if not text or (isinstance(text, str) and not text.strip()):
            # إرجاع vector صفري بنفس الحجم (768) لتمثيل "لا معلومة"
            return [0.0] * self.vector_size
        
        # التأكد من أن الإدخال عبارة عن قائمة لـ .encode
        if isinstance(text, str):
            text = [text]

        try:
            # نستخدم convert_to_numpy=True لضمان الأداء الأسرع
            embedding_np = self.model.encode(text, convert_to_numpy=True)[0] 
            
            # التأكد من أن المتجه له الحجم الصحيح (768)
            if len(embedding_np) != self.vector_size:
                raise ValueError(f"حجم المتجه غير متوقع: {len(embedding_np)}، المتوقع: {self.vector_size}")

            return embedding_np.tolist()
            
        except Exception as e:
            # هذا الجزء سيكشف سبب الفشل الحقيقي
            print(f"❌ فشل توليد المتجه للنص: '{text[0][:50]}...'")
            print(f"❌ نوع الخطأ: {type(e).__name__} - رسالة الخطأ: {e}")
            return []

    def cosine_similarity(self, vec1: Union[np.ndarray, List[float]], vec2: Union[np.ndarray, List[float]]) -> float:
        """
        حساب تشابه الكوساين بين متجهين باستخدام NumPy.
        """
        # التأكد من أن الإدخال NumPy arrays
        vec1_np = np.array(vec1) if not isinstance(vec1, np.ndarray) else vec1
        vec2_np = np.array(vec2) if not isinstance(vec2, np.ndarray) else vec2

        norm1 = np.linalg.norm(vec1_np)
        norm2 = np.linalg.norm(vec2_np)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        similarity = np.dot(vec1_np, vec2_np) / (norm1 * norm2)
        return float(np.clip(similarity, -1.0, 1.0)) 

    def generate_and_save_supervisor_embedding(self, supervisor_data: dict, paper_titles: List[str]):
        """
        توليد متجه يمثل التخصص البحثي للمشرف وحفظه في وثيقة المشرف (MongoDB).
        """
        # 1. تجميع النص
        text_to_embed = (
            f"Supervisor Name: {supervisor_data.get('Name', '')}. " 
            f"Department: {supervisor_data.get('Department', '')}. " 
            f"Research Interests: " + " | ".join(paper_titles)
        )
        
        # 2. توليد المتجه
        # ⚠️ استخدام embed_text بدلاً من create_text_embedding
        research_embedding = self.embed_text(text_to_embed) 
        
        # 3. الحفظ في MongoDB
        supervisor_id = supervisor_data.get("_id")
        # التحقق من أن المتجه غير فارغ وأن حجمه صحيح (768)
        if supervisor_id and research_embedding and len(research_embedding) == self.vector_size:
            # ⚠️ يجب التأكد من استخدام اسم المجموعة الصحيح للمشرفين، الذي تم تعيينه إلى 'Supervisor'
            # في database_config.py
            db["Supervisor"].update_one( 
                {"_id": supervisor_id},
                {"$set": {"research_embedding": research_embedding, "enriched": True}} # ✅ إضافة حقل enriched
            )
            print(f"✅ تم تحديث المتجه البحثي للمشرف ID: {supervisor_id}")
            return research_embedding
        
        return None

embedding_service = EmbeddingService()