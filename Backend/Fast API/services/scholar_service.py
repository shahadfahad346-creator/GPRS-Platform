import requests
from typing import List, Dict, Optional
import time

class ScholarService:
    def __init__(self):
        self.base_url = "https://api.semanticscholar.org/graph/v1"
        self.headers = {
            "User-Agent": "Academic Research System"
        }
    
    def get_author_papers_by_id(self, author_id: str, max_results: int = 10) -> List[Dict]:
        """
        جلب أبحاث المشرف باستخدام Author_ID من Google Scholar
        """
        try:
            if not author_id or author_id.strip() == "":
                return []
            
            # جلب أبحاث المؤلف مباشرة
            papers_url = f"{self.base_url}/author/{author_id}/papers"
            papers_params = {
                "fields": "title,year,citationCount,publicationDate,abstract",
                "limit": max_results
            }
            
            response = requests.get(
                papers_url, 
                params=papers_params, 
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"⚠️ فشل جلب أبحاث المشرف (ID: {author_id}): {response.status_code}")
                return []
            
            papers_data = response.json().get("data", [])
            
            # ترتيب حسب السنة (الأحدث أولاً)
            papers_data.sort(key=lambda x: x.get("year", 0) or 0, reverse=True)
            
            papers = []
            for paper in papers_data:
                year = paper.get("year")
                if year and year >= 2020:  # أبحاث من 2020 فما فوق
                    papers.append({
                        "title": paper.get("title", "بدون عنوان"),
                        "year": year,
                        "citations": paper.get("citationCount", 0),
                        "abstract": (paper.get("abstract", "")[:300] if paper.get("abstract") else ""),
                        "publication_date": paper.get("publicationDate", "")
                    })
            
            print(f"✅ تم جلب {len(papers)} بحث حديث (2020+)")
            return papers
            
        except Exception as e:
            print(f"❌ خطأ في جلب الأبحاث: {str(e)}")
            return []
    
    def search_author_recent_papers(self, author_name: str, max_results: int = 10) -> List[Dict]:
        """
        البحث عن أحدث أبحاث المشرف بالاسم (fallback إذا ما كان في Author_ID)
        """
        try:
            clean_name = author_name.replace("Dr. ", "").replace("Prof. ", "").strip()
            
            search_url = f"{self.base_url}/author/search"
            params = {"query": clean_name, "limit": 3}
            
            response = requests.get(search_url, params=params, headers=self.headers, timeout=10)
            
            if response.status_code != 200:
                return []
            
            authors = response.json().get("data", [])
            if not authors:
                return []
            
            author_id = authors[0].get("authorId")
            if not author_id:
                return []
            
            time.sleep(0.3)
            return self.get_author_papers_by_id(author_id, max_results)
            
        except Exception as e:
            print(f"❌ خطأ في البحث: {str(e)}")
            return []
    
    def check_research_relevance(self, papers: List[Dict], idea_keywords: List[str]) -> Dict:
        """
        فحص مدى توافق الأبحاث مع فكرة الطالب
        """
        if not papers:
            return {"relevant": False, "match_score": 0}
        
        relevant_papers = []
        for paper in papers:
            title = paper.get("title", "").lower()
            abstract = paper.get("abstract", "").lower()
            combined_text = title + " " + abstract
            
            # حساب التطابق
            matches = sum(1 for keyword in idea_keywords if keyword.lower() in combined_text)
            
            if matches > 0:
                relevant_papers.append({
                    "paper": paper,
                    "matches": matches
                })
        
        if relevant_papers:
            return {
                "relevant": True,
                "match_score": len(relevant_papers),
                "relevant_papers": sorted(relevant_papers, key=lambda x: x["matches"], reverse=True)
            }
        
        return {"relevant": False, "match_score": 0}

scholar_service = ScholarService()