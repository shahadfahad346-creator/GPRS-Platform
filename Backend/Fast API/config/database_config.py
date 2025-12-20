from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# ✅ استخدم MONGODB_URI (موحّد مع .env)
MONGODB_URI = os.getenv("MONGODB_URI")

# ✅ Fallback للـ development
if not MONGODB_URI:
    MONGODB_URI = "mongodb://localhost:27017"
    print("⚠️ Warning: Using local MongoDB (MONGODB_URI not set)")

try:
    client = MongoClient(MONGODB_URI)
    # Test connection
    client.server_info()
    print("✅ MongoDB Connected Successfully")
except Exception as e:
    print(f"❌ MongoDB Connection Failed: {str(e)}")
    raise

db = client["GPRS"]

# Collections
students_collection = db["student"]
projects_collection = db["Graduation Projects BU"]
supervisors_collection = db["Supervisor"]
ideas_collection = db["IdeaAnalysis"]

print(f"📊 Database: {db.name}")
print(f"📁 Collections: {db.list_collection_names()[:5]}")