import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { IdeaDetailModal } from "./IdeaDetailModal";
import { useAuth } from "../../Frontend/lib/auth-context";
import { ChevronDown, ChevronUp, EyeOff } from 'lucide-react';
import {
  ArrowLeft,
  User,
  Code,
  Save,
  Edit2,
  GraduationCap,
  Users,
  Plus,
  X,
  Sparkles,
  Award,
  Target,
  Zap,
  Briefcase,
  Mail,
  TrendingUp,
  Star,
  CheckCircle,
  Heart,
  Coffee,
  Lightbulb,
  FileText,
  Download,
  Eye,
  Calendar,
  BarChart,
  Loader2,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { InteractiveBackground } from "./Backgrounds";
import { TeamManagement } from "./TeamManagement";
import { TeamInvitations } from "./TeamInvitations";
import axios from 'axios';

interface MyProfileProps {
  onBack: () => void;
  onViewMember?: (memberId: string) => void;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  isLeader: boolean;
  status?: "pending" | "accepted" | "rejected";
  invitedBy?: string;
  invitedAt?: string;
}

interface TeamInvitation {
  id: string;
  teamName: string;
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  status: "pending" | "accepted" | "rejected";
  members: GroupMember[];
}

interface User {
  agreed_idea_id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  specialization?: string;
  skills?: string[];
  frameworks?: string[];
  groupName?: string;
  groupMembers?: GroupMember[];
  teamInvitations?: TeamInvitation[];
  savedIdeas?: any[];
}

interface ApiResponse {
  success?: boolean;
  error?: string;
}

interface AxiosErrorResponse {
  response?: {
    data?: ApiResponse;
    status?: number;
  };
}

// Helper function to ensure array from old string data
const ensureArray = (value: any): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

// Floating particle component
const FloatingParticle = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute w-2 h-2 bg-emerald-400/30 rounded-full"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }}
    animate={{
      y: [0, -30, 0],
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut",
    }}
  />
);

