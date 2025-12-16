# services/embedding_service.py (Optimized - Using Gemini)

import os
import numpy as np
import google.generativeai as genai
from typing import List, Union
from config.database_config import db
from dotenv import load_dotenv

load_dotenv()

# 🚨 أبعاد المتجه لـ Gemini embeddings
VECTOR_DIMENSION = 768

class EmbeddingService:
    def __init__(self):
        """
        استخدام Gemini API للـ embeddings بدلاً من sentence-transformers
        أخف وأسرع وبدون مكتبات ثقيلة!
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("❌ GEMINI_API_KEY غير موجود في ملف .env")
        
        genai.configure(api_key=api_key)
        self.vector_size = VECTOR_DIMENSION
        self.embedding_dim = self.vector_size
        
        print(f"✅ Embedding Service initialized (Gemini API, Dim: {self.vector_size})")
    
    def embed_text(self, text: Union[str, List[str]]) -> List[float]:
        """
        توليد متجه نصي (Embedding) باستخدام Gemini API
        """
        # الحماية: التحقق من النص الفارغ
        if not text or (isinstance(text, str) and not text.strip()):
            return [0.0] * self.vector_size
        
        # التأكد من أن الإدخال string
        if isinstance(text, list):
            text = text[0] if text else ""
        
        try:
            # استخدام Gemini embedding API
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            
            embedding = result['embedding']
            
            # التأكد من الحجم الصحيح
            if len(embedding) != self.vector_size:
                # تعديل الحجم إذا لزم الأمر
                if len(embedding) > self.vector_size:
                    embedding = embedding[:self.vector_size]
                else:
                    embedding = embedding + [0.0] * (self.vector_size - len(embedding))
            
            return embedding
            
        except Exception as e:
            print(f"❌ فشل توليد المتجه: {str(e)}")
            print(f"   النص: '{text[:50]}...'")
            return [0.0] * self.vector_size
    
    def cosine_similarity(self, vec1: Union[np.ndarray, List[float]], vec2: Union[np.ndarray, List[float]]) -> float:
        """
        حساب تشابه الكوساين بين متجهين
        """
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
        توليد متجه يمثل التخصص البحثي للمشرف
        """
        # تجميع النص
        text_to_embed = (
            f"Supervisor Name: {supervisor_data.get('Name', '')}. "
            f"Department: {supervisor_data.get('Department', '')}. "
            f"Research Interests: " + " | ".join(paper_titles)
        )
        
        # توليد المتجه
        research_embedding = self.embed_text(text_to_embed)
        
        # الحفظ في MongoDB
        supervisor_id = supervisor_data.get("_id")
        if supervisor_id and research_embedding and len(research_embedding) == self.vector_size:
            db["Supervisor"].update_one(
                {"_id": supervisor_id},
                {"$set": {"research_embedding": research_embedding, "enriched": True}}
            )
            print(f"✅ تم تحديث المتجه البحثي للمشرف ID: {supervisor_id}")
            return research_embedding
        
        return None

embedding_service = EmbeddingService()