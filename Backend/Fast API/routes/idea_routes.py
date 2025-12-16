from fastapi import APIRouter
from config.database_config import db
from models.idea import Idea
from bson import ObjectId

router = APIRouter()
ideas_collection = db["Ideas"]

def fix_id(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/")
def get_ideas():
    ideas = list(ideas_collection.find())
    return [fix_id(i) for i in ideas]

@router.post("/")
def create_idea(idea: Idea):
    result = ideas_collection.insert_one(idea.dict())
    return {"id": str(result.inserted_id), "message": "✅ Idea added successfully"}
