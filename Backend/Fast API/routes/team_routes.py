from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from config.database_config import db
from routes.auth_routes import get_current_user

# ========================================
# 🔧 Router Configuration
# ========================================

router = APIRouter(prefix="/api/team", tags=["👥 Team Management"])

# ========================================
# 📋 Pydantic Models
# ========================================

class GroupMember(BaseModel):
    id: str
    name: str
    email: EmailStr
    isLeader: bool
    status: Optional[str] = "accepted"  # pending, accepted, rejected
    invitedBy: Optional[str] = None
    invitedAt: Optional[str] = None

class TeamSyncRequest(BaseModel):
    userId: str
    userEmail: EmailStr
    groupName: str
    groupMembers: List[GroupMember]

class RemoveMemberRequest(BaseModel):
    userId: str
    userEmail: EmailStr
    memberEmailToRemove: EmailStr
    groupMembers: List[GroupMember]
    groupName: str

class UpdateLeaderRequest(BaseModel):
    userId: str
    userEmail: EmailStr
    newLeaderId: str
    groupMembers: List[GroupMember]
    groupName: str

class InvitationRequest(BaseModel):
    userId: str
    userEmail: EmailStr
    invitationId: str
    teamName: str
    members: List[GroupMember]

# ========================================
# 🛠️ Helper Functions
# ========================================

