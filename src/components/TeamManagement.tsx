import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Users,
  Plus,
  X,
  Crown,
  Mail,
  Loader2,
  Shield,
  Sparkles,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  isLeader: boolean;
  status?: 'pending' | 'accepted' | 'rejected';
  invitedBy?: string;
  invitedAt?: string;
}

interface TeamManagementProps {
  currentUserEmail: string;
  currentUserId?: string;
  groupName: string;
  groupMembers: GroupMember[];
  onMembersUpdate: (members: GroupMember[]) => void;
  onGroupNameUpdate?: (name: string) => void;
  onViewMember?: (memberId: string) => void;
  readOnly?: boolean;
  showGroupName?: boolean;
  compact?: boolean;
}

// Flask API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

export function TeamManagement({
  currentUserEmail,
  currentUserId,
  groupName,
  groupMembers,
  onMembersUpdate,
  onGroupNameUpdate,
  onViewMember,
  readOnly = false,
  showGroupName = true,
  compact = false
}: TeamManagementProps) {
  const [loading, setLoading] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [localGroupName, setLocalGroupName] = useState(groupName);

  // Check if current user is a team member
  const isTeamMember = groupMembers.some(m => m.email === currentUserEmail);
  const canEdit = !readOnly && (isTeamMember || groupMembers.length === 0);

  const handleAddMember = async () => {
    if (!newMemberEmail) {
      toast.error("Please enter an email address");
      return;
    }

    // Validate Albaha University email
    if (!newMemberEmail.endsWith('@stu.bu.edu.sa')) {
      toast.error("Please use a valid @stu.bu.edu.sa email");
      return;
    }

    // Check if member already exists
    if (groupMembers.some(m => m.email === newMemberEmail)) {
      toast.error("This member is already in the team");
      return;
    }

    // Allow adding self as first member
    const isAddingSelf = newMemberEmail === currentUserEmail;
    if (isAddingSelf && groupMembers.length > 0) {
      toast.error("You are already viewing this profile");
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [TeamManagement] Searching for student:', newMemberEmail);

      // Fetch student from Flask API
      const response = await fetch(`${API_BASE_URL}/team/get-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newMemberEmail })
      });

      const data = await response.json();

      if (!data.success || !data.student) {
        toast.error("Student not found. Please make sure they have registered.");
        setLoading(false);
        return;
      }

      const foundStudent = data.student;

      // STRICT CHECK: Verify student is not in ANY team
      if (foundStudent.groupMembers && foundStudent.groupMembers.length > 0) {
        const targetStudentTeamEmails = foundStudent.groupMembers.map((m: any) => 
          m.email?.toLowerCase().trim()
        );
        
        const currentTeamEmails = groupMembers.map(m => 
          m.email?.toLowerCase().trim()
        );
        
        const hasOverlap = targetStudentTeamEmails.some((email: string) => 
          currentTeamEmails.includes(email)
        );
        
        if (!hasOverlap) {
          const currentTeamName = foundStudent.groupName || 'another team';
          const teamSize = foundStudent.groupMembers.length;
          console.error('❌ [TeamManagement] Student already in different team:', {
            studentEmail: newMemberEmail,
            theirTeam: currentTeamName,
            theirTeamSize: teamSize
          });
          toast.error(
            `⚠️ Cannot add ${foundStudent.name}. They are already a member of team "${currentTeamName}" ` +
            `(${teamSize} ${teamSize === 1 ? 'member' : 'members'}). ` +
            `A student can only be in ONE team at a time.`
          );
          setLoading(false);
          return;
        }
        
        console.log('ℹ️ [TeamManagement] Student already in this team');
      }

      const newMember: GroupMember = {
        id: foundStudent._id || Math.random().toString(36).substr(2, 9),
        name: foundStudent.name || 'Unknown',
        email: foundStudent.email,
        isLeader: groupMembers.length === 0,
        status: 'accepted',
        invitedBy: currentUserEmail,
        invitedAt: new Date().toISOString()
      };

      const updatedMembers = [...groupMembers, newMember];
      
      // Sync with all team members
      try {
        console.log('🔄 [TeamManagement] Syncing new member with team...');
        const syncResponse = await fetch(`${API_BASE_URL}/team/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: currentUserId,
            userEmail: currentUserEmail,
            groupName: localGroupName,
            groupMembers: updatedMembers
          })
        });

        const syncData = await syncResponse.json();
        
        if (syncData.success) {
          console.log('✅ [TeamManagement] Team synced successfully:', syncData.results);
          onMembersUpdate(updatedMembers);
          toast.success(`${foundStudent.name} added and all team members synced!`);
          setNewMemberEmail('');
        } else {
          // If sync failed due to conflict, revert
          if (syncData.conflictingMembers) {
            console.error('❌ [TeamManagement] Team conflict detected');
            toast.error(syncData.error || 'Cannot add member: already in another team');
          } else {
            console.warn('⚠️ [TeamManagement] Sync warning:', syncData.error);
            toast.warning(syncData.error || 'Member added but sync incomplete');
          }
        }
      } catch (syncError) {
        console.error('❌ [TeamManagement] Error syncing team:', syncError);
        toast.success(`${foundStudent.name} added! (Sync pending)`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ [TeamManagement] Error adding member:', error);
      toast.error("Failed to add member. Please try again.");
      setLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    const memberToRemove = groupMembers.find(m => m.id === id);
    if (!memberToRemove) return;

    // Show confirmation when removing yourself
    if (memberToRemove.email === currentUserEmail) {
      const confirmed = window.confirm(
        "⚠️ هل أنت متأكد من مغادرة الفريق؟\n\n" +
        "سيؤدي هذا إلى إزالتك من الفريق وستفقد الوصول إلى بيانات الفريق.\n\n" +
        "اضغط موافق للتأكيد."
      );
      if (!confirmed) return;
    }

    try {
      setLoading(true);
      console.log('🗑️ [TeamManagement] Removing member:', memberToRemove.email);

      const response = await fetch(`${API_BASE_URL}/team/remove-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUserId,
          userEmail: currentUserEmail,
          memberEmailToRemove: memberToRemove.email,
          groupMembers: groupMembers,
          groupName: localGroupName
        })
      });

      const data = await response.json();

      if (data.success) {
        onMembersUpdate(data.updatedMembers);
        
        if (memberToRemove.email === currentUserEmail) {
          toast.success(`لقد غادرت الفريق بنجاح!`);
        } else {
          toast.success(`تمت إزالة ${memberToRemove.name} من الفريق!`);
        }
        
        console.log('✅ [TeamManagement] Member removed and synced:', data.results);
      } else {
        throw new Error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('❌ [TeamManagement] Error removing member:', error);
      
      if (memberToRemove.email === currentUserEmail) {
        toast.error("فشل في مغادرة الفريق. حاول مرة أخرى.");
      } else {
        toast.error("فشل في إزالة العضو. حاول مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetLeader = async (id: string) => {
    const newLeader = groupMembers.find(m => m.id === id);
    if (!newLeader) return;

    try {
      setLoading(true);
      console.log('👑 [TeamManagement] Setting new leader:', newLeader.email);

      const response = await fetch(`${API_BASE_URL}/team/update-leader`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUserId,
          userEmail: currentUserEmail,
          newLeaderId: id,
          groupMembers: groupMembers,
          groupName: localGroupName
        })
      });

      const data = await response.json();

      if (data.success) {
        onMembersUpdate(data.updatedMembers);
        toast.success(`أصبح ${newLeader.name} قائد الفريق الآن! تمت مزامنة جميع الأعضاء.`);
        console.log('✅ [TeamManagement] Leader updated and synced:', data.results);
      } else {
        throw new Error(data.error || 'Failed to update leader');
      }
    } catch (error) {
      console.error('❌ [TeamManagement] Error updating leader:', error);
      toast.error("فشل في تحديث القائد. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupNameChange = (newName: string) => {
    setLocalGroupName(newName);
    if (onGroupNameUpdate) {
      onGroupNameUpdate(newName);
    }
  };

  return (
    <div className={`space-y-4 ${compact ? 'text-sm' : ''}`}>
      {/* Group Name */}
      {showGroupName && (
        <div className="space-y-2">
          <label className="text-sm text-slate-600 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-700" />
            Team Name
          </label>
          <Input
            value={localGroupName}
            onChange={(e) => handleGroupNameChange(e.target.value)}
            placeholder="Enter Team Name"
            disabled={!canEdit}
            className={`border-2 ${canEdit ? 'border-emerald-900/20 focus:border-emerald-700 bg-white hover:border-emerald-600' : 'border-slate-200 bg-slate-50 cursor-not-allowed'} transition-all`}
          />
        </div>
      )}

      {/* Team Members Section */}
      <div className="space-y-3">
        <label className="text-sm text-slate-600 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-700" />
          <span>Team Members</span>
          {groupMembers.length > 0 && (
            <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-800 text-xs">
              {groupMembers.length} {groupMembers.length === 1 ? 'Member' : 'Members'}
            </Badge>
          )}
        </label>
        
        {/* Add new member */}
        {canEdit && (
          <>
            {groupMembers.length === 0 && currentUserEmail && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 space-y-3"
              >
                <Button
                  type="button"
                  onClick={() => {
                    setNewMemberEmail(currentUserEmail);
                    setTimeout(() => handleAddMember(), 100);
                  }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg"
                >
                  <Users className="w-4 h-4 mr-2" />
                  ابدأ فريقك - أضف نفسك كقائد
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-emerald-900/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-slate-500">أو أضف عضوًا آخر</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="flex gap-2">
              <Input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder={groupMembers.length === 0 ? "أضف نفسك أولاً: your-email@stu.bu.edu.sa" : "student@stu.bu.edu.sa"}
                disabled={loading || !canEdit}
                className="border-2 border-emerald-900/20 focus:border-emerald-700 bg-white hover:border-emerald-600 transition-all"
              />
              <Button
                type="button"
                onClick={handleAddMember}
                disabled={loading || !canEdit}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shrink-0"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              ابدأ بإضافة نفسك أو زملائك في الفريق
            </p>
          </>
        )}
        
        {/* Display team members */}
        <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-lg border border-emerald-900/20 min-h-[80px]">
          {groupMembers.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {groupMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ delay: i * 0.05, type: "spring" }}
                  whileHover={{ scale: canEdit ? 1.05 : 1 }}
                  className="relative"
                >
                  <Badge 
                    className={`${
                      member.isLeader 
                        ? 'bg-gradient-to-r from-teal-700 to-cyan-700' 
                        : member.email === currentUserEmail
                        ? 'bg-gradient-to-r from-slate-700 to-slate-800'
                        : 'bg-gradient-to-r from-emerald-700 to-emerald-800'
                    } text-white shadow-md px-3 py-2 flex items-center gap-2 ${canEdit ? 'cursor-pointer hover:shadow-lg pr-8' : ''} transition-all border border-white/10`}
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs backdrop-blur-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{member.name}</span>
                      {member.isLeader && <Crown className="w-3.5 h-3.5 text-amber-300" />}
                      {member.email === currentUserEmail && (
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">أنت</span>
                      )}
                    </div>
                    
                    {canEdit && (
                      <div className="absolute -top-2 -right-2 flex gap-1">
                        {!member.isLeader && (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetLeader(member.id);
                            }}
                            disabled={loading}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 flex items-center justify-center shadow-lg transition-colors border-2 border-white"
                            title="تعيين كقائد للفريق"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-300" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: member.email === currentUserEmail ? 0 : 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMember(member.id);
                          }}
                          disabled={loading}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 flex items-center justify-center shadow-lg transition-colors border-2 border-white"
                          title={member.email === currentUserEmail ? "مغادرة الفريق" : "إزالة من الفريق"}
                        >
                          {member.email === currentUserEmail ? (
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-white" />
                          )}
                        </motion.button>
                      </div>
                    )}
                  </Badge>
                  
                  {!canEdit && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg"
                    >
                      {member.email} {member.isLeader && '(قائد)'}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center justify-center py-6 text-center"
            >
              <Users className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-400 text-sm mb-1">
                {canEdit ? 'لا يوجد أعضاء في الفريق بعد' : 'لا يوجد أعضاء في هذا الفريق'}
              </p>
              {canEdit && (
                <p className="text-xs text-slate-500">
                  ابدأ بإضافة نفسك أو زملائك في الفريق
                </p>
              )}
            </motion.div>
          )}
        </div>
        
        {/* Team member emails list */}
        {groupMembers.length > 0 && (
          <div className="mt-2 p-3 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-lg border border-emerald-900/20">
            <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-700" />
              Team Members’ Emails:
            </p>
            <div className="space-y-1">
              {groupMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2 text-xs text-slate-700">
                  <div className={`w-2 h-2 rounded-full ${
                    member.isLeader 
                      ? 'bg-teal-600' 
                      : member.email === currentUserEmail 
                      ? 'bg-slate-600' 
                      : 'bg-emerald-600'
                  }`} />
                  <a 
                    href={`mailto:${member.email}`}
                    className={`hover:underline hover:text-cyan-700 transition-colors ${member.isLeader ? 'font-medium' : ''}`}
                  >
                    {member.email}
                  </a>
                  {member.isLeader && <span className="text-teal-700">(قائد)</span>}
                  {member.email === currentUserEmail && <span className="text-slate-700">(أنت)</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info message for non-team members */}
      {!canEdit && !readOnly && groupMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-slate-300 rounded-lg text-sm text-slate-800 flex items-start gap-2"
        >
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-600" />
          <p>أنت تشاهد ملف فريق آخر. يمكن لTeam Members فقط إدارة هذا الفريق.</p>
        </motion.div>
      )}
    </div>
  );
}