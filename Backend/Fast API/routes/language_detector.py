# utils/language_detector.py
"""
كاشف ذكي للغة النص (عربي أو إنجليزي)
يستخدم لتحديد اللغة المناسبة لمخرجات التحليل
"""

import re
from typing import Literal


def detect_language(text: str) -> Literal["ar", "en"]:
    """
    كشف ذكي للغة النص
    
    القواعد:
    - إذا كان النص يحتوي على 30% أو أكثر من الأحرف العربية → عربي
    - إذا كان مختلط (عربي + إنجليزي) → إنجليزي
    - إذا كان إنجليزي فقط → إنجليزي
    
    Args:
        text: النص المراد فحصه
        
    Returns:
        "ar" للعربي، "en" للإنجليزي
        
    Examples:
        >>> detect_language("نظام ذكي للكشف عن الاحتيال")
        'ar'
        >>> detect_language("Smart Fraud Detection System")
        'en'
        >>> detect_language("نظام AI للكشف عن Fraud")
        'en'
    """
    # التحقق من النص الفارغ
    if not text or not text.strip():
        return "en"
    
    # إزالة الأرقام والرموز والمسافات للحصول على الأحرف فقط
    clean_text = re.sub(r'[0-9\s\W_]+', '', text)
    
    if not clean_text:
        return "en"
    
    # عد الأحرف العربية (Unicode range للعربية)
    arabic_chars = len(re.findall(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]', clean_text))
    
    # عد الأحرف الإنجليزية
    english_chars = len(re.findall(r'[a-zA-Z]', clean_text))
    
    # مجموع الأحرف
    total_chars = arabic_chars + english_chars
    
    if total_chars == 0:
        return "en"
    
    # حساب نسبة العربي
    arabic_percentage = (arabic_chars / total_chars) * 100
    
    # القرار:
    # - إذا كان 30% أو أكثر عربي → عربي
    # - غير ذلك (مختلط أو إنجليزي) → إنجليزي
    if arabic_percentage >= 30:
        return "ar"
    else:
        return "en"


def detect_combined_language(title: str, description: str) -> Literal["ar", "en"]:
    """
    كشف اللغة من العنوان والوصف معاً
    
    يجمع النصين ويحلل اللغة السائدة
    
    Args:
        title: عنوان المشروع
        description: وصف المشروع
        
    Returns:
        "ar" للعربي، "en" للإنجليزي
        
    Examples:
        >>> detect_combined_language("نظام ذكي", "نظام يستخدم الذكاء الاصطناعي")
        'ar'
        >>> detect_combined_language("AI System", "System using machine learning")
        'en'
    """
    combined_text = f"{title} {description}"
    return detect_language(combined_text)


# ============================================================================
# دوال مساعدة للتشخيص (اختيارية)
# ============================================================================

def get_language_stats(text: str) -> dict:
    """
    دالة مساعدة لعرض إحصائيات اللغة (للتشخيص فقط)
    
    Args:
        text: النص المراد تحليله
        
    Returns:
        قاموس يحتوي على الإحصائيات
    """
    clean_text = re.sub(r'[0-9\s\W_]+', '', text)
    
    arabic_chars = len(re.findall(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]', clean_text))
    english_chars = len(re.findall(r'[a-zA-Z]', clean_text))
    total_chars = arabic_chars + english_chars
    
    arabic_percentage = (arabic_chars / total_chars * 100) if total_chars > 0 else 0
    english_percentage = (english_chars / total_chars * 100) if total_chars > 0 else 0
    
    detected = detect_language(text)
    
    return {
        "arabic_chars": arabic_chars,
        "english_chars": english_chars,
        "total_chars": total_chars,
        "arabic_percentage": round(arabic_percentage, 2),
        "english_percentage": round(english_percentage, 2),
        "detected_language": detected
    }