export function MyProfile({ onBack, onViewMember }: MyProfileProps) {
  const { user: authUser, updateUser, refreshUserData } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showIdeas, setShowIdeas] = useState(true);
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newFramework, setNewFramework] = useState("");
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<any[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [showIdeaDetail, setShowIdeaDetail] = useState(false);
  const [agreeLoading, setAgreeLoading] = useState(false); // ✅ loading خاص بالاتفاق
const [removeAgreementLoading, setRemoveAgreementLoading] = useState(false); // ✅ loading خاص بالإلغاء
const [toggleVisibilityLoading, setToggleVisibilityLoading] = useState<string | null>(null); // ✅ idea id
// قبل الاتفاق، احفظ حالة visible للفكرة

  // Fetch user data on mount
  console.log("🎨 [Render] savedIdeas count:", savedIdeas.length);
console.log("🎨 [Render] user?.savedIdeas count:", user?.savedIdeas?.length || 0);
console.log("🎨 [Render] loading:", loading); 
useEffect(() => {
  const fetchUserData = async () => {
    if (!authUser?._id || !authUser?.email) {
      console.log("❌ No authenticated user");
      toast.error("No authenticated user");
      return;
    }

    try {
      console.log("🔄 Fetching user data for:", authUser.email);
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/profile/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authUser.token || ""}`,
        },
        body: JSON.stringify({
          userId: authUser._id,
          email: authUser.email,
        }),
      });

      const data = await response.json();
      console.log("📥 [FetchUserData] Full response:", data); // ← تأكد من استلام البيانات

      if (response.ok && data.success && data.user) {
        const agreedIdeaId = data.user.agreed_idea_id;
        console.log("🎯 [FetchUserData] agreed_idea_id:", agreedIdeaId);
        
        // ✅ تأكد من أن savedIdeas موجودة
        const rawSavedIdeas = data.user.savedIdeas || [];
        console.log("📚 [FetchUserData] Raw savedIdeas count:", rawSavedIdeas.length);
        console.log("📚 [FetchUserData] Raw savedIdeas:", rawSavedIdeas);

        // ✅ حساب is_agreed بناءً على agreed_idea_id
        const updatedSavedIdeas = rawSavedIdeas.map((idea: any) => {
          const ideaId = idea._id || idea.id;
          const isAgreed = agreedIdeaId && (ideaId === agreedIdeaId);
          console.log(`  💡 Idea: ${idea.title || ideaId}, is_agreed: ${isAgreed}`);
          return {
            ...idea,
            is_agreed: isAgreed
          };
        });

        console.log("✅ [FetchUserData] Updated savedIdeas count:", updatedSavedIdeas.length);

        const userData = {
          _id: data.user._id,
          name: data.user.name || "",
          email: data.user.email || "",
          role: data.user.role || "student",
          specialization: data.user.specialization || "",
          skills: ensureArray(data.user.skills),
          frameworks: ensureArray(data.user.frameworks),
          groupName: data.user.groupName || "",
          groupMembers: data.user.groupMembers || [],
          teamInvitations: data.user.teamInvitations || [],
          savedIdeas: updatedSavedIdeas, // ✅ استخدم القائمة المحدثة
          agreed_idea_id: agreedIdeaId,
        };

        console.log("💾 [FetchUserData] Setting user state with savedIdeas count:", userData.savedIdeas.length);
        setUser(userData);
        
        // ✅ تأكد من تحديث savedIdeas في state
        setSavedIdeas(updatedSavedIdeas);
        console.log("✅ [FetchUserData] setSavedIdeas called with:", updatedSavedIdeas.length, "ideas");
        
      } else {
        throw new Error(data.error || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  fetchUserData();
}, [authUser]);
  // Update state when user data changes
useEffect(() => {
  if (user) {
    console.log("🔄 [UpdateFromUser] Updating states from user object");
    console.log("📊 [UpdateFromUser] user.savedIdeas:", user.savedIdeas); // ← طباعة كاملة
    
    setName(user.name || "");
    setSpecialization(user.specialization || "");
    setSkills(ensureArray(user.skills));
    setFrameworks(ensureArray(user.frameworks));
    setGroupName(user.groupName || "");
    setGroupMembers(user.groupMembers || []);
    setTeamInvitations(user.teamInvitations || []);
    
    // ✅ تأكد من تحديث savedIdeas - استخدم طريقة مختلفة
    const ideas = user.savedIdeas || [];
    console.log("💡 [UpdateFromUser] Ideas to set:", ideas);
    console.log("💡 [UpdateFromUser] Ideas count:", ideas.length);
    console.log("💡 [UpdateFromUser] Ideas type:", typeof ideas, Array.isArray(ideas));
    
    // ✅ استخدم setTimeout لإجبار التحديث بعد render
    setTimeout(() => {
      setSavedIdeas([...ideas]); // ← استخدم spread لإنشاء array جديدة
      console.log("✅ [UpdateFromUser] setSavedIdeas executed with", ideas.length, "ideas");
    }, 0);
  }
}, [user]);

// ✅ وأيضاً أضف useEffect إضافي للتأكد
useEffect(() => {
  console.log("🔍 [SavedIdeas State Changed] Current count:", savedIdeas.length);
  if (savedIdeas.length > 0) {
    console.log("📝 [SavedIdeas] First idea:", savedIdeas[0]?.title || savedIdeas[0]?._id);
  }
}, [savedIdeas]); 
// قبل الاتفاق، احفظ حالة visible للفكرة


const handleAgreeOnIdea = async (idea: any) => {
  const ideaId = idea._id || idea.id;
  if (!user?._id || !user.groupMembers?.length) {
    toast.error("You must be in a group");
    return;
  }

  const ideaBeforeAgree = savedIdeas.find(i => i._id === ideaId || i.id === ideaId);
  const previousVisibility = ideaBeforeAgree?.visible ?? true;

  setAgreeLoading(true);
  try {
    const res = await fetch('http://localhost:5000/api/group/agree-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id, ideaId })
    });

    const data = await res.json();
    if (data.success) {
      const updatedIdeas = savedIdeas.map(i => {
        const isThisIdea = (i._id === ideaId || i.id === ideaId);
        return {
          ...i,
          is_agreed: isThisIdea,
          visible: isThisIdea ? true : i.visible,
          _previous_visible: isThisIdea ? previousVisibility : i._previous_visible
        };
      });

      setSavedIdeas(updatedIdeas);
      setUser(prev => ({ ...prev!, savedIdeas: updatedIdeas, agreed_idea_id: ideaId }));
      updateUser({ savedIdeas: updatedIdeas, agreed_idea_id: ideaId });
      toast.success('Team agreed!');
      setTimeout(() => refreshUserData(), 500);
    } else {
      toast.error(data.error);
    }
  } catch (err) {
    toast.error('Failed');
  } finally {
    setAgreeLoading(false);
  }
};

// 2️⃣ دالة إلغاء الاتفاق (اختيارية)
const handleRemoveAgreement = async () => {
  if (!user?._id || !user.groupMembers?.length) {
    toast.error("You must be in a group");
    return;
  }

  const agreedIdeaId = user.agreed_idea_id; // استخدم هذا بدل ideaId
  if (!agreedIdeaId) {
    toast.error("No agreed idea found");
    return;
  }

  setRemoveAgreementLoading(true);
  try {
    const res = await fetch('http://localhost:5000/api/group/remove-agreement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id })
    });

    const data = await res.json();
    if (data.success) {
      const updatedIdeas = savedIdeas.map(i => {
        const wasAgreed = (i._id === agreedIdeaId || i.id === agreedIdeaId);
        return {
          ...i,
          is_agreed: false,
          visible: wasAgreed ? (i._previous_visible ?? i.visible ?? true) : i.visible,
          _previous_visible: undefined
        };
      });

      setSavedIdeas(updatedIdeas);
      setUser(prev => ({
        ...prev!,
        savedIdeas: updatedIdeas,
        agreed_idea_id: undefined
      }));
      updateUser({ savedIdeas: updatedIdeas, agreed_idea_id: undefined });
      toast.success('Agreement removed successfully');
      setTimeout(() => refreshUserData(), 500);
    } else {
      toast.error(data.error || 'Failed to remove agreement');
    }
  } catch (err) {
    console.error("Error removing agreement:", err);
    toast.error('Connection error');
  } finally {
    setRemoveAgreementLoading(false);
  }
};
// أضف هذا داخل MyProfile
useEffect(() => {
  const interval = setInterval(() => {
    if (user?.groupMembers?.length) {
      refreshUserData();
      console.log("Auto-refreshing user data...");
    }
  }, 5000); // كل 5 ثوانٍ

  return () => clearInterval(interval);
}, [user, refreshUserData]);

  // Team sync: Check for updates every 30 seconds
  useEffect(() => {
    if (!user || !authUser) return;

    let isActive = true;

    const checkForTeamUpdates = async () => {
      if (!isActive) return;

      try {
        setIsSyncing(true);

        const response = await fetch("http://localhost:5000/api/profile/get", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authUser?.token || ""}`,
          },
          body: JSON.stringify({ email: user.email }),
        });

        if (!isActive) return;

        const data = await response.json();

        if (response.ok && data.success && data.user) {
          setLastSyncTime(new Date());

          const currentMembers = user.groupMembers || [];
          const latestMembers = data.user.groupMembers || [];
          const currentInvitations = user.teamInvitations || [];
          const latestInvitations = data.user.teamInvitations || [];

          const hasChanges =
            JSON.stringify(currentMembers) !== JSON.stringify(latestMembers) ||
            (user.groupName || '') !== (data.user.groupName || '') ||
            JSON.stringify(currentInvitations) !== JSON.stringify(latestInvitations);

          if (hasChanges && isActive) {
            console.log("🔄 [MyProfile] Team updates detected, syncing...");

            // Update local state
            setGroupMembers(latestMembers);
            setGroupName(data.user.groupName || "");
            setTeamInvitations(latestInvitations);

            // Update user state
            setUser((prev) => ({
              ...prev!,
              groupMembers: latestMembers,
              groupName: data.user.groupName,
              teamInvitations: latestInvitations,
            }));

            // Show detailed notifications - تحسين الفلترة
            const addedMembers = latestMembers.filter(
              (m: GroupMember) => !currentMembers.some((cm: GroupMember) => cm.email === m.email)
            );
            const removedMembers = currentMembers.filter(
              (m: GroupMember) => !latestMembers.some((lm: GroupMember) => lm.email === m.email)
            );
            const currentLeader = currentMembers.find((m: GroupMember) => m.isLeader);
            const newLeader = latestMembers.find((m: GroupMember) => m.isLeader);
            const leaderChanged = currentLeader?.email !== newLeader?.email && newLeader;
            const oldGroupName = user.groupName || '';
            const newGroupName = data.user.groupName || '';
            const groupNameChanged = oldGroupName !== newGroupName && newGroupName !== '';
            const newInvitations = latestInvitations.filter(
              (inv: TeamInvitation) => !currentInvitations.some((ci: TeamInvitation) => ci.id === inv.id)
            );

            // Notifications priority - عرض الإشعارات فقط عند وجود تغييرات حقيقية
            if (newInvitations.length > 0) {
              toast.info(`You have ${newInvitations.length} new team invitation(s)! 📬`, {
                duration: 5000,
              });
            } else if (addedMembers.length > 0) {
              toast.info(`${addedMembers.map((m: { name: any; }) => m.name).join(", ")} joined the team! ✨`);
            } else if (removedMembers.length > 0) {
              toast.info(`${removedMembers.map((m) => m.name).join(", ")} left the team! 👋`);
            } else if (leaderChanged && newLeader) {
              toast.info(`${newLeader.name} is now the team leader! 👑`);
            } else if (groupNameChanged) {
              toast.info(`📝 Team name updated: "${newGroupName}"`);
            }
            // ✅ إزالة الإشعار الافتراضي لتقليل الإشعارات المزعجة
          }
        }
      } catch (error) {
        if (isActive) {
          console.error("❌ [MyProfile] Error checking team updates:", error);
        }
      } finally {
        if (isActive) {
          setIsSyncing(false);
        }
      }
    };

    const initialTimeout = setTimeout(checkForTeamUpdates, 3000);
    const interval = setInterval(checkForTeamUpdates, 30000); // ✅ 30 ثانية بدلاً من 10

    return () => {
      isActive = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user?.email, authUser]);

  const calculateCompletion = () => {
    let completed = 0;
    let total = 5;
    if (name) completed++;
    if (specialization) completed++;
    if (skills.length > 0) completed++;
    if (frameworks.length > 0) completed++;
    if (groupName) completed++;
    return Math.round((completed / total) * 100);
  };

  const profileCompletion = calculateCompletion();

  const handleExportIdeas = () => {
    const formattedIdeas = savedIdeas.map((idea) => ({
      id: idea.id || '',
      title: idea.title || 'Untitled Project',
      description: idea.description || 'No description provided',
      keywords: Array.isArray(idea.keywords) ? idea.keywords : [],
      status: idea.status || 'Analyzed',
      score: idea.score || 0,
      date: idea.date || new Date().toISOString(),
      stage_1_initial_analysis: {
        Project_Title: idea.stage_1_initial_analysis?.Project_Title || idea.title || 'Untitled Project',
        Executive_Summary: idea.stage_1_initial_analysis?.Executive_Summary || 'No summary provided',
        Domain: {
          General_Domain: idea.stage_1_initial_analysis?.Domain?.General_Domain || 'General',
          Technical_Domain: idea.stage_1_initial_analysis?.Domain?.Technical_Domain || 'Technical',
        },
        Required_Skills: {
          Skills: Array.isArray(idea.stage_1_initial_analysis?.Required_Skills?.Skills)
            ? idea.stage_1_initial_analysis.Required_Skills.Skills
            : [],
          Matches: Array.isArray(idea.stage_1_initial_analysis?.Required_Skills?.Matches)
            ? idea.stage_1_initial_analysis.Required_Skills.Matches
            : [],
          Gaps: Array.isArray(idea.stage_1_initial_analysis?.Required_Skills?.Gaps)
            ? idea.stage_1_initial_analysis.Required_Skills.Gaps
            : [],
        },
        SWOT_Analysis: {
          Strengths: Array.isArray(idea.stage_1_initial_analysis?.SWOT_Analysis?.Strengths)
            ? idea.stage_1_initial_analysis.SWOT_Analysis.Strengths
            : [],
          Weaknesses: Array.isArray(idea.stage_1_initial_analysis?.SWOT_Analysis?.Weaknesses)
            ? idea.stage_1_initial_analysis.SWOT_Analysis.Weaknesses
            : [],
          Opportunities: Array.isArray(idea.stage_1_initial_analysis?.SWOT_Analysis?.Opportunities)
            ? idea.stage_1_initial_analysis.SWOT_Analysis.Opportunities
            : [],
          Threats: Array.isArray(idea.stage_1_initial_analysis?.SWOT_Analysis?.Threats)
            ? idea.stage_1_initial_analysis.SWOT_Analysis.Threats
            : [],
        },
        Target_Audience: {
          Primary: Array.isArray(idea.stage_1_initial_analysis?.Target_Audience?.Primary)
            ? idea.stage_1_initial_analysis.Target_Audience.Primary
            : [],
          Secondary: Array.isArray(idea.stage_1_initial_analysis?.Target_Audience?.Secondary)
            ? idea.stage_1_initial_analysis.Target_Audience.Secondary
            : [],
        },
      },
      stage_2_extended_analysis: {
        Supervisors: Array.isArray(idea.stage_2_extended_analysis?.Supervisors)
          ? idea.stage_2_extended_analysis.Supervisors
          : [],
        Similar_Projects: Array.isArray(idea.stage_2_extended_analysis?.Similar_Projects)
          ? idea.stage_2_extended_analysis.Similar_Projects
          : [],
        Improvements: Array.isArray(idea.stage_2_extended_analysis?.Improvements)
          ? idea.stage_2_extended_analysis.Improvements
          : [],
        Final_Proposal: {
          Summary: idea.stage_2_extended_analysis?.Final_Proposal?.Summary || 'No proposal summary',
        },
      },
      similar_projects: Array.isArray(idea.similar_projects) ? idea.similar_projects : [],
      recommendedSupervisors: Array.isArray(idea.recommendedSupervisors) ? idea.recommendedSupervisors : [],
    }));

    const dataStr = JSON.stringify(formattedIdeas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saved-ideas-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Ideas exported successfully!');
  };
const getIdeaId = (idea: any): string | null => {
  return (
    idea?._id ||
    idea?.id ||
    idea?.stage_1_initial_analysis?._id ||
    idea?.stage_1_initial_analysis?.id ||
    null
  );
};
const handleToggleVisibility = async (idea: any) => {
  const ideaId = getIdeaId(idea);

  if (!ideaId) {
    toast.error("لا يمكن تحديد معرف الفكرة");
    return;
  }

  if (!user?._id || !user?.email) return;

  setToggleVisibilityLoading(ideaId);

  try {
    const res = await fetch(
      'http://localhost:5000/api/profile/update-idea-visibility',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          email: user.email,
          ideaId,
          visible: !idea.visible,
        }),
      }
    );

    const data = await res.json();

    if (!data.success) {
      toast.error(data.error || 'فشل في تحديث الرؤية');
      return;
    }

    const updatedIdeas = savedIdeas.map(i => {
      const iid = getIdeaId(i);
      return iid === ideaId ? { ...i, visible: !i.visible } : i;
    });

    setSavedIdeas(updatedIdeas);
    setUser(prev => prev ? { ...prev, savedIdeas: updatedIdeas } : prev);

    toast.success(!idea.visible ? 'أصبحت الفكرة مرئية' : 'أصبحت الفكرة مخفية');

  } catch (err) {
    console.error("[ToggleVisibility]", err);
    toast.error('فشل الاتصال بالخادم');
  } finally {
    setToggleVisibilityLoading(null);
  }
};
const handleDeleteIdea = async (idea: any) => {
  const ideaId = getIdeaId(idea);

  if (!ideaId) {
    toast.error("لا يمكن تحديد معرف الفكرة");
    return;
  }

  if (!user?._id) return;

  if (!confirm("هل أنت متأكد من حذف الفكرة نهائيًا؟")) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/students/profile/ideas/${ideaId}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      }
    );

    const data = await res.json();

    if (!data.success) {
      toast.error(data.error || 'فشل في الحذف');
      return;
    }

    const updatedIdeas = savedIdeas.filter(i => getIdeaId(i) !== ideaId);

    setSavedIdeas(updatedIdeas);
    toast.success("تم حذف الفكرة بنجاح");

  } catch (err) {
    console.error("[DeleteIdea]", err);
    toast.error("فشل الاتصال بالخادم");
  }
};