def fix_id(doc):
    """تحويل ObjectId إلى string"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def get_student_collection():
    """الحصول على collection الطلاب"""
    return db["student"]

# ========================================
# 📍 Team Endpoints
# ========================================

@router.post("/sync")
async def sync_team(
    request: TeamSyncRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    مزامنة بيانات الفريق لجميع الأعضاء
    يتم تحديث groupName و groupMembers لجميع أعضاء الفريق
    """
    try:
        students_collection = get_student_collection()
        
        # ✅ التحقق من أن الطالب موجود
        current_student = students_collection.find_one({"email": request.userEmail})
        if not current_student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # ✅ التحقق من عدم وجود تعارضات (أعضاء في فِرَق أخرى)
        member_emails = [m.email for m in request.groupMembers]
        
        # البحث عن طلاب في فِرَق أخرى
        conflicting_students = list(students_collection.find({
            "email": {"$in": member_emails},
            "groupMembers": {"$exists": True, "$ne": []},
            "groupMembers.email": {"$nin": member_emails}  # في فريق مختلف
        }))
        
        if conflicting_students:
            conflicting_names = [s.get("full_name", s.get("email")) for s in conflicting_students]
            return {
                "success": False,
                "message": f"Cannot sync: Some members are already in other teams",
                "conflictingMembers": conflicting_names
            }
        
        # ✅ تحديث جميع أعضاء الفريق
        results = []
        group_members_dict = [m.dict() for m in request.groupMembers]
        
        for member in request.groupMembers:
            update_result = students_collection.update_one(
                {"email": member.email},
                {
                    "$set": {
                        "groupName": request.groupName,
                        "groupMembers": group_members_dict,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            results.append({
                "email": member.email,
                "updated": update_result.modified_count > 0
            })
        
        print(f"✅ [Team Sync] Updated {len(results)} members for team '{request.groupName}'")
        
        return {
            "success": True,
            "message": "Team synced successfully",
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Team Sync] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync team: {str(e)}"
        )


@router.post("/remove-member")
async def remove_member(
    request: RemoveMemberRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    إزالة عضو من الفريق
    يتم تحديث جميع أعضاء الفريق المتبقين
    """
    try:
        students_collection = get_student_collection()
        
        # ✅ التحقق من أن الطالب الحالي عضو في الفريق
        current_student = students_collection.find_one({"email": request.userEmail})
        if not current_student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # ✅ إزالة العضو من القائمة
        updated_members = [
            m for m in request.groupMembers 
            if m.email != request.memberEmailToRemove
        ]
        
        # ✅ إذا كان العضو المحذوف هو القائد، نعين قائد جديد
        removed_member = next(
            (m for m in request.groupMembers if m.email == request.memberEmailToRemove), 
            None
        )
        
        if removed_member and removed_member.isLeader and updated_members:
            # نعين أول عضو متبقي كقائد
            updated_members[0].isLeader = True
        
        # ✅ تحديث جميع الأعضاء المتبقين
        results = []
        updated_members_dict = [m.dict() for m in updated_members]
        
        for member in updated_members:
            update_result = students_collection.update_one(
                {"email": member.email},
                {
                    "$set": {
                        "groupName": request.groupName,
                        "groupMembers": updated_members_dict,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            results.append({
                "email": member.email,
                "updated": update_result.modified_count > 0
            })
        
        # ✅ حذف بيانات الفريق من العضو المحذوف
        students_collection.update_one(
            {"email": request.memberEmailToRemove},
            {
                "$set": {
                    "groupName": "",
                    "groupMembers": [],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ [Remove Member] Removed {request.memberEmailToRemove} from team '{request.groupName}'")
        
        return {
            "success": True,
            "message": "Member removed successfully",
            "updatedMembers": updated_members,
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Remove Member] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove member: {str(e)}"
        )


@router.post("/update-leader")
async def update_leader(
    request: UpdateLeaderRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    تحديث قائد الفريق
    يتم تحديث جميع أعضاء الفريق
    """
    try:
        students_collection = get_student_collection()
        
        # ✅ التحقق من أن الطالب الحالي عضو في الفريق
        current_student = students_collection.find_one({"email": request.userEmail})
        if not current_student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # ✅ تحديث القائد
        updated_members = []
        for member in request.groupMembers:
            member.isLeader = (member.id == request.newLeaderId)
            updated_members.append(member)
        
        # ✅ تحديث جميع أعضاء الفريق
        results = []
        updated_members_dict = [m.dict() for m in updated_members]
        
        for member in updated_members:
            update_result = students_collection.update_one(
                {"email": member.email},
                {
                    "$set": {
                        "groupName": request.groupName,
                        "groupMembers": updated_members_dict,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            results.append({
                "email": member.email,
                "updated": update_result.modified_count > 0
            })
        
        new_leader = next((m for m in updated_members if m.id == request.newLeaderId), None)
        print(f"✅ [Update Leader] New leader: {new_leader.email if new_leader else 'Unknown'}")
        
        return {
            "success": True,
            "message": "Leader updated successfully",
            "updatedMembers": updated_members,
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Update Leader] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update leader: {str(e)}"
        )


@router.post("/accept-invitation")
async def accept_invitation(
    request: InvitationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    قبول دعوة للانضمام إلى فريق
    """
    try:
        students_collection = get_student_collection()
        
        # ✅ التحقق من أن الطالب موجود
        student = students_collection.find_one({"email": request.userEmail})
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # ✅ التحقق من الحد الأقصى لعدد الأعضاء (5)
        accepted_members = [m for m in request.members if m.status == "accepted"]
        if len(accepted_members) >= 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team is full (maximum 5 members)"
            )
        
        # ✅ تحديث حالة الدعوة إلى "accepted"
        updated_members = []
        for member in request.members:
            if member.email == request.userEmail:
                member.status = "accepted"
            updated_members.append(member)
        
        # ✅ مزامنة الفريق
        updated_members_dict = [m.dict() for m in updated_members]
        
        results = []
        for member in updated_members:
            if member.status == "accepted":
                update_result = students_collection.update_one(
                    {"email": member.email},
                    {
                        "$set": {
                            "groupName": request.teamName,
                            "groupMembers": updated_members_dict,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                results.append({
                    "email": member.email,
                    "updated": update_result.modified_count > 0
                })
        
        print(f"✅ [Accept Invitation] {request.userEmail} joined team '{request.teamName}'")
        
        return {
            "success": True,
            "message": "Invitation accepted successfully",
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Accept Invitation] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept invitation: {str(e)}"
        )


@router.post("/reject-invitation")
async def reject_invitation(
    request: InvitationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    رفض دعوة للانضمام إلى فريق
    """
    try:
        students_collection = get_student_collection()
        
        # ✅ التحقق من أن الطالب موجود
        student = students_collection.find_one({"email": request.userEmail})
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # ✅ إزالة العضو من القائمة
        updated_members = [
            m for m in request.members 
            if m.email != request.userEmail
        ]
        
        # ✅ تحديث الفريق (بدون العضو الرافض)
        updated_members_dict = [m.dict() for m in updated_members]
        
        results = []
        for member in updated_members:
            if member.status == "accepted":
                update_result = students_collection.update_one(
                    {"email": member.email},
                    {
                        "$set": {
                            "groupName": request.teamName,
                            "groupMembers": updated_members_dict,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                results.append({
                    "email": member.email,
                    "updated": update_result.modified_count > 0
                })
        
        print(f"✅ [Reject Invitation] {request.userEmail} rejected team '{request.teamName}'")
        
        return {
            "success": True,
            "message": "Invitation rejected successfully",
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Reject Invitation] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject invitation: {str(e)}"
        )


@router.get("/member/{email}")
async def get_team_member(
    email: str,
    current_user: dict = Depends(get_current_user)
):
    """
    الحصول على بيانات عضو في الفريق
    """
    try:
        students_collection = get_student_collection()
        
        student = students_collection.find_one({"email": email})
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        return fix_id(student)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Get Team Member] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get team member: {str(e)}"
        )