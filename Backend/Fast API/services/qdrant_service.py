# qdrant_service.py (محدث ليستخدم query_points)

from qdrant_client import QdrantClient, models 
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

# 🚨 يجب عليك تعديل هذا الثابت إلى 384 إذا كانت المتجهات المخزنة 384
VECTOR_DIMENSION = 768 

PROJECTS_COLLECTION = "projects_collection5" 
SUPERVISORS_COLLECTION = "supervisor5" 
KNOWLEDGE_BASE_COLLECTION = "knowledge_base5" 

class QdrantService:
    embedding_dim = VECTOR_DIMENSION

    def __init__(self):
        # إعدادات الاتصال بـ Qdrant (المستضافة سحابياً)
        print("🔄 الاتصال بخدمة Qdrant (سحابي)...")
        self.client = QdrantClient(
            url="https://fdd8845e-0011-4785-a8cf-dd0ca91f7c00.us-east4-0.gcp.cloud.qdrant.io:6333",
            api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.t8TJKSeDaWI33U8Xjzry6g6RSvqtwMi-sjfHGtaFOJk",
            timeout=60 # المهلة الافتراضية 5 ثواني، نزيدها إلى 60
        )
        self.projects_collection = PROJECTS_COLLECTION
        self.supervisors_collection = SUPERVISORS_COLLECTION
        self.knowledge_base_collection = KNOWLEDGE_BASE_COLLECTION
    
    
    # -------------------------------------------------------------------
    # دوال الإنشاء والحذف (Administration)
    # -------------------------------------------------------------------
    
    def create_collection(self, collection_name: str, vector_dim: int):
        """
        تنشئ (أو تعيد إنشاء) Collection جديد بالأبعاد الصحيحة.
        """
        print(f"➕ إنشاء/إعادة إنشاء المجموعة: {collection_name} بالأبعاد {vector_dim}")

        try:
            # محاولة حذف المجموعة إذا كانت موجودة (لتجنب الأخطاء)
            if self.client.collection_exists(collection_name):
                self.client.delete_collection(collection_name=collection_name)
                print(f"🗑️ تم حذف المجموعة القديمة: {collection_name}")
            
            # إنشاء المجموعة الجديدة
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(size=vector_dim, distance=models.Distance.COSINE),
            )
            print(f"✅ تم إنشاء Collection: {collection_name}")
        except Exception as e:
            print(f"❌ فشل إنشاء/إعادة إنشاء المجموعة {collection_name}: {e}")
            raise


    def recreate_all_collections(self):
        """يحذف وينشئ جميع مجموعات Qdrant (للاستخدام لمرة واحدة عند الإعداد)"""
        
        print("\n--- إعداد مجموعات Qdrant ---")
        
        collections = [self.projects_collection, self.supervisors_collection, self.knowledge_base_collection]
        
        for collection_name in collections:
            try:
                # محاولة الحذف
                print(f"🗑️ حذف المجموعة القديمة: {collection_name}...")
                self.client.delete_collection(collection_name=collection_name)
            except Exception:
                # تجاهل الخطأ إذا لم تكن موجودة
                pass 
            
            # الإنشاء بالأبعاد الصحيحة (باستخدام الدالة الموحدة)
            self.create_collection(collection_name, VECTOR_DIMENSION)
        
        print(f"✅ تم إعداد جميع المجموعات بنجاح بالأبعاد {VECTOR_DIMENSION}.")


    # -------------------------------------------------------------------
    # دوال الإضافة/التخزين (Upsert)
    # -------------------------------------------------------------------
    
    def upsert_points(self, collection_name: str, points: List[Dict]):
        """تخزين/تحديث النقاط في الـ Collection المحدد."""
        
        # تحويل القائمة من القواميس إلى قائمة من Qdrant PointStructs
        qdrant_points = [
            models.PointStruct(
                id=point["id"],
                vector=point["vector"],
                payload=point["payload"]
            )
            for point in points
        ]
        
        # التخزين الفعلي (upsert)
        operation_info = self.client.upsert(
            collection_name=collection_name,
            points=qdrant_points,
            wait=True # الانتظار حتى اكتمال العملية
        )
        
        return operation_info

    # -------------------------------------------------------------------
    # دوال البحث (Search) - ✅ تم تحديثها لاستخدام query_points
    # -------------------------------------------------------------------

    def search_supervisors_by_vector(self, query_vector: List[float], top_k: int = 10) -> List[Dict]:
        """
        البحث عن مشرفين في Qdrant بناءً على المتجه (Embedding)
        وإرجاعهم مع اهتماماتهم البحثية.
        """
        print("💡 تم التحديث: استخدام query_points بدلاً من search (لحل DeprecationWarning)")
        try:
            # 🛑 استخدام query_points بدلاً من search
            results = self.client.query_points(
                collection_name=self.supervisors_collection,
                query=query_vector,
                limit=top_k,
                with_payload=True, # تأكد من جلب الـ Payload الذي يحتوي على mongo_id
                with_vectors=False
            )
            
            supervisors = []
            for result in results.points:
                supervisor_data = result.payload or {}
                supervisor_data["similarity_score"] = result.score
                
                # 🛑 الإصلاح الحاسم لـ 'mongo_id' (تم تنفيذه في الجولة السابقة)
                # نحاول استخلاص المعرف من الـ Payload، أو نستخدم ID Qdrant كخيار أخير 
                # (مع ملاحظة أن ID Qdrant عادةً ليس ObjectId)
                mongo_id_str = supervisor_data.get('mongo_id') or supervisor_data.get('_id')
                
                if mongo_id_str:
                    supervisor_data['mongo_id'] = str(mongo_id_str)
                else:
                    # قد يكون ID Qdrant هو معرّف MongoDB نفسه
                    supervisor_data['mongo_id'] = str(result.id) 
                
                # نضيف المشرفين الذين لديهم أي معرّف (سيتم التحقق من صلاحية ObjectId في الدالة التالية)
                if supervisor_data.get('mongo_id'):
                    supervisors.append(supervisor_data)
                
            
            print(f"✅ عثر على {len(supervisors)} مشرفين مرشحين من Qdrant")
            return supervisors
            
        except Exception as e:
            print(f"❌ خطأ في البحث عن مشرفين: {str(e)}")
            return []
    
    def search_projects(self, query_vector: List[float], top_k: int = 5) -> List[Dict]:
      """Search for projects using an embedding vector and return the top-k matches."""
      try:
        results = self.client.query_points(
            collection_name=self.projects_collection,
            query=query_vector,
            limit=top_k,
            with_payload=True
        )
        
        projects = []
        print("Search results:")
        print("-" * 80)
        
        for i, point in enumerate(results.points, 1):
            payload = point.payload or {}
            
            # Extract only the fields you care about (with fallback values)
            department    = payload.get("department", "Not specified")
            year          = payload.get("year", "Not specified")
            project_title = payload.get("project_title", "No title")
            score         = point.score
            
            # Print the relevant info in a neat format
            print(f"{i}. Department : {department}")
            print(f"   Year      : {year}")
            print(f"   Title     : {project_title}")
            print(f"   Score     : {score:.4f}")
            print("-" * 80)
            
            # Keep the full payload for the returned list (optional)
            project_data = payload.copy()
            project_data["similarity_score"] = score
            projects.append(project_data)
        
        print(f"Successfully retrieved {len(projects)} project(s)")
        return projects
        
      except Exception as e:
          print(f"Error searching projects: {str(e)}")
          return []
    
    def search_knowledge_base(self, query_vector: List[float], top_k: int = 10) -> List[Dict]:
        """البحث في قاعدة المعرفة بناءً على المتجه (Embedding)."""
        try:
            results = self.client.query_points(
                collection_name=self.knowledge_base_collection,
                query=query_vector,
                limit=top_k,
                with_payload=True
            )
            
            knowledge = []
            for result in results.points:
                knowledge.append(result.payload)
            
            print(f"✅ عثر على {len(knowledge)} مصطلح من قاعدة المعرفة")
            return knowledge
            
        except Exception as e:
            print(f"❌ خطأ في البحث في قاعدة المعرفة: {str(e)}")
            return []

qdrant_service = QdrantService()