const handleSave = async () => {
  if (!authUser?._id) {
    toast.error("No authenticated user");
    return;
  }

  setLoading(true);

  try {
   

    const profileData = {
      userId: authUser._id,
      email: authUser.email,
      name,
      specialization,
      skills, // ✅ يجب أن تكون مصفوفة
      frameworks,
      groupName,
      groupMembers,
      savedIdeas,
    };

    // 🔍 طباعة البيانات الكاملة
    console.log("💾 [MyProfile] Full Profile Data:", JSON.stringify(profileData, null, 2));

    const response = await fetch("http://localhost:5000/api/profile/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authUser.token || ""}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // 🔍 طباعة البيانات المُرجعة من الخادم
      console.log("✅ [MyProfile] Server Response:", data.user);
      console.log("✅ [MyProfile] Server returned skills:", data.user.skills);

      setUser((prev) => ({ ...prev!, ...data.user }));
      updateUser(data.user);
      setLoading(false);
      setIsEditing(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      toast.success("Profile updated successfully!");
      setActiveTab("personal");
    } else {
      throw new Error(data.error || "Failed to update profile");
    }
  } catch (error) {
    console.error("❌ [MyProfile] Error updating profile:", error);
    toast.error("Failed to update profile");
    setLoading(false);
  }
};

// في دالة handleAddSkill:
const handleAddSkill = () => {
  const trimmedSkill = newSkill.trim();
  if (trimmedSkill && !skills.includes(trimmedSkill)) {
    const updatedSkills = [...skills, trimmedSkill];
    setSkills(updatedSkills);
    setNewSkill("");
    
    // 🔍 طباعة للتحقق
    console.log("➕ [MyProfile] Skill added:", trimmedSkill);
    console.log("➕ [MyProfile] Current skills:", updatedSkills);
    
    toast.success(`"${trimmedSkill}" added! Don't forget to Save Changes.`, {
      duration: 3000,
    });
  } else if (skills.includes(trimmedSkill)) {
    toast.info(`"${trimmedSkill}" already exists!`);
  }
};

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleAddFramework = () => {
    const trimmedFramework = newFramework.trim();
    if (trimmedFramework && !frameworks.includes(trimmedFramework)) {
      const updatedFrameworks = [...frameworks, trimmedFramework];
      setFrameworks(updatedFrameworks);
      setNewFramework("");
      
      // ✅ إشعار للمستخدم
      toast.success(`"${trimmedFramework}" added! Don't forget to Save Changes.`, {
        duration: 3000,
      });
    } else if (frameworks.includes(trimmedFramework)) {
      toast.info(`"${trimmedFramework}" already exists!`);
    }
  };

  const handleRemoveFramework = (frameworkToRemove: string) => {
    setFrameworks(frameworks.filter((framework) => framework !== frameworkToRemove));
  };

 const handleToggleIdeaVisibility = async (ideaId: string, currentVisibility: boolean) => {
  if (!authUser?._id || !authUser?.email) {
    toast.error('User not authenticated');
    return;
  }

  setToggleVisibilityLoading(ideaId); // ✅ حفظ ID الفكرة التي يتم تغيير رؤيتها
  try {
    const newVisibility = !currentVisibility;
    console.log('Sending request with:', { userId: authUser._id, email: authUser.email, ideaId, visible: newVisibility });
    
    const response = await axios.post('http://localhost:5000/api/profile/update-idea-visibility', {
      userId: authUser._id,
      email: authUser.email,
      ideaId,
      visible: newVisibility,
    }, {
      headers: {
        'Authorization': `Bearer ${authUser.token || ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      const updatedIdeas = savedIdeas.map((idea) =>
        (idea._id === ideaId || idea.id === ideaId) ? { ...idea, visible: newVisibility } : idea
      );
      setSavedIdeas(updatedIdeas);
      updateUser({ savedIdeas: updatedIdeas });
      
      if (typeof refreshUserData === 'function') {
        await refreshUserData();
      }
      
      toast.success(`Idea visibility updated to ${newVisibility ? 'visible' : 'hidden'}!`);
    } else {
      toast.error(response.data.error || 'Server update failed');
    }
  } catch (error) {
    console.error('Error toggling idea visibility:', error);
    toast.error('Failed to update idea visibility');
  } finally {
    setToggleVisibilityLoading(null); // ✅ إيقاف loading
  }
};

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <Toaster position="top-right" richColors />
        <InteractiveBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #0d9488);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #0f766e);
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden custom-scrollbar">
        <Toaster position="top-right" richColors />
        <InteractiveBackground />

        {/* Confetti Effect */}
        <AnimatePresence>
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-50">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: -20,
                    backgroundColor: ["#10b981", "#0891b2", "#8b5cf6", "#f59e0b"][Math.floor(Math.random() * 4)],
                  }}
                  initial={{ y: -20, opacity: 1, rotate: 0 }}
                  animate={{
                    y: window.innerHeight + 20,
                    opacity: 0,
                    rotate: 360,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    ease: "easeIn",
                    delay: Math.random() * 0.5,
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-emerald-900/10 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -5 }}>
                  <Button
                    variant="ghost"
                    onClick={onBack}
                    className="hover:bg-emerald-900/5 group relative overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0"
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform relative z-10" />
                    <span className="relative z-10">Back to</span>
                  </Button>
                </motion.div>

                <AnimatePresence>
                  {isSyncing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </motion.div>
                      <span>Syncing...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                {!isEditing ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-800 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{ x: [-100, 100] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <Edit2 className="w-4 h-4 mr-2 relative z-10" />
                      <span className="relative z-10">Edit Profile</span>
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:via-emerald-800 hover:to-teal-800 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group disabled:opacity-50"
                      >
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          animate={{ x: [-100, 100] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <Save className="w-4 h-4 mr-2 relative z-10" />
                        <span className="relative z-10">{loading ? "Saving..." : "Save Changes"}</span>
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => {
                          setName(user?.name || "");
                          setSpecialization(user?.specialization || "");
                          setSkills(ensureArray(user?.skills));
                          setFrameworks(ensureArray(user?.frameworks));
                          setGroupName(user?.groupName || "");
                          setGroupMembers(user?.groupMembers || []);
                          setIsEditing(false);
                          toast.info("Changes cancelled");
                        }}
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Hero Profile Section */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card className="bg-white/90 backdrop-blur-xl border-2 border-emerald-900/10 shadow-2xl shadow-emerald-500/10 overflow-hidden relative group">
                <motion.div
                  className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-bl-full"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-teal-400/20 to-transparent rounded-tr-full"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                />
                <motion.div
                  className="absolute top-10 right-20"
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </motion.div>
                <motion.div
                  className="absolute bottom-10 right-32"
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                >
                  <Star className="w-5 h-5 text-teal-400" />
                </motion.div>

                <CardContent className="p-8 md:p-12 relative">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar */}
                    <motion.div className="relative" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                      <motion.div
                        className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-900 p-1 shadow-2xl shadow-emerald-500/30 relative">
                        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center relative overflow-hidden group">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <User className="w-20 h-20 text-emerald-800 relative z-10" />
                        </div>
                      </div>
                      <motion.div
                        className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-2 shadow-lg"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <CheckCircle className="w-5 h-5 text-white" />
                      </motion.div>
                    </motion.div>

                    {/* Info Section */}
                    <div className="flex-1 text-center md:text-left">
                      <motion.h1
                        className="text-3xl md:text-4xl mb-3 bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-800 bg-clip-text text-transparent relative inline-block"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {user.name}
                      </motion.h1>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6"
                      >
                        <Badge className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                          <GraduationCap className="w-4 h-4 mr-2" />
                          {user.role === "student" ? "Student" : "Supervisor"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-emerald-700 text-emerald-800 px-4 py-2 text-sm hover:bg-emerald-50 transition-all"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {user.email}
                        </Badge>
                        {user.specialization && (
                          <Badge
                            variant="outline"
                            className="border-teal-600 text-teal-700 px-4 py-2 text-sm hover:bg-teal-50 transition-all"
                          >
                            <Briefcase className="w-4 h-4 mr-2" />
                            {user.specialization}
                          </Badge>
                        )}
                      </motion.div>

                      {/* Quick Stats */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="max-w-md mx-auto md:mx-0 mb-5"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {/* Team Size Card */}
                          <motion.div
                            whileHover={{ scale: 1.05, y: -3 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 border-2 border-emerald-700 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 opacity-0 group-hover:opacity-100"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-1">
                                <motion.div
                                  className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center"
                                  animate={{ rotate: [0, 5, -5, 0] }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                >
                                  <Users className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                                <span className="text-xs text-emerald-100">Team Size</span>
                              </div>
                              <motion.div
                                className="text-2xl text-white"
                                key={groupMembers.length}
                                initial={{ scale: 1.3, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                {groupMembers.length}
                              </motion.div>
                            </div>
                            <motion.div
                              className="absolute top-1 right-1"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Sparkles className="w-3 h-3 text-emerald-300" />
                            </motion.div>
                          </motion.div>

                          {/* Analyzed Ideas Card */}
                          <motion.div
                            whileHover={{ scale: 1.05, y: -3 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="relative bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-700 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-slate-500/30 to-slate-600/30 opacity-0 group-hover:opacity-100"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            />
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-1">
                                <motion.div
                                  className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center"
                                  animate={{ rotate: [0, -5, 5, 0] }}
                                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                                >
                                  <Lightbulb className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                                <span className="text-xs text-slate-100">Analyzed Ideas</span>
                              </div>
                              <motion.div
                                className="text-2xl text-white"
                                key={savedIdeas.length}
                                initial={{ scale: 1.3, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                {savedIdeas.length}
                              </motion.div>
                            </div>
                            <motion.div
                              className="absolute top-1 right-1"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            >
                              <Star className="w-3 h-3 text-slate-300" />
                            </motion.div>
                          </motion.div>
                        </div>
                      </motion.div>

                      {/* Profile Completion */}
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="max-w-md mx-auto md:mx-0"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-700" />
                            <span className="text-sm text-slate-700">Profile Completion</span>
                          </div>
                          <motion.span
                            className="text-3xl bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {profileCompletion}%
                          </motion.span>
                        </div>
                        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded-full overflow-hidden border-2 border-emerald-900/20 shadow-inner">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full relative overflow-hidden"
                            initial={{ width: 0 }}
                            animate={{ width: `${profileCompletion}%` }}
                            transition={{ delay: 0.6, duration: 1.5, ease: "easeOut" }}
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0"
                              animate={{ x: ["-100%", "200%"] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                          </motion.div>
                        </div>
                        {profileCompletion < 100 && (
                          <motion.p
                            className="text-xs text-slate-500 mt-2 flex items-center gap-1"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Lightbulb className="w-3 h-3" />
                            Complete all sections to unlock achievements
                          </motion.p>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs Navigation */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="relative">
                  <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 h-16 bg-white/90 backdrop-blur-xl border-2 border-emerald-900/10 shadow-xl rounded-2xl p-2 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <TabsTrigger
                      value="personal"
                      className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-emerald-50 text-slate-700 data-[state=active]:border-0 transition-all duration-300 rounded-xl flex items-center justify-center gap-2 group z-10"
                    >
                      <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <User className="w-5 h-5" />
                        <span className="hidden sm:inline">Personal Info</span>
                        <span className="sm:hidden">Info</span>
                      </motion.div>
                      {activeTab === "personal" && (
                        <motion.div
                          className="absolute inset-0 bg-white/20 rounded-xl"
                          animate={{ opacity: [0, 0.3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="ideas"
                      className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-emerald-50 text-slate-700 data-[state=active]:border-0 transition-all duration-300 rounded-xl flex items-center justify-center gap-2 group z-10"
                    >
                      <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Lightbulb className="w-5 h-5" />
                        <span className="hidden sm:inline">Analyzed Ideas</span>
                        <span className="sm:hidden">Ideas</span>
                        {(savedIdeas && Array.isArray(savedIdeas) && savedIdeas.length > 0) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              activeTab === "ideas" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {savedIdeas.length}
                          </motion.div>
                        )}
                      </motion.div>
                      {activeTab === "ideas" && (
                        <motion.div
                          className="absolute inset-0 bg-white/20 rounded-xl"
                          animate={{ opacity: [0, 0.3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left Column - Personal Information */}
                      <div className="lg:col-span-2 space-y-8">
                        {/* Academic Information */}
                        <motion.div
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          whileHover={{ y: -5 }}
                        >
                          <Card className="bg-white/90 backdrop-blur-xl border-2 border-emerald-900/10 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <motion.div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent)",
                              }}
                              animate={{ x: ["-100%", "200%"] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <CardContent className="p-6 relative">
                              <div className="flex items-center gap-3 mb-6">
                                <motion.div
                                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg relative overflow-hidden group"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <motion.div
                                    className="absolute inset-0 bg-white/20"
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                  <Award className="w-7 h-7 text-white relative z-10" />
                                </motion.div>
                                <div>
                                  <h2 className="text-2xl bg-gradient-to-r from-emerald-900 to-teal-700 bg-clip-text text-transparent">
                                    Academic Information
                                  </h2>
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Coffee className="w-3 h-3" />
                                    Your educational background
                                  </p>
                                </div>
                              </div>

                              <Separator className="mb-6 bg-gradient-to-r from-transparent via-emerald-900/30 to-transparent" />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <motion.div className="space-y-2" whileHover={{ scale: 1.02 }}>
                                  <label className="text-sm text-slate-600 flex items-center gap-2">
                                    <User className="w-4 h-4 text-emerald-700" />
                                    Full Name
                                  </label>
                                  <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    disabled={!isEditing}
                                    className={`border-2 ${
                                      isEditing
                                        ? "border-emerald-900/20 focus:border-emerald-700 bg-white hover:border-emerald-600"
                                        : "border-slate-200 bg-slate-50 cursor-not-allowed"
                                    } transition-all`}
                                  />
                                </motion.div>

                                <motion.div className="space-y-2" whileHover={{ scale: 1.02 }}>
                                  <label className="text-sm text-slate-600 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-emerald-700" />
                                    Specialization
                                  </label>
                                  <Input
                                    value={specialization}
                                    readOnly
                                    placeholder="Specialization (set during registration)"
                                    className="bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300"
                                  />
                                </motion.div>

                                <motion.div className="space-y-2" whileHover={{ scale: 1.02 }}>
                                  <label className="text-sm text-slate-600 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-emerald-700" />
                                    Email
                                  </label>
                                  <div className="p-3 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-lg border border-emerald-900/20 hover:border-emerald-600/40 transition-all group">
                                    <p className="text-emerald-900 group-hover:text-emerald-700 transition-colors">
                                      {user?.email || "Not specified"}
                                    </p>
                                  </div>
                                </motion.div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        {/* Skills & Technologies */}
                        <motion.div
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          whileHover={{ y: -5 }}
                        >
                          <Card className="bg-white/90 backdrop-blur-xl border-2 border-teal-900/10 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group relative">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-transparent rounded-br-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardContent className="p-6 relative">
                              <div className="flex items-center gap-3 mb-6">
                                <motion.div
                                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center shadow-lg relative overflow-hidden"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <motion.div
                                    className="absolute inset-0 bg-white/20"
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                  <Code className="w-7 h-7 text-white relative z-10" />
                                </motion.div>
                                <div>
                                  <h2 className="text-2xl bg-gradient-to-r from-teal-900 to-cyan-700 bg-clip-text text-transparent">
                                    Skills & Technologies
                                  </h2>
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Your technical expertise
                                  </p>
                                </div>
                              </div>

                              <Separator className="mb-6 bg-gradient-to-r from-transparent via-teal-900/30 to-transparent" />

                              <div className="space-y-6">
                                <div className="space-y-3">
                                  <label className="text-sm text-slate-600 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-emerald-700" />
                                    <span>Technical Skills</span>
                                    {skills && skills.length > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="ml-auto bg-emerald-100 text-emerald-800 text-xs"
                                      >
                                        {skills.length} skills
                                      </Badge>
                                    )}
                                  </label>

                                  {isEditing && (
                                    <>
                                      <div className="flex gap-2">
                                        <Input
                                          value={newSkill}
                                          onChange={(e) => setNewSkill(e.target.value)}
                                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                                          placeholder="Add a skill (e.g., Python, JavaScript)"
                                          className="border-2 border-emerald-900/20 focus:border-emerald-700 bg-white hover:border-emerald-600 transition-all"
                                        />
                                        <Button
                                          type="button"
                                          onClick={handleAddSkill}
                                          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shrink-0"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Press Enter or + to add • Click X to remove
                                      </p>
                                    </>
                                  )}

                                  <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-lg border border-emerald-900/20 min-h-[60px]">
                                    {skills.length > 0 ? (
                                      skills.map((skill, i) => (
                                        <motion.div
                                          key={i}
                                          initial={{ opacity: 0, scale: 0 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0 }}
                                          transition={{ delay: i * 0.05, type: "spring" }}
                                          whileHover={{ scale: isEditing ? 1.05 : 1 }}
                                        >
                                          <Badge
                                            className={`bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md px-3 py-1.5 flex items-center gap-2 ${
                                              isEditing ? "cursor-pointer hover:shadow-lg" : ""
                                            } transition-all`}
                                          >
                                            <span>{skill}</span>
                                            {isEditing && (
                                              <motion.div
                                                whileHover={{ scale: 1.2, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                              >
                                                <X
                                                  className="w-3.5 h-3.5 cursor-pointer hover:text-red-200 transition-colors"
                                                  onClick={() => handleRemoveSkill(skill)}
                                                />
                                              </motion.div>
                                            )}
                                          </Badge>
                                        </motion.div>
                                      ))
                                    ) : (
                                      <p className="text-slate-400 text-sm">No skills added yet</p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <label className="text-sm text-slate-600 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-teal-700" />
                                    <span>Frameworks & Tools</span>
                                    {frameworks && frameworks.length > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="ml-auto bg-teal-100 text-teal-800 text-xs"
                                      >
                                        {frameworks.length} tools
                                      </Badge>
                                    )}
                                  </label>

                                  {isEditing && (
                                    <>
                                      <div className="flex gap-2">
                                        <Input
                                          value={newFramework}
                                          onChange={(e) => setNewFramework(e.target.value)}
                                          onKeyPress={(e) =>
                                            e.key === "Enter" && (e.preventDefault(), handleAddFramework())
                                          }
                                          placeholder="Add a tool (e.g., React, Node.js, TensorFlow)"
                                          className="border-2 border-teal-900/20 focus:border-teal-700 bg-white hover:border-teal-600 transition-all"
                                        />
                                        <Button
                                          type="button"
                                          onClick={handleAddFramework}
                                          className="bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white shadow-lg shrink-0"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Press Enter or + to add • Click X to remove
                                      </p>
                                    </>
                                  )}

                                  <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-lg border border-teal-900/20 min-h-[60px]">
                                    {frameworks.length > 0 ? (
                                      frameworks.map((framework, i) => (
                                        <motion.div
                                          key={i}
                                          initial={{ opacity: 0, scale: 0 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0 }}
                                          transition={{ delay: i * 0.05, type: "spring" }}
                                          whileHover={{ scale: isEditing ? 1.05 : 1 }}
                                        >
                                          <Badge
                                            className={`bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-md px-3 py-1.5 flex items-center gap-2 ${
                                              isEditing ? "cursor-pointer hover:shadow-lg" : ""
                                            } transition-all`}
                                          >
                                            <span>{framework}</span>
                                            {isEditing && (
                                              <motion.div
                                                whileHover={{ scale: 1.2, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                              >
                                                <X
                                                  className="w-3.5 h-3.5 cursor-pointer hover:text-red-200 transition-colors"
                                                  onClick={() => handleRemoveFramework(framework)}
                                                />
                                              </motion.div>
                                            )}
                                          </Badge>
                                        </motion.div>
                                      ))
                                    ) : (
                                      <p className="text-slate-400 text-sm">No frameworks added yet</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>

                      {/* Right Column - Team */}
                      <div className="space-y-8">
                        <motion.div
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          whileHover={{ y: -5 }}
                        >
                          <Card className="bg-white/90 backdrop-blur-xl border-2 border-emerald-900/10 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group sticky top-24 relative">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-emerald-500/10 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardContent className="p-6 relative">
                              <div className="flex items-center gap-3 mb-6">
                                <motion.div
                                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg relative overflow-hidden"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <motion.div
                                    className="absolute inset-0 bg-white/20"
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  />
                                  <Users className="w-7 h-7 text-white relative z-10" />
                                </motion.div>
                                <div>
                                  <h2 className="text-2xl bg-gradient-to-r from-emerald-900 to-teal-700 bg-clip-text text-transparent">
                                    Team
                                  </h2>
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    Your project team
                                  </p>
                                </div>
                              </div>

                              <Separator className="mb-6 bg-gradient-to-r from-transparent via-emerald-900/30 to-transparent" />

                              {teamInvitations && teamInvitations.length > 0 && (
                                <div className="mb-6">
                                  <TeamInvitations
                                    invitations={teamInvitations}
                                    currentUserId={user?._id || ""}
                                    currentUserEmail={user?.email || ""}
                                    onInvitationResponse={(invitationId, action) => {
                                      setTeamInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
                                      setUser((prev) => ({ ...prev!, teamInvitations: prev!.teamInvitations?.filter((inv) => inv.id !== invitationId) || [] }));
                                    }}
                                  />
                                </div>
                              )}

                              <TeamManagement
                                currentUserEmail={user?.email || ""}
                                currentUserId={user?._id}
                                groupName={groupName}
                                groupMembers={groupMembers}
                                onMembersUpdate={(members) => setGroupMembers(members)}
                                onGroupNameUpdate={(name) => setGroupName(name)}
                                onViewMember={onViewMember}
                                showGroupName={true}
                                readOnly={!isEditing}
                              />
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Analyzed Ideas Tab */}
             {/* Analyzed Ideas Tab */}
<TabsContent value="ideas" className="mt-8">
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
    <Card className="border-2 border-emerald-200">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-emerald-900">Analyzed Ideas</h2>
            <p className="text-xs text-slate-500 mt-1">
              Found {savedIdeas.length} idea{savedIdeas.length !== 1 ? 's' : ''}
              {user?.agreed_idea_id && ` | Agreed: ${user.agreed_idea_id.slice(0, 8)}...`}
            </p>
          </div>
          <div className="flex gap-2">
            {savedIdeas.length > 0 && (
              <Button
                variant="outline"
                className="flex items-center gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                onClick={handleExportIdeas}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        {savedIdeas && Array.isArray(savedIdeas) && savedIdeas.length > 0 ? (
          <div className="space-y-3">
            {/* Banner للاتفاق */}
            {savedIdeas.some(i => i.is_agreed) && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-amber-900">Team Agreement Active</h4>
                      <p className="text-sm text-amber-700">
                        Your team has agreed on an idea. Remove it to select a different one.
                      </p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRemoveAgreement}
                      disabled={removeAgreementLoading}
                      className="border-amber-600 text-amber-700 hover:bg-amber-50"
                    >
                      {removeAgreementLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Remove Agreement
                    </Button>
                  </motion.div>
                </div>
              </div>
            )}

            {/* عرض الأفكار */}
            {savedIdeas.map((idea: any, index: number) => {
              const ideaId = idea._id || idea.id;
              const isAgreed = idea.is_agreed === true;
              const inGroup = user?.groupMembers && user.groupMembers.length > 0;
              const hasAgreedIdea = savedIdeas.some(i => i.is_agreed && (i._id !== ideaId && i.id !== ideaId));
              const isTogglingVisibility = toggleVisibilityLoading === ideaId;

              return (
                <motion.div
                  key={ideaId || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`bg-white rounded-lg shadow-sm p-4 border transition-all relative ${
                    isAgreed 
                      ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 ring-2 ring-emerald-200' 
                      : 'border-emerald-100 hover:bg-emerald-50'
                  }`}
                >
                  {/* Badge */}
                  {isAgreed && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs flex items-center gap-1 shadow-md animate-pulse">
                        <CheckCircle className="w-3 h-3" />
                        Team Agreed 
                      </Badge>
                    </div>
                  )}

                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${isAgreed ? 'text-emerald-900' : 'text-slate-900'}`}>
                        {idea.stage_1_initial_analysis?.Project_Title || idea.title || `Idea ${index + 1}`}
                      </h3>
                      <p className="text-sm text-slate-700 mt-1 line-clamp-2">
                        {idea.description || 'No description'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {idea.keywords?.slice(0, 5).map((keyword: string, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className={`text-xs px-2 py-0.5 ${
                              isAgreed 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* الأزرار */}
                    <div className="flex gap-1 flex-wrap justify-end">
                      {/* عرض التفاصيل */}
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedIdea(idea);
                            setShowIdeaDetail(true);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </motion.div>

                      {/* زر الاتفاق */}
                      {inGroup && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          {isAgreed ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="border-emerald-600 bg-emerald-100 text-emerald-700 cursor-default text-xs flex items-center gap-1 min-w-[90px]"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Agreed </span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAgreeOnIdea(idea)}
                              disabled={agreeLoading || hasAgreedIdea}
                              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-xs flex items-center gap-1 min-w-[90px] disabled:opacity-50 disabled:cursor-not-allowed"
                              title={hasAgreedIdea ? "Remove current agreement first" : "Team Agree"}
                            >
                              {agreeLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Users className="w-3.5 h-3.5" />
                                  <span>Team Agree</span>
                                </>
                              )}
                            </Button>
                          )}
                        </motion.div>
                      )}

                      {/* زر تبديل الرؤية */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant={idea.visible ? "default" : "outline"}
                          onClick={() => handleToggleVisibility(idea)}
                          disabled={isTogglingVisibility}
                          className={`text-xs flex items-center gap-1 min-w-[80px] ${
                            idea.visible
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {isTogglingVisibility ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : idea.visible ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </Button>
                      </motion.div>

                      {/* زر الحذف */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteIdea(idea)}
                          className="border-red-600 text-red-600 hover:bg-red-50 text-xs flex items-center gap-1 min-w-[70px]"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            </motion.div>
            <p className="text-slate-500 mb-2">No analyzed ideas yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
</TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </main>

        {/* Idea Detail Modal */}
        <AnimatePresence>
          {showIdeaDetail && selectedIdea && (
            <IdeaDetailModal
              idea={selectedIdea}
              isOpen={showIdeaDetail}
              onClose={() => {
                setShowIdeaDetail(false);
                setSelectedIdea(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}