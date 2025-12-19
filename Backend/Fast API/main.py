from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  
from config.database_config import db
from bson import ObjectId 

# Import routes
from routes import auth_routes 
from routes.supervisor_routes import router as supervisor_router  
from routes.student_routes import router as student_router
from routes.idea_routes import router as idea_router
from routes.graduation_project_routes import router as project_router
from routes.analysis_routes import router as analysis_router
from routes.team_routes import router as team_router

# ========================================
# 🚀 FastAPI App Configuration
# ========================================

app = FastAPI(
    title="GPRS - Graduation Project Recommendation System",
    description="نظام توصية مشاريع التخرج الذكي | Smart Graduation Project Recommendation System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ========================================
# 🌐 CORS Configuration
# ========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://gprs-frontend.onrender.com"
        "http://localhost:3000",         
        "http://127.0.0.1:5173",      
        "http://127.0.0.1:3000",      
    ],
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Content-Type, Authorization, etc.
)

# ========================================
# 🔧 Helper Functions
# ========================================

def fix_id(doc):
    """تحويل ObjectId إلى string"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ========================================
# 📍 Root Endpoints
# ========================================

@app.get("/")
def home():
    """
    الصفحة الرئيسية للـ API
    """
    return {
        "status": "online",
        "message": "🚀 GPRS API - Ready and Running",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/auth",
            "students": "/students",
            "supervisors": "/api/supervisors",  # ✅ محدث
            "projects": "/projects",
            "analysis": "/analysis",
            "ideas": "/ideas"
        }
    }

@app.get("/health")
def health_check():
    """
    فحص صحة الخادم
    """
    try:
        # اختبار الاتصال بـ MongoDB
        db.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "2025-01-26"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# ========================================
# 📌 Legacy Endpoints (Temporary)
# ========================================

@app.get("/users")
def get_users():
    """
    جلب المستخدمين (مؤقت - للتوافق مع الكود القديم)
    """
    users_collection = db["Users"]
    users = list(users_collection.find())
    return [fix_id(user) for user in users]

# ========================================
# 🔗 Route Registration
# ========================================

# Authentication
app.include_router(
    auth_routes.router, 
    prefix="/auth", 
    tags=["🔐 Authentication"]
)

# Students
app.include_router(
    student_router, 
    prefix="/students", 
    tags=["👨‍🎓 Students"]
)

# ✅ Supervisors - محدث
app.include_router(
    supervisor_router,  # بدون prefix لأن الـ router عنده prefix="/api/supervisors"
    tags=["👨‍🏫 Supervisors"]
)

# Graduation Projects
app.include_router(
    project_router, 
    prefix="/projects", 
    tags=["📊 Graduation Projects"]
)

# Analysis
app.include_router(
    analysis_router, 
    prefix="/analysis", 
    tags=["🧠 AI Analysis"]
)

# Ideas
app.include_router(
    idea_router, 
    prefix="/ideas", 
    tags=["💡 Ideas"]
)

app.include_router(
    team_router,
    tags=["👥 Team Management"]
)
# ========================================
# 🎯 Startup Event
# ========================================

@app.on_event("startup")
async def startup_event():
    """
    يُنفذ عند بدء تشغيل الخادم
    """
    print("=" * 60)
    print("🚀 GPRS API Starting...")
    print("=" * 60)
    print("📋 Available at:")
    print("   • API Docs: http://127.0.0.1:8001/docs")
    print("   • ReDoc: http://127.0.0.1:8001/redoc")
    print("   • Health: http://127.0.0.1:8001/health")
    print("=" * 60)
    print("📍 Supervisor Endpoints:")
    print("   • GET    /api/supervisors/")
    print("   • GET    /api/supervisors/profile?email=...")
    print("   • PUT    /api/supervisors/profile")
    print("   • GET    /api/supervisor/ideas?email=...")
    print("   • POST   /api/supervisor/ideas")
    print("   • POST   /api/supervisor/ideas/manage")
    print("=" * 60)
    
    try:
        # اختبار الاتصال بـ MongoDB
        db.command('ping')
        print("✅ MongoDB connected successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
    
    print("=" * 60)

# ========================================
# 🛑 Shutdown Event
# ========================================

@app.on_event("shutdown")
async def shutdown_event():
    """
    يُنفذ عند إيقاف الخادم
    """
    print("\n" + "=" * 60)
    print("🛑 GPRS API Shutting down...")
    print("=" * 60)