import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Archive,
  User,
  Lightbulb,
  PlusCircle,
  Search,
  LogOut,
  BookOpen,
  Save,
  Loader2,
  GraduationCap,
  Plus,
  Trash2,
  ExternalLink,
  ArrowRight,
  Zap,
  Sparkles,
  ArrowRight as ArrowRightIcon,
  Home,
  Calendar,
  FileText,
  Edit,
  Users,
  Rocket
} from "lucide-react";
import { useAuth } from "../../frontend/lib/auth-context";
import { InteractiveBackground, SimpleInteractiveBackground } from "./Backgrounds";
import { StudentFullProfile } from "./StudentFullProfile";
import { ProjectArchive } from "./ProjectArchive";
import { Toaster, toast } from "sonner";

interface ProjectIdea {
  _id?: string;
  title: string;
  description: string;
  category: string;
  supervisorId?: string;
  createdAt?: string;
  
}

interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  role?: string;
  specialization?: string;
  skills?: string[];
  frameworks?: string[];
  groupName?: string;
  groupMembers?: any[];
  savedIdeas?: any[];
  hasProfile?: boolean;
  createdAt?: string;
}

interface ResearchPaper {
  platform: string;
  title: string;
}

interface ProfileData {
  name: string;
  email: string;
  department: string;
  researchInterests: string[];
  researchPapers: ResearchPaper[];
  publications?: number;
  
  
}

export function SupervisorDashboard() {
  const { user, logout, updateUser } = useAuth();
  const [currentView, setCurrentView] = useState<' ' | 'archive' | 'profile' | 'ideas' | 'students'>(' ');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [newInterest, setNewInterest] = useState<string>('');

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    department: (user as any)?.department ?? '',
    researchInterests: Array.isArray((user as any)?.researchInterests) ? (user as any).researchInterests : [],
    researchPapers: Array.isArray((user as any)?.researchPapers) ? (user as any).researchPapers : [],
    publications: (user as any)?.researchPapers?.length ?? 0
  });

  const [showAllResearch, setShowAllResearch] = useState(false);
  const [showAllPapers, setShowAllPapers] = useState(false);
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [newPaper, setNewPaper] = useState<ResearchPaper>({
    title: '',
    platform: ''
  });

  const [myIdeas, setMyIdeas] = useState<ProjectIdea[]>([]);
  const [newIdea, setNewIdea] = useState<ProjectIdea>({ title: '', description: '', category: '' });
  const [editingIdea, setEditingIdea] = useState<ProjectIdea | null>(null);
  const [isEditing, setIsEditing] = useState(false);
