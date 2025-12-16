import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Mail,
  Check,
  X,
  Users,
  Clock,
  Loader2,
  UserPlus,
  Bell
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

interface TeamInvitation {
  id: string;
  teamName: string;
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  members: GroupMember[];
}

interface TeamInvitationsProps {
  invitations: TeamInvitation[];
  currentUserId: string;
  currentUserEmail: string;
  onInvitationResponse: (invitationId: string, action: 'accepted' | 'declined') => void;
}

const API_BASE_URL = 'http://localhost:3000/api'; // Replace with your actual backend URL

export function TeamInvitations({
  invitations,
  currentUserId,
  currentUserEmail,
  onInvitationResponse
}: TeamInvitationsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAccept = async (invitation: TeamInvitation) => {
    try {
      setLoading(invitation.id);
      console.log('✅ [Invitations] Accepting invitation:', invitation.id);

      const response = await fetch(`${API_BASE_URL}/team/accept-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed (e.g., Authorization: Bearer <token>)
        },
        body: JSON.stringify({
          userId: currentUserId,
          userEmail: currentUserEmail,
          invitationId: invitation.id,
          teamName: invitation.teamName,
          members: invitation.members
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully joined team "${invitation.teamName}"! ✅`);
        onInvitationResponse(invitation.id, 'accepted');
      } else {
        throw new Error(data.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('❌ [Invitations] Error accepting invitation:', error);
      toast.error("Failed to accept invitation. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (invitation: TeamInvitation) => {
    try {
      setLoading(invitation.id);
      console.log('❌ [Invitations] Rejecting invitation:', invitation.id);

      const response = await fetch(`${API_BASE_URL}/team/reject-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed (e.g., Authorization: Bearer <token>)
        },
        body: JSON.stringify({
          userId: currentUserId,
          userEmail: currentUserEmail,
          invitationId: invitation.id,
          teamName: invitation.teamName,
          members: invitation.members
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.info(`Declined invitation to team "${invitation.teamName}" 🔔`);
        onInvitationResponse(invitation.id, 'declined');
      } else {
        throw new Error(data.message || 'Failed to reject invitation');
      }
    } catch (error) {
      console.error('❌ [Invitations] Error rejecting invitation:', error);
      toast.error(" • Failed to reject invitation. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now ';
    if (diffMins < 60) return `${diffMins} min ago  ${diffMins} `;
    if (diffHours < 24) return `${diffHours}h ago   ${diffHours} `;
    if (diffDays === 1) return 'Yesterday  ';
    if (diffDays < 7) return `${diffDays} days ago   ${diffDays} `;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bell className="w-5 h-5 text-emerald-700" />
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">
          Team Invitations
        </h3>
        <Badge className="bg-red-500 text-white">
          {pendingInvitations.length}
        </Badge>
      </div>

      {/* Invitations List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {pendingInvitations.map((invitation, index) => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Info */}
                    <div className="flex-1 space-y-3">
                      {/* Team Name */}
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-700" />
                        <h4 className="font-semibold text-amber-900">
                          {invitation.teamName || 'Unnamed Team'}
                        </h4>
                      </div>

                      {/* Invited By */}
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                        <span>
                           • Invited by:{' '}
                          <span className="font-medium text-emerald-800">
                            {invitation.invitedByName}
                          </span>
                        </span>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-xs">{invitation.invitedBy}</span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(invitation.invitedAt)}</span>
                      </div>

                      {/* Team Members Preview */}
                      <div className="pt-2 border-t border-amber-200">
                        <p className="text-xs text-slate-600 mb-2">
                          • Team members ({invitation.members.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {invitation.members.slice(0, 4).map((member, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="bg-white/60 text-xs"
                            >
                              {member.name}
                              {member.isLeader && ' 👑'}
                            </Badge>
                          ))}
                          {invitation.members.length > 4 && (
                            <Badge variant="secondary" className="bg-white/60 text-xs">
                              +{invitation.members.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() => handleAccept(invitation)}
                          disabled={loading === invitation.id}
                          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg w-full"
                        >
                          {loading === invitation.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              • Accept
                            </>
                          )}
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() => handleReject(invitation)}
                          disabled={loading === invitation.id}
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50 w-full"
                        >
                          {loading === invitation.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                             • Decline
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}