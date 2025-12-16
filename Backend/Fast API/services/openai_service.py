import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


class GeminiService:
    """
    خدمة التحليل باستخدام Google Gemini AI
    """
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("❌ GEMINI_API_KEY غير موجود في ملف .env")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('models/gemini-2.0-flash-exp')
        print("✅ Gemini Service initialized successfully")
    
    async def analyze_idea(self, prompt: str) -> str:
        """
        تحليل الفكرة باستخدام Gemini
        
        Args:
            prompt: البرومبت المُجهز للتحليل
            
        Returns:
            str: النص المُرجع من Gemini (JSON)
        """
        try:
            print(f"🤖 [Gemini] Sending prompt ({len(prompt)} chars)...")
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.7,
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=8192,
                )
            )
            
            result_text = response.text
            print(f"✅ [Gemini] Response received ({len(result_text)} chars)")
            
            return result_text
            
        except Exception as e:
            print(f"❌ [Gemini] Error: {str(e)}")
            raise Exception(f"Gemini analysis failed: {str(e)}")


# ✅ CRITICAL: نسميها openai_service عشان التوافق مع باقي الكود
openai_service = GeminiService()

print("✅ [OpenAI Service] Instance created (using Gemini)")