const [supervisorData, setSupervisorData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [viewingStudentProfile, setViewingStudentProfile] = useState(false);
  const [loadingMemberProfile, setLoadingMemberProfile] = useState(false);

  useEffect(() => {
    loadSupervisorData();
    loadMyIdeas();
    loadStudents();

    const timer = setTimeout(() => setShowWelcome(false), 3000);
    const interval = setInterval(() => loadStudents(), 30000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تأكدي إن الدالة دي موجودة في أعلى الملف (جنب الدوال الثانية)
const ensureArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return typeof value === 'string' ? [value] : [];
};
  // ---------- Network functions using localhost API ----------
const loadSupervisorData = async () => {
  setLoading(true);
  try {
    // ✅ تغيير: استخدام endpoint محدد بدلاً من قائمة
    const response = await fetch(`http://localhost:5000/api/supervisor/full-profile/${user?._id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`,
      },
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    // ✅ تغيير: البيانات تأتي مباشرة من supervisor object
    if (data.success && data.supervisor) {
      setSupervisorData(data.supervisor);
      setProfileData({
        name: data.supervisor.name,
        email: data.supervisor.email,
        department: data.supervisor.department || '',  // ✅ تغيير: department بدلاً من specialization
        researchInterests: data.supervisor.researchInterests || [],
        researchPapers: data.supervisor.researchPapers || [],
      });
    }
  } catch (error) {
    console.error('[SupervisorDashboard] Error loading supervisor data:', error);
    toast.error(`Failed to load supervisor data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
};

  const loadMyIdeas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/ideas?supervisorId=${user?._id}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMyIdeas(data.data || data.ideas || []);
      } else {
        setMyIdeas([]);
      }
    } catch (error) {
      console.error(' [SupervisorDashboard] Error loading ideas:', error);
      toast.error('Failed to load ideas');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/students', {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const studentsWithProfiles = (data.data || data.students || []).filter((s: StudentProfile) => s.hasProfile);
        setStudents(studentsWithProfiles);
        setFilteredStudents(studentsWithProfiles);
      } else {
        setStudents([]);
        setFilteredStudents([]);
      }
    } catch (error) {
      console.error('❌ [SupervisorDashboard] Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaveLoading(true);
      
      // Prepare the update payload
      const updatePayload = {
        userId: user?._id,
        email: user?.email,
        name: profileData.name,
        department: profileData.department,
        researchInterests: profileData.researchInterests,
        researchPapers: profileData.researchPapers,
        publications: profileData.researchPapers.length
      };

      console.log('📤 Sending update:', updatePayload);

      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        },
        body: JSON.stringify(updatePayload)
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (response.ok && data.success) {
        // Update local user context with new data
        updateUser({ 
          ...user, 
          name: data.user.name,
          department: data.user.department,
          researchInterests: data.user.researchInterests,
          researchPapers: data.user.researchPapers,
          publications: data.user.publications
        });
        toast.success('Profile updated successfully!');
        // Reload supervisor data to ensure sync
        await loadSupervisorData();
      } else {
        toast.error(data.error || data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ [SupervisorDashboard] Error updating profile:', error);
      toast.error('Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSubmitIdea = async () => {
    if (!newIdea.title?.trim() || !newIdea.description?.trim() || !newIdea.category?.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && editingIdea?._id) {
        // update
        const response = await fetch('http://localhost:5000/api/ideas/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ideaId: editingIdea._id,
            ...newIdea
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          toast.success('Project idea updated successfully!');
          setIsEditing(false);
          setEditingIdea(null);
          setNewIdea({ title: '', description: '', category: '' });
          await loadMyIdeas();
        } else {
          throw new Error(data.message || 'Failed to update idea');
        }
      } else {
        // add
        const response = await fetch('http://localhost:5000/api/ideas/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supervisorId: user?._id,
            ...newIdea
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          toast.success('Project idea added successfully!');
          setNewIdea({ title: '', description: '', category: '' });
          await loadMyIdeas();
          setCurrentView(' ');
        } else {
          throw new Error(data.message || 'Failed to add idea');
        }
      }
    } catch (error: any) {
      console.error('❌ [Dashboard] Error submitting idea:', error);
      toast.error(error.message || 'Failed to save project idea');
    } finally {
      setLoading(false);
    }
  };

  const handleEditIdeaLocal = (idea: ProjectIdea) => {
    setEditingIdea(idea);
    setNewIdea({
      title: idea.title,
      description: idea.description,
      category: idea.category
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditingIdea(null);
    setNewIdea({ title: '', description: '', category: '' });
    setIsEditing(false);
  };

  const handleDeleteIdea = async (ideaId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this project idea?')) return;

      const response = await fetch('http://localhost:5000/api/ideas/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Project idea deleted successfully!');
        await loadMyIdeas();
      } else {
        throw new Error(data.message || 'Failed to delete idea');
      }
    } catch (error: any) {
      console.error('❌ [Dashboard] Error deleting idea:', error);
      toast.error(error.message || 'Failed to delete project idea');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredStudents(students);
      return;
    }
    const searchTerm = query.toLowerCase();
    setFilteredStudents(
      students.filter(student => {
        return (
          student.name?.toLowerCase().includes(searchTerm) ||
          student.email?.toLowerCase().includes(searchTerm) ||
          student.specialization?.toLowerCase().includes(searchTerm) ||
          student.groupName?.toLowerCase().includes(searchTerm) ||
          student.skills?.some(s => s.toLowerCase().includes(searchTerm)) ||
          student.frameworks?.some(f => f.toLowerCase().includes(searchTerm))
        );
      })
    );
  };

  const handleViewMember = async (memberEmail: string) => {
    setLoadingMemberProfile(true);
    try {
      const response = await fetch('http://localhost:5000/api/students', {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && (data.students || data.data)) {
        const list: StudentProfile[] = data.students || data.data || [];
        const student = list.find(s => s.email === memberEmail);
        if (student) {
          setSelectedStudent(student);
          setViewingStudentProfile(true);
        } else {
          toast.error('Student profile not found');
        }
      } else {
        throw new Error(data.message || 'Failed to load student data');
      }
    } catch (error: any) {
      console.error('❌ [Dashboard] Error loading member profile:', error);
      toast.error(error.message || 'Failed to load student profile');
    } finally {
      setLoadingMemberProfile(false);
    }
  };

  const handleAddPaperLocal = () => {
    if (!newPaper.title.trim()) {
      toast.error('Please enter a paper title');
      return;
    }
    setProfileData(prev => ({
      ...prev,
      researchPapers: [...prev.researchPapers, { ...newPaper }],
      publications: (prev.researchPapers?.length ?? 0) + 1
    }));
    setNewPaper({
      title: '',
      platform: ''
    });
    setIsAddingPaper(false);
    toast.success('Research paper added!');
  };

  const handleRemovePaperLocal = (index: number) => {
    setProfileData(prev => {
      const papers = prev.researchPapers.filter((_, i) => i !== index);
      return { ...prev, researchPapers: papers, publications: papers.length };
    });
    toast.success('Research paper removed');
  };

  // ----------------- UI rendering -----------------
  if (viewingStudentProfile && selectedStudent) {
    return (
      <StudentFullProfile
        student={selectedStudent}
        onBack={() => {
          setViewingStudentProfile(false);
          loadStudents();
        }}
        onViewMember={handleViewMember}
      />
    );
  }

  if (currentView === 'archive') {
    return <ProjectArchive onBack={() => setCurrentView(' ')} />;
  }

  if (currentView === ' ') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-white">
        <SimpleInteractiveBackground />
        <Toaster position="top-right" richColors />

        <AnimatePresence>
          {showWelcome && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-xl">
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }} transition={{ type: "spring", duration: 0.8 }} className="text-center">
                <motion.div animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 2, ease: "easeInOut" }} className="inline-block mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-slate-800 via-emerald-900 to-slate-900 rounded-3xl flex items-center justify-center shadow-2xl">
                    <GraduationCap className="w-16 h-16 text-white" />
                  </div>
                </motion.div>

                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-5xl mb-3 bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-800 bg-clip-text text-transparent">
                  Welcome, {profileData.name ? `Dr. ${profileData.name.split(' ')[profileData.name.split(' ').length - 1]}` : 'Professor'}
                </motion.h1>

                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-xl text-slate-600">
                  {profileData.department || 'Your department'}
                </motion.p>

                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: "spring" }} className="mt-8">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-emerald-900 rounded-2xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl bg-gradient-to-r from-slate-900 to-emerald-800 bg-clip-text text-transparent">GPRS Portal</h1>
                  <p className="text-xs text-slate-600">Supervisor Dashboard</p>
                </div>
              </motion.div>

              <div className="flex items-center gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentView('profile')} className="relative w-11 h-11 bg-gradient-to-br from-slate-800 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow group" title="My Profile">
                  <User className="w-6 h-6 text-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-500 rounded-full flex items-center justify-center">
                    <Edit className="w-2.5 h-2.5 text-white" />
                  </div>
                </motion.button>

                <Button variant="ghost" onClick={logout} className="text-slate-700 hover:text-red-600 hover:bg-red-50" size="sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section className="relative py-16 overflow-hidden">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl mb-4 bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-900 bg-clip-text text-transparent">Your Academic direction centre</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">Manage projects, connect with students, and showcase your research</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              <Card className="border-2 border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all bg-gradient-to-br from-white to-slate-50/30">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Lightbulb className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-3xl text-slate-900 mb-1">{myIdeas.length}</p>
                  <p className="text-sm text-slate-600">Project Ideas</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all bg-gradient-to-br from-white to-emerald-50/30">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-3xl text-slate-900 mb-1">{profileData.researchInterests.length}</p>
                  <p className="text-sm text-slate-600">Research</p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-2xl text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-slate-700" />
                  Quick Actions
                </h3>

                <motion.div whileHover={{ x: 5 }} onClick={() => setCurrentView('ideas')} className="cursor-pointer">
                  <Card className="border-2 border-slate-200 hover:border-slate-400 hover:shadow-2xl transition-all bg-gradient-to-r from-slate-800 to-emerald-900 text-white overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                          <Lightbulb className="w-7 h-7 text-white" />
                        </div>
                        <ArrowRightIcon className="w-6 h-6 text-white/70 group-hover:translate-x-2 transition-transform" />
                      </div>
                      <h4 className="text-xl mb-2">Project Ideas</h4>
                      <p className="text-sm text-slate-100">Manage & add project ideas ({myIdeas.length})</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ x: 5 }} onClick={() => setCurrentView('archive')} className="cursor-pointer">
                  <Card className="border-2 border-slate-200 hover:border-slate-400 hover:shadow-2xl transition-all bg-gradient-to-br from-white to-slate-50/50 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Archive className="w-7 h-7 text-white" />
                        </div>
                        <ArrowRightIcon className="w-6 h-6 text-slate-600 group-hover:translate-x-2 transition-transform" />
                      </div>
                      <h4 className="text-xl text-slate-900 mb-2">Browse Archive</h4>
                      <p className="text-sm text-slate-600">Explore graduation projects database</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ x: 5 }} onClick={() => setCurrentView('students')} className="cursor-pointer">
                  <Card className="border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-2xl transition-all bg-gradient-to-br from-white to-emerald-50/50 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl flex items-center justify-center shadow-lg">
                          <Search className="w-7 h-7 text-white" />
                        </div>
                        <ArrowRightIcon className="w-6 h-6 text-emerald-600 group-hover:translate-x-2 transition-transform" />
                      </div>
                      <h4 className="text-xl text-slate-900 mb-2">Search Students</h4>
                      <p className="text-sm text-slate-600">{students.length} student profiles available</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-emerald-700" />
                  Research Interests
                </h3>

                {profileData.researchInterests.length > 0 ? (
                  <Card className="border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-emerald-700" />
                          Research
                        </CardTitle>
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          {profileData.researchInterests.length} {profileData.researchInterests.length === 1 ? 'Area' : 'Areas'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-2">
                        {(showAllResearch ? profileData.researchInterests : profileData.researchInterests.slice(0, 5)).map((interest, index) => (
                          <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200 hover:border-emerald-400 hover:shadow-sm transition-all">
                            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-800 to-teal-900 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs">{index + 1}</span>
                            </div>
                            <span className="text-sm text-slate-800">{interest}</span>
                          </motion.div>
                        ))}
                      </div>

                      {profileData.researchInterests.length > 5 && (
                        <Button variant="outline" onClick={() => setShowAllResearch(!showAllResearch)} className="w-full mt-3 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400" size="sm">
                          {showAllResearch ? 'Show Less' : `Show ${profileData.researchInterests.length - 5} More`}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed border-emerald-200 bg-gradient-to-br from-slate-50 to-emerald-50/30">
                    <CardContent className="p-12 text-center">
                      <BookOpen className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                      <p className="text-sm text-slate-600 mb-3">No research interests yet</p>
                      <Button onClick={() => setCurrentView('profile')} size="sm" className="bg-gradient-to-r from-emerald-800 to-teal-900">
                        <Plus className="w-4 h-4 mr-2" /> Add Research Interest
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1e293b; }
        `}</style>
      </div>
    );
  }

  // ---------- Profile view ----------
 // Profile view
if (currentView === 'profile') {
  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <SimpleInteractiveBackground />
      <Toaster position="top-right" richColors />

      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-900/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentView(' ')} className="text-slate-900">
              <Home className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <h1 className="text-xl bg-gradient-to-r from-slate-900 to-emerald-800 bg-clip-text text-transparent">My Academic Profile</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-slate-200 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <User className="w-6 h-6 text-slate-800" /> Academic Information
              </CardTitle>
              <CardDescription>Manage your professional profile and research portfolio</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
           {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profileData.email} disabled className="bg-slate-100" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Department</Label>
                  <Input
                    placeholder="e.g., Computer Science"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    className="bg-slate-50"
                  />
                </div>
              </div>

              {/* Research Interests */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-slate-800" /> Research Interests
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">Add your research interests one by one</p>
                  </div>
                  <Badge variant="outline" className="text-sm bg-slate-50 border-slate-300 text-slate-800">
                    {profileData.researchInterests.length} {profileData.researchInterests.length === 1 ? 'Interest' : 'Interests'}
                  </Badge>
                </div>

                {/* حقل إدخال لإضافة اهتمام جديد */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter a research interest (e.g., Machine Learning)"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    className="bg-slate-50"
                  />
                  <Button
                    onClick={() => {
                      if (newInterest.trim()) {
                        setProfileData({
                          ...profileData,
                          researchInterests: [...profileData.researchInterests, newInterest.trim()],
                        });
                        setNewInterest(''); // إعادة تعيين الحقل بعد الإضافة
                        toast.success('تم إضافة الاهتمام البحثي!');
                      } else {
                        toast.error('الرجاء إدخال اهتمام بحثي صحيح');
                      }
                    }}
                    className="bg-gradient-to-r from-slate-800 to-emerald-900 hover:from-slate-900 hover:to-emerald-800"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                </div>

                {/* عرض الاهتمامات البحثية */}
                {profileData.researchInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.researchInterests.map((interest, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {interest}
                        <button
                          onClick={() =>
                            setProfileData({
                              ...profileData,
                              researchInterests: profileData.researchInterests.filter((_, i) => i !== index),
                            })
                          }
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No research interests have been added yet.</p>
                )}
              </div>

          {/* Research Publications */}
<div className="space-y-4 pt-6 border-t">
  <div className="flex items-center justify-between">
    <div>
      <Label className="text-lg flex items-center gap-2">
        <FileText className="w-6 h-6 text-slate-800" /> Research Publications
      </Label>
      <p className="text-sm text-slate-500 mt-1">Add your publications with their research areas</p>
    </div>
    <Badge variant="outline" className="text-sm bg-slate-50 border-slate-300 text-slate-800">
      {profileData.researchPapers.length} {profileData.researchPapers.length === 1 ? 'Publication' : 'Publications'}
    </Badge>
  </div>

  <Button
    onClick={() => setIsAddingPaper(!isAddingPaper)}
    className="w-full bg-gradient-to-r from-slate-800 to-emerald-900 hover:from-slate-900 hover:to-emerald-800"
    variant={isAddingPaper ? 'outline' : 'default'}
  >
    <Plus className="w-4 h-4 mr-2" /> {isAddingPaper ? 'Cancel' : 'Add New Publication'}
  </Button>

  <AnimatePresence>
    {isAddingPaper && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-gradient-to-br from-slate-50 to-emerald-50/30 border-2 border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="paperTitle" className="text-sm">Paper Title *</Label>
            <Input
              id="paperTitle"
              placeholder="e.g., Deep Learning"
              value={newPaper.title}
              onChange={(e) => setNewPaper({ ...newPaper, title: e.target.value })}
              className="bg-white border-slate-300 focus:border-slate-600 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="paperPlatform" className="text-sm flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Platform / Research Area *
            </Label>
            <Input
              id="paperPlatform"
              placeholder="e.g., Machine Learning"
              value={newPaper.platform}
              onChange={(e) => setNewPaper({ ...newPaper, platform: e.target.value })}
              className="bg-white border-slate-300 focus:border-slate-600 mt-1"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddingPaper(false);
              setNewPaper({ title: '', platform: '' });
            }}
            className="border-slate-300"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAddPaperLocal}
            className="bg-gradient-to-r from-slate-800 to-emerald-900 hover:from-slate-900 hover:to-emerald-800"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Publication
          </Button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {profileData.researchPapers.length > 0 ? (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {(showAllPapers ? profileData.researchPapers : profileData.researchPapers.slice(0, 5)).map((paper, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-gradient-to-br from-white to-slate-50/30 border-2 border-slate-200 hover:border-slate-400 rounded-xl p-4 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-3">

              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-slate-800 to-emerald-900 text-white rounded-xl flex items-center justify-center shadow-md">
                <span className="text-sm">{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-base text-slate-900 mb-1 font-semibold line-clamp-2">
                  {paper.title}
                </h4>
                <p className="text-xs text-slate-600">
                  Platform: <span className="font-medium text-emerald-700">{paper.platform}</span>
                </p>
              </div>

              <button
                onClick={() => handleRemovePaperLocal(index)}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-lg transition-all flex-shrink-0"
                title="Remove publication"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>

            </div>
          </motion.div>
        ))}
      </div>

      {profileData.researchPapers.length > 5 && (
        <Button
          variant="outline"
          onClick={() => setShowAllPapers(!showAllPapers)}
          className="w-full border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400"
        >
          {showAllPapers ? 'Show Less' : `Show ${profileData.researchPapers.length - 5} More`}
        </Button>
      )}
    </div>
  ) : (
    <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-emerald-50/30 border-2 border-dashed border-slate-200 rounded-xl">
      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
      <p className="text-sm text-slate-600 mb-1">No publications added yet</p>
      <p className="text-xs text-slate-400">Add your research papers and academic publications</p>
    </div>
  )}
</div>



              <Button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-slate-800 to-emerald-900 hover:from-slate-900 hover:to-emerald-800"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
  // ---------- Ideas view ----------
  if (currentView === 'ideas') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-white">
        <SimpleInteractiveBackground />
        <Toaster position="top-right" richColors />

        <header className="bg-white/95 backdrop-blur-xl border-b border-slate-900/10 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentView(' ')} className="text-slate-900"><Home className="w-4 h-4 mr-2" /> Back to Dashboard</Button>
              <h1 className="text-xl bg-gradient-to-r from-slate-900 to-emerald-800 bg-clip-text text-transparent">Project Ideas ({myIdeas.length})</h1>
              <div className="w-32" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="border-2 border-slate-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PlusCircle className="w-5 h-5 text-slate-800" />{isEditing ? 'Edit Idea' : 'Add New Idea'}</CardTitle>
                    <CardDescription>{isEditing ? 'Update your project concept' : 'Share a project concept with students'}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {isEditing && <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-3 mb-2"><div className="flex items-center gap-2 text-emerald-800 text-sm"><Edit className="w-4 h-4" /><span>Editing: {editingIdea?.title}</span></div></div>}
                    <div className="space-y-2">
                      <Label className="text-sm">Project Title *</Label>
                      <Input placeholder="e.g., AI Medical System" value={newIdea.title} onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })} className="bg-slate-50" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Category *</Label>
                      <Input placeholder="e.g., Machine Learning" value={newIdea.category} onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })} className="bg-slate-50" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Description *</Label>
                      <Textarea placeholder="Describe objectives and outcomes..." value={newIdea.description} onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })} className="bg-slate-50 min-h-24 text-sm" />
                    </div>

                    <div className="space-y-2">
                      <Button onClick={handleSubmitIdea} disabled={loading} className="w-full bg-gradient-to-r from-slate-800 to-emerald-900 hover:from-slate-900 hover:to-emerald-800">
                        {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEditing ? 'Updating...' : 'Adding...'}</>) : (isEditing ? (<><Save className="w-4 h-4 mr-2" />Update Idea</>) : (<><PlusCircle className="w-4 h-4 mr-2" />Add Idea</>))}
                      </Button>
                      {isEditing && <Button onClick={handleCancelEdit} variant="outline" className="w-full border-slate-300">Cancel Edit</Button>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl text-slate-900 mb-1">My Ideas</h2>
                  <p className="text-sm text-slate-600">Projects shared with students</p>
                </div>
                <Badge className="bg-slate-100 text-slate-800 border-slate-300">{myIdeas.length} {myIdeas.length === 1 ? 'Idea' : 'Ideas'}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myIdeas.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-gradient-to-br from-slate-50 to-emerald-50/30 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Lightbulb className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg mb-2">No project ideas yet</p>
                    <p className="text-sm text-slate-500">Use the form to add your first idea</p>
                  </div>
                ) : (
                  myIdeas.map((idea, index) => (
                    <motion.div key={idea._id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -5 }}>
                      <Card className="border-2 border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all h-full group">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">{idea.category}</Badge>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="ghost" onClick={(e: { stopPropagation: () => void; }) => { e.stopPropagation(); handleEditIdeaLocal(idea); }} className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"><Edit className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" onClick={(e: { stopPropagation: () => void; }) => { e.stopPropagation(); if (idea._id) handleDeleteIdea(idea._id); }} className="h-7 w-7 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                          <CardTitle className="text-lg">{idea.title}</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-sm text-slate-600 line-clamp-3">{idea.description}</p></CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------- Students view ----------
  if (currentView === 'students') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-white">
        <SimpleInteractiveBackground />
        <Toaster position="top-right" richColors />

        <header className="bg-white/95 backdrop-blur-xl border-b border-slate-900/10 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentView(' ')} className="text-slate-900"><Home className="w-4 h-4 mr-2" /> Back to Dashboard</Button>
              <h1 className="text-xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Search Students ({filteredStudents.length})</h1>
              <div className="w-32" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-6">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input placeholder="Search by name, email, skills, or specialization..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <Users className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No students found</p>
              </div>
            ) : (
              filteredStudents.map((student, index) => (
                <motion.div key={student._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="border-2 border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all cursor-pointer h-full" onClick={() => { setSelectedStudent(student); setIsStudentDialogOpen(true); }}>
                    <CardHeader>
                      <CardTitle className="text-base">{student.name}</CardTitle>
                      <a href={`mailto:${student.email}`} onClick={(e) => e.stopPropagation()} className="hover:underline hover:text-cyan-700 transition-colors inline-block">
                        <CardDescription className="text-xs">{student.email}</CardDescription>
                      </a>
                    </CardHeader>
                    <CardContent>
                      {student.specialization && <p className="text-sm text-slate-600 mb-2">{student.specialization}</p>}
                      {student.skills && student.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {student.skills.slice(0, 3).map((skill, i) => <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>)}
                          {student.skills.length > 3 && <Badge variant="outline" className="text-xs">+{student.skills.length - 3}</Badge>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </main>

        <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedStudent && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedStudent.name}</DialogTitle>
                  <a href={`mailto:${selectedStudent.email}`} className="hover:underline hover:text-cyan-700 transition-colors inline-block"><DialogDescription>{selectedStudent.email}</DialogDescription></a>
                </DialogHeader>

                <div className="space-y-4">
                  {selectedStudent.specialization && (<div><Label className="text-sm text-slate-500">Specialization</Label><p>{selectedStudent.specialization}</p></div>)}

                  {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                    <div>
                      <Label className="text-sm text-slate-500">Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedStudent.skills.map((skill, i) => (<Badge key={i} variant="secondary">{skill}</Badge>))}
                      </div>
                    </div>
                  )}

                  <Button onClick={() => { setViewingStudentProfile(true); setIsStudentDialogOpen(false); }} className="w-full bg-slate-800"><ExternalLink className="w-4 h-4 mr-2" /> View Full Profile</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}