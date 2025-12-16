from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# ✅ استخدم MONGO_URI (بدون D)
MONGODB_URI = os.getenv("MONGO_URI")  # ✅ تغيير من MONGODB_URI إلى MONGO_URI
client = MongoClient(MONGODB_URI)

db = client["GPRS"]

# Collections
students_collection = db["student"]
projects_collection = db["Graduation Projects BU"]
supervisors_collection = db["Supervisor"]
ideas_collection = db["IdeaAnalysis"]