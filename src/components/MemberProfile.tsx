import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { InteractiveBackground } from "./Backgrounds";
import { 
  ArrowLeft, 
  User, 
  Code, 
  GraduationCap,
  Briefcase,
  Mail,
  Award,
  Star,
  Crown,
  TrendingUp,
  Loader2
} from "lucide-react";
import { Toaster, toast } from "sonner";

interface MemberProfileProps {
  member: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    isLeader?: boolean;
    specialization?: string;
    skills?: string[];
    frameworks?: string[];
  };
  onBack: () => void;
}

export function MemberProfile({ member: initialMember, onBack }: MemberProfileProps) {
  const [member, setMember] = useState(initialMember);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        console.log('🔍 [MemberProfile] Fetching data for:', initialMember.email);
        
        const response = await fetch('http://localhost:3000/auth/get-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: initialMember.email })
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
          console.log('✅ [MemberProfile] Full data loaded:', data.user);
          setMember({
            ...initialMember,
            ...data.user,
            _id: data.user._id || initialMember._id,
            id: data.user._id || initialMember.id,
            skills: data.user.skills || [],
            frameworks: data.user.frameworks || [],
            specialization: data.user.specialization || initialMember.specialization
          });
        } else {
          throw new Error(data.message || 'Failed to fetch member data');
        }
      } catch (error) {
        console.error('❌ [MemberProfile] Error fetching member data:', error);
        toast.error('Failed to load member data', {
          description: 'An error occurred while fetching the details'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [initialMember.email]);

  if (loading) {
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
          <p className="text-slate-600">Loading member profile..</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Toaster position="top-right" richColors />
      {/* Interactive Background */}
      <InteractiveBackground />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-emerald-900/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="hover:bg-emerald-900/5 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to profile
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <Card className="bg-white/80 backdrop-blur-xl border-2 border-emerald-900/10 shadow-2xl shadow-emerald-500/5 overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
            
            <CardContent className="p-8 md:p-12 relative">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-900 p-1 shadow-2xl shadow-emerald-500/20">
                    <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center relative overflow-hidden group">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-emerald-400/0"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="text-5xl text-emerald-800 relative z-10">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <div className="flex-1 text-center md:text-left">
                  <motion.h1 
                    className="text-4xl md:text-5xl mb-3 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {member.name}
                  </motion.h1>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4"
                  >
                    {member.isLeader && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 shadow-lg">
                        <Crown className="w-4 h-4 mr-2" />
                        Group leader
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-emerald-800 text-emerald-900 px-4 py-2">
                      <Mail className="w-4 h-4 mr-2" />
                      {member.email}
                    </Badge>
                    {member.specialization && (
                      <Badge variant="outline" className="border-teal-700 text-teal-800 px-4 py-2">
                        <Briefcase className="w-4 h-4 mr-2" />
                        {member.specialization}
                      </Badge>
                    )}
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Section */}
          {(member.skills || member.frameworks) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border-2 border-emerald-900/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center shadow-lg">
                      <Code className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl bg-gradient-to-r from-emerald-900 to-slate-800 bg-clip-text text-transparent">
                      Skills and technologies
                    </h2>
                  </div>

                  <Separator className="mb-6 bg-emerald-900/20" />

                  <div className="space-y-6">
                    {member.skills && member.skills.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-sm text-slate-600 flex items-center gap-2">
                          <Star className="w-4 h-4 text-emerald-700" />
                          Technical skills
                          <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-800 text-xs">
                            {member.skills.length} skills
                          </Badge>
                        </label>
                        <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl border border-emerald-900/20">
                          <div className="flex flex-wrap gap-2">
                            {member.skills.map((skill, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.1, y: -2 }}
                              >
                                <Badge className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-md hover:shadow-lg transition-all cursor-default px-3 py-1.5">
                                  {skill}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {member.frameworks && member.frameworks.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-sm text-slate-600 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-teal-700" />
                          Frameworks and tools
                          <Badge variant="secondary" className="ml-auto bg-teal-100 text-teal-800 text-xs">
                            {member.frameworks.length} tools
                          </Badge>
                        </label>
                        <div className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-xl border border-teal-900/20">
                          <div className="flex flex-wrap gap-2">
                            {member.frameworks.map((framework, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.1, y: -2 }}
                              >
                                <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md hover:shadow-lg transition-all cursor-default px-3 py-1.5">
                                  {framework}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}