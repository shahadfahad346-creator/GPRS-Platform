import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { IdeaDetailModal } from "./IdeaDetailModal";
import { 
  ArrowLeft, 
  User, 
  Code, 
  GraduationCap,
  Users,
  Crown,
  Sparkles,
  Award,
  Target,
  Zap,
  Briefcase,
  Mail,
  Shield,
  TrendingUp,
  Star,
  ExternalLink,
  CheckCircle,
  Trophy,
  Flame,
  Rocket,
  Heart,
  Coffee,
  Lightbulb,
  FileText,
  Download,
  Eye,
  Calendar,
  BarChart
} from "lucide-react";
import { InteractiveBackground } from "./Backgrounds";

interface StudentFullProfileProps {
  student: any;
  onBack: () => void;
  onViewMember?: (memberEmail: string) => void;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  isLeader: boolean;
}

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
      ease: "easeInOut"
    }}
  />
);

export function StudentFullProfile({ student, onBack, onViewMember }: StudentFullProfileProps) {
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);

  // Log student data for debugging team sync
  useEffect(() => {
    console.log('📊 [StudentFullProfile] Received student data:', {
      _id: student?._id,
      name: student?.name,
      email: student?.email,
      groupName: student?.groupName,
      groupMembers: student?.groupMembers,
      hasGroupData: !!(student?.groupMembers && student.groupMembers.length > 0)
    });
  }, [student]);

  const calculateCompletion = () => {
    let completed = 0;
    let total = 6;
    
    if (student?.name) completed++;
    if (student?.specialization) completed++;
    if (student?.skills && student.skills.length > 0) completed++;
    if (student?.frameworks && student.frameworks.length > 0) completed++;
    if (student?.groupName) completed++;
    if (student?.groupMembers && student.groupMembers.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();
  const leader = student?.groupMembers?.find((m: GroupMember) => m.isLeader);

  const handleViewIdea = (idea: any) => {
    setSelectedIdea(idea);
    setShowIdeaModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 relative overflow-hidden">
      <InteractiveBackground />
      
      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 0.5} />
      ))}

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-emerald-900/10 sticky top-0"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onBack}
              variant="ghost"
              className="gap-2 hover:bg-emerald-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <Badge className="bg-emerald-600 text-white">
              Student Profile - View Only
            </Badge>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-7xl mx-auto"
        >
          {/* Profile Header Card */}
          <Card className="mb-6 overflow-hidden border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 shadow-xl">
            <CardContent className="p-0">
              <div className="relative">
                {/* Banner with gradient */}
                <div className="h-32 bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-800 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    style={{
                      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                      backgroundSize: '100% 100%',
                    }}
                  />
                </div>

                {/* Profile Info */}
                <div className="relative px-8 pb-6">
                  <div className="flex flex-col md:flex-row md:items-end gap-6">
                    {/* Avatar */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="-mt-16 relative"
                    >
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-2xl border-4 border-white relative overflow-hidden group">
                        <span className="text-5xl z-10 relative">{student?.name?.charAt(0).toUpperCase()}</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          whileHover={{ scale: 1.5 }}
                        />
                      </div>
                      {leader && student._id === leader.id && (
                        <motion.div
                          initial={{ rotate: -20, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ type: "spring", delay: 0.4 }}
                          className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                        >
                          <Crown className="w-5 h-5 text-white" />
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Name and Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <motion.h1
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-3xl mb-2 text-slate-800"
                        >
                          {student?.name}
                        </motion.h1>
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex flex-wrap items-center gap-3 text-slate-600"
                        >
                          <a 
                            href={`mailto:${student?.email}`}
                            className="flex items-center gap-2 hover:text-cyan-700 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            <span className="text-sm hover:underline">{student?.email}</span>
                          </a>
                          {student?.specialization && (
                            <>
                              <span className="text-slate-300">•</span>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                <span className="text-sm">{student?.specialization}</span>
                              </div>
                            </>
                          )}
                        </motion.div>
                      </div>

                      {/* Stats Row */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-lg border border-emerald-200 shadow-sm">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Code className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Skills</p>
                            <p className="text-lg text-slate-800">{student?.skills?.length || 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-lg border border-emerald-200 shadow-sm">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Technologies</p>
                            <p className="text-lg text-slate-800">{student?.frameworks?.length || 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-lg border border-emerald-200 shadow-sm">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Ideas Analyzed</p>
                            <p className="text-lg text-slate-800">{student?.savedIdeas?.length || 0}</p>
                          </div>
                        </div>

                        {student?.groupMembers && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-lg border border-emerald-200 shadow-sm">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Team Size</p>
                              <p className="text-lg text-slate-800">{student?.groupMembers?.length || 0}</p>
                            </div>
                          </div>
                        )}
                        {/* === الفكرة المتفق عليها في Stats === */}
  {student?.savedIdeas?.some((idea: any) => idea.is_agreed) && (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-lg border border-emerald-200 shadow-sm">
      <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500">Agreed Project</p>
        <p className="text-lg text-slate-800">1</p>
      </div>
    </div>
  )}
                      </motion.div>
                    </div>

                    {/* Profile Completion */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.6 }}
                      className="flex flex-col items-center gap-2 px-6 py-4 bg-white/80 backdrop-blur rounded-xl border-2 border-emerald-200 shadow-lg"
                    >
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-slate-200"
                          />
                          <motion.circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={226.19}
                            strokeDashoffset={226.19 - (226.19 * completion) / 100}
                            className="text-emerald-600"
                            initial={{ strokeDashoffset: 226.19 }}
                            animate={{ strokeDashoffset: 226.19 - (226.19 * completion) / 100 }}
                            transition={{ duration: 1, delay: 0.8 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl text-slate-800">{completion}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 text-center">Profile Complete</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur border-2 border-emerald-200 p-1 h-auto">
                <TabsTrigger 
                  value="personal" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white gap-2 py-3"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Personal Info</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="skills" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white gap-2 py-3"
                >
                  <Code className="w-4 h-4" />
                  <span className="hidden sm:inline">Skills</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="group" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white gap-2 py-3"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Team</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ideas" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white gap-2 py-3"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span className="hidden sm:inline">Ideas</span>
                </TabsTrigger>
              </TabsList>

              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-6 md:grid-cols-2"
                >
                  {/* Name Card */}
                  <Card className="border-2 border-emerald-200 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-500 mb-1">Full Name</p>
                          <p className="text-lg text-slate-800 truncate">{student?.name || 'Not provided'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Card */}
                  <Card className="border-2 border-blue-200 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shrink-0">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-500 mb-1">University Email</p>
                          <p className="text-lg text-slate-800 truncate">{student?.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Specialization Card */}
                  <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow md:col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shrink-0">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 mb-2">Specialization</p>
                          {student?.specialization ? (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-base px-4 py-1">
                              {student?.specialization}
                            </Badge>
                          ) : (
                            <p className="text-slate-400">Not specified</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Info */}
                  <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow md:col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shrink-0">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 mb-1">Account Created</p>
                          {student?.createdAt ? (
                            <p className="text-lg text-slate-800">
                              {new Date(student.createdAt).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          ) : (
                            <p className="text-slate-400">Not available</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-6"
                >
                  {/* Technical Skills Card */}
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-blue-50/20 backdrop-blur overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                          <Code className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl text-slate-800">Technical Skills</h3>
                          <p className="text-sm text-slate-600">{student?.skills?.length || 0} skills mastered</p>
                        </div>
                      </div>

                      {student?.skills && student.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {student.skills.map((skill: string, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300 px-4 py-2 text-sm hover:bg-blue-200 transition-colors">
                                {skill}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Code className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-400">No skills listed yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Frameworks & Technologies Card */}
                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-white via-purple-50/30 to-purple-50/20 backdrop-blur overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl text-slate-800">Frameworks & Technologies</h3>
                          <p className="text-sm text-slate-600">{student?.frameworks?.length || 0} technologies known</p>
                        </div>
                      </div>

                      {student?.frameworks && student.frameworks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {student.frameworks.map((framework: string, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Badge className="bg-purple-100 text-purple-800 border-purple-300 px-4 py-2 text-sm hover:bg-purple-200 transition-colors">
                                {framework}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-400">No frameworks listed yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Group Tab */}
              <TabsContent value="group" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-2 border-teal-200 bg-gradient-to-br from-white via-teal-50/30 to-teal-50/20 backdrop-blur overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl text-slate-800">Project Team</h3>
                          {student?.groupName ? (
                            <p className="text-sm text-slate-600">{student.groupName}</p>
                          ) : (
                            <p className="text-sm text-slate-400">No group assigned</p>
                          )}
                        </div>
                        {student?.groupMembers && student.groupMembers.length > 0 && (
                          <Badge className="bg-teal-600 text-white text-base px-4 py-1">
                            {student.groupMembers.length} Members
                          </Badge>
                        )}
                      </div>

                      {student?.groupMembers && student.groupMembers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {student.groupMembers.map((member: GroupMember, index: number) => (
                            <motion.div
                              key={member.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card 
                                className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer group relative ${
                                  member.isLeader 
                                    ? 'border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400' 
                                    : 'border-2 border-slate-200 bg-white hover:border-teal-300'
                                }`}
                                onClick={() => {
                                  if (onViewMember && member.email) {
                                    console.log('🖱️ [StudentFullProfile] Clicked on member:', member.email);
                                    onViewMember(member.email);
                                  }
                                }}
                                title={onViewMember ? `Click to view ${member.name}'s full profile` : ''}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white relative group-hover:scale-110 transition-transform ${
                                      member.isLeader 
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                                        : 'bg-gradient-to-br from-slate-600 to-slate-700'
                                    }`}>
                                      <span className="text-lg z-10">{member.name.charAt(0).toUpperCase()}</span>
                                      {member.isLeader && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          transition={{ type: "spring", delay: 0.3 }}
                                          className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white"
                                        >
                                          <Crown className="w-3 h-3 text-white" />
                                        </motion.div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm text-slate-800 truncate">{member.name}</p>
                                        {member.isLeader && (
                                          <Badge className="bg-amber-500 text-white text-xs px-2 py-0">
                                            Leader
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-400 mb-2">No team members added</p>
                          <p className="text-sm text-slate-400">Student hasn't formed a team yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Ideas Tab */}
              <TabsContent value="ideas" className="mt-6">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
  >
    <Card className="border-2 border-emerald-200 bg-white/90 backdrop-blur">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-600" />
            Project Ideas
          </h3>
          {student?.savedIdeas && (
            <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-800">
              {student.savedIdeas.length} Ideas
            </Badge>
          )}
        </div>

        {student?.savedIdeas && student.savedIdeas.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {student.savedIdeas.map((idea: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`border-2 transition-all hover:shadow-lg group cursor-pointer ${
                    idea.is_agreed 
                      ? 'border-emerald-500 bg-emerald-50/30 shadow-lg' 
                      : 'border-amber-100 hover:border-amber-300'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h4 className={`flex-1 font-semibold group-hover:text-emerald-700 transition-colors ${
                        idea.is_agreed ? 'text-emerald-800' : 'text-slate-800'
                      }`}>
                        {idea.title || `Project Idea #${index + 1}`}
                      </h4>
                      {idea.category && (
                        <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-800 shrink-0">
                          {idea.category}
                        </Badge>
                      )}
                    </div>

                    {/* === علامة الاتفاق === */}
                    {idea.is_agreed && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Agreed Project
                        </div>
                      </div>
                    )}

                    {idea.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {idea.description}
                      </p>
                    )}

                    {idea.requiredSkills && idea.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b border-amber-100">
                        {idea.requiredSkills.slice(0, 3).map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs bg-slate-50">
                            {skill}
                          </Badge>
                        ))}
                        {idea.requiredSkills.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-slate-100">
                            +{idea.requiredSkills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => handleViewIdea(idea)}
                      variant="ghost"
                      size="sm"
                      className={`w-full gap-2 ${
                        idea.is_agreed 
                          ? 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100' 
                          : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      View Full Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No ideas analyzed yet</p>
            <p className="text-sm text-slate-400">Student hasn't analyzed any project ideas</p>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
</TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>

      {/* Idea Detail Modal */}
      {showIdeaModal && selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          isOpen={showIdeaModal}  
          onClose={() => {
            setShowIdeaModal(false);
            setSelectedIdea(null);
          }}
        />
      )}
    </div>
  );
}
