import os
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()


def safe_int(value, default=0):
    """تحويل آمن لـ int"""
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value, default=0.0):
    """تحويل آمن لـ float"""
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


class SerpAPIService:
    def __init__(self):
        self.api_key = os.getenv("SERP_API_KEY")
        if not self.api_key:
            print("⚠️ SERP_API_KEY غير موجود في .env - سيتم استخدام Semantic Scholar")
        self.base_url = "https://serpapi.com/search"
    
    def search_scholar_by_author_id_semantic(self, author_id: str, max_results: int = 15) -> List[Dict]:
        """
        البحث باستخدام Semantic Scholar API (مجاني بالكامل)
        """
        if not author_id or author_id.strip() == "":
            return []
        
        try:
            base_url = "https://api.semanticscholar.org/graph/v1"
            papers_url = f"{base_url}/author/{author_id}/papers"
            
            params = {
                "fields": "title,year,citationCount,publicationDate",
                "limit": max_results
            }
            
            headers = {"User-Agent": "Academic Research System"}
            
            response = requests.get(papers_url, params=params, headers=headers, timeout=59)
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            papers_data = data.get("data", [])
            
            # ترتيب حسب السنة (الأحدث أولاً)
            papers_data.sort(key=lambda x: safe_int(x.get("year"), 0), reverse=True)
            
            papers = []
            for paper in papers_data:
                year = safe_int(paper.get("year"), 0)
                if year >= 2018:
                    papers.append({
                        "title": paper.get("title", "بدون عنوان"),
                        "year": year,
                        "citations": safe_int(paper.get("citationCount"), 0),
                        "link": "",
                        "authors": ""
                    })
            
            return papers
            
        except Exception as e:
            print(f"         ❌ Semantic Scholar error: {str(e)}")
            return []
    
    def search_scholar_by_author_id(self, author_id: str, max_results: int = 15) -> List[Dict]:
        """
        البحث عن أبحاث المشرف (SerpAPI أولاً، ثم Semantic Scholar كبديل)
        """
        if not author_id or author_id.strip() == "":
            return []
        
        # محاولة SerpAPI أولاً (إذا كان API key موجود)
        if self.api_key:
            try:
                params = {
                    "engine": "google_scholar_author",
                    "author_id": author_id.strip(),
                    "api_key": self.api_key,
                    "num": max_results,
                    "sort": "pubdate"
                }
                
                response = requests.get(self.base_url, params=params, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    articles = data.get("articles", [])
                    
                    papers = []
                    for article in articles:
                        year = safe_int(article.get("year"), 0)
                        if year >= 2018:
                            cited_by_value = 0
                            cited_by = article.get("cited_by", {})
                            if isinstance(cited_by, dict):
                                cited_by_value = safe_int(cited_by.get("value"), 0)
                            
                            papers.append({
                                "title": article.get("title", "بدون عنوان"),
                                "year": year,
                                "citations": cited_by_value,
                                "link": article.get("link", ""),
                                "authors": article.get("authors", "")
                            })
                    
                    if papers:
                        return papers
                
            except Exception as e:
                pass  # استمر للبديل
        
        # البديل: Semantic Scholar (مجاني)
        return self.search_scholar_by_author_id_semantic(author_id, max_results)
    
    def check_research_relevance(self, papers: List[Dict], idea_keywords: List[str]) -> Dict:
        """
        فحص مدى توافق الأبحاث مع فكرة الطالب
        معايير محسّنة:
        - تطابق الكلمات المفتاحية
        - حداثة الأبحاث
        - عدد الاقتباسات
        """
        if not papers:
            return {
                "relevant": False, 
                "match_score": 0, 
                "total_papers": 0,
                "matching_papers": []
            }
        
        matching_papers = []
        
        for paper in papers:
            title = paper.get("title", "").lower()
            year = safe_int(paper.get("year"), 0)
            citations = safe_int(paper.get("citations"), 0)  # ✅ استخدام safe_int
            
            # حساب التطابق
            matches = 0
            matched_keywords = []
            
            for keyword in idea_keywords:
                if keyword and keyword.lower() in title:
                    matches += 1
                    matched_keywords.append(keyword)
            
            if matches > 0:
                # نتيجة مركبة: تطابق + حداثة + اقتباسات
                recency_bonus = 1.0 if year >= 2023 else 0.5
                citation_score = min(safe_float(citations) / 10.0, 1.0)  # ✅ استخدام safe_float
                
                paper_score = (
                    matches * 2 +              # التطابق (أهم عامل)
                    recency_bonus +            # الحداثة
                    citation_score * 0.5       # الاقتباسات
                )
                
                matching_papers.append({
                    "title": paper.get("title"),
                    "year": year,
                    "matches": matches,
                    "matched_keywords": matched_keywords,
                    "score": paper_score,
                    "citations": citations
                })
        
        if matching_papers:
            # ترتيب حسب النتيجة
            matching_papers.sort(key=lambda x: x["score"], reverse=True)
            
            # حساب match_score (0-5)
            match_score = min(len(matching_papers), 5)
            
            return {
                "relevant": True,
                "match_score": match_score,
                "total_papers": len(papers),
                "matching_papers": matching_papers[:5],
                "recent_count": sum(1 for p in papers if safe_int(p.get("year"), 0) >= 2023)
            }
        
        return {
            "relevant": False,
            "match_score": 0,
            "total_papers": len(papers),
            "matching_papers": []
        }


serpapi_service = SerpAPIService()