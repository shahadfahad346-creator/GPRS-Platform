import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useAuth } from "../../Frontend/lib/auth-context";
import {
  ArrowLeft,
  User,
  BookOpen,
  FileText,
  Briefcase,
  Mail,
  Lightbulb,
  Loader2,
  Calendar,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { InteractiveBackground } from "./Backgrounds";
import { useLocation, useNavigate } from "react-router-dom";

interface ResearchPaper {
  title: string;
  platform: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface SupervisorData {
  _id: string;
  name: string;
  email?: string;
  department?: string;
  researchInterests?: string[];
  publications?: number;
  activeProjects?: number;
  researchPapers?: ResearchPaper[];
  ideas?: Idea[];
}

export function SupervisorProfile({ onBack }: { onBack: () => void }) {
  const { user: authUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const supervisorId = location.state?.supervisorId;

  const [supervisor, setSupervisor] = useState<SupervisorData | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to ensure array
  const ensureArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return typeof value === "string" ? [value] : [];
  };

// في SupervisorProfile.tsx - عدّل useEffect فقط:

useEffect(() => {
  const fetchSupervisorData = async () => {
    if (!supervisorId) {
      console.error("❌ No supervisor ID provided");
      toast.error("Invalid supervisor ID");
      navigate(-1);
      return;
    }

    try {
      setLoading(true);
      console.log("📡 Fetching supervisor profile for ID:", supervisorId);

      const response = await fetch(
        `http://localhost:5000/api/supervisor/full-profile/${supervisorId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("📥 Response status:", response.status);
      
      // اقرأ الـ response كـ text أولاً عشان نشوف المشكلة
      const text = await response.text();
      console.log("📄 Response text:", text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("❌ Failed to parse JSON:", e);
        throw new Error("Server returned invalid response");
      }

      console.log("✅ Parsed data:", data);

      if (data.success && data.supervisor) {
        console.log("✅ Supervisor found:", data.supervisor.name);
        console.log("📚 Ideas count:", data.supervisor.ideas?.length || 0);
        console.log("📄 Papers count:", data.supervisor.researchPapers?.length || 0);
        
        setSupervisor(data.supervisor);
        setIdeas(data.supervisor.ideas || []);
      } else {
        console.error("❌ Invalid response structure:", data);
        throw new Error(data.error || "Supervisor not found");
      }
    } catch (error: any) {
      console.error("❌ Fetch error:", error);
      console.error("❌ Error message:", error.message);
      toast.error(`Failed to load supervisor: ${error.message}`);
      // لا ترجع للخلف مباشرة، خلي المستخدم يشوف الرسالة
      setTimeout(() => navigate(-1), 2000);
    } finally {
      setLoading(false);
    }
  };

  fetchSupervisorData();
}, [supervisorId, navigate]);
  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <Toaster position="top-right" richColors />
        <InteractiveBackground />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center z-10">
          <Loader2 size={48} className="text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading supervisor profile...</p>
        </motion.div>
      </div>
    );
  }

  // Not Found State
  if (!supervisor) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <Toaster position="top-right" richColors />
        <InteractiveBackground />
        <div className="text-center z-10">
          <p className="text-red-600 text-xl">Supervisor not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden custom-scrollbar">
      <Toaster position="top-right" richColors />
      <InteractiveBackground />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-emerald-900/10 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="hover:bg-emerald-900/5">
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <h1 className="text-2xl bg-gradient-to-r from-emerald-900 to-teal-700 bg-clip-text text-transparent">
              Supervisor Profile
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/90 backdrop-blur-xl border-2 border-emerald-900/10 shadow-2xl overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className="relative">
                    <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-900 p-1 shadow-2xl">
                      <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                        <User size={80} className="text-emerald-800" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl mb-3 bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-800 bg-clip-text text-transparent">
                      {supervisor.name}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-slate-600 mb-4">
                      {supervisor.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          <a href={`mailto:${supervisor.email}`} className="hover:text-emerald-700">
                            {supervisor.email}
                          </a>
                        </div>
                      )}
                      {supervisor.department && (
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} />
                          <span>{supervisor.department}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} />
                        <span>{supervisor.publications || 0} Publications</span>
                      </div>
                    </div>

                    {/* Research Interests Section */}
                    {supervisor.researchInterests && supervisor.researchInterests.length > 0 && (
                      <div className="mt-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-3">Research Interests</h2>
                        <div className="flex flex-wrap gap-2">
                          {supervisor.researchInterests.map((interest, i) => (
                            <Badge key={i} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

         {/* Research Publications */}
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
  <Card className="bg-white/90 backdrop-blur-xl border-2 border-emerald-900/10 shadow-xl">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg">
          <Lightbulb size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl bg-gradient-to-r from-emerald-900 to-teal-700 bg-clip-text text-transparent">
            Research Publications
          </h2>
          <p className="text-xs text-slate-500">
            {supervisor.researchPapers?.length || 0} publications added
          </p>
        </div>
      </div>

      <Separator className="mb-6" />

      <div className="space-y-3">
        {supervisor.researchPapers && supervisor.researchPapers.length > 0 ? (
          supervisor.researchPapers.map((paper: ResearchPaper, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-emerald-900 font-medium text-lg">{paper.title}</h3>
                <p className="text-sm text-slate-600">{paper.platform}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText size={64} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No publications added yet</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</motion.div>


          {/* Research Ideas */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white/90 backdrop-blur-xl border-2 border-emerald-900/10 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg">
                    <Lightbulb size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl bg-gradient-to-r from-emerald-900 to-teal-700 bg-clip-text text-transparent">
                      Research Ideas
                    </h2>
                    <p className="text-xs text-slate-500">{ideas.length} proposed project ideas</p>
                  </div>
                </div>

                <Separator className="mb-6" />

                <div className="space-y-3">
                  {ideas.length > 0 ? (
                    ideas.map((idea, index) => (
                      <motion.div
                        key={idea.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-between"
                        onClick={() => setSelectedIdea(idea)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md">
                            <Lightbulb size={20} />
                          </div>
                          <h3 className="text-emerald-900 font-medium text-lg">{idea.title}</h3>
                        </div>
                        <Badge variant="outline" className="border-emerald-400 text-emerald-700">
                          {idea.category}
                        </Badge>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Lightbulb size={64} className="text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No ideas proposed yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Idea Details Modal */}
      <AnimatePresence>
        {selectedIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIdea(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Lightbulb className="w-9 h-9 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-emerald-900 mb-2">
                      {selectedIdea.title}
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      {selectedIdea.category}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedIdea(null)}
                  className="hover:bg-slate-100"
                >
                  <X size={24} />
                </Button>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-3">Full Description</h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-200">
                    {selectedIdea.description || "No detailed description provided."}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}