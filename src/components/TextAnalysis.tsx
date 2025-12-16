import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  ArrowLeft, Sparkles, Loader2, CheckCircle2, AlertCircle, 
  TrendingUp, Users as UsersIcon, Lightbulb, AlertTriangle,
  Target, Award, BookOpen, Zap, Save, XCircle, CheckCircle, 
  TrendingDown, Info
} from "lucide-react";
import { InteractiveBackground } from "./Backgrounds";
import { useAuth } from '../../frontend/lib/auth-context';
import { toast } from "sonner";
import { apiClient } from "../../frontend/api-fastapi";
import { ExternalLink,  } from "lucide-react";

interface CourseLinkProps {
  skill: string;
  language: string;
  showOnlyIfNoArabic?: boolean;
}
const FLASK_API_URL = 'http://localhost:5000/api';
//شهد 
//نوره

interface TextAnalysisProps {
  onBack: () => void;
}

interface AnalysisResult {
  score: number;
  id: string;
  message: string;
  stage_1_initial_analysis: {
    Project_Title: string;
    Executive_Summary: string;
    Domain: {
      General_Domain: string;
      Technical_Domain: string;
    };
    Required_Skills: {
      Skills: string[];
      Matches: string[];
      Gaps: string[];
      Match_Percentage?: number;
    };
    SWOT_Analysis: {
      Strengths: string[];
      Weaknesses: string[];
      Opportunities: string[];
      Threats: string[];
    };
    Target_Audience: {
      Primary: string[];
      Secondary: string[];
    };
  };
  stage_2_extended_analysis: {
    Supervisors: Array<{
      Name: string;
      Department: string;
      Email: string;
      Justification: string;
    }>;
    Similar_Projects: Array<{
      Title: string;
      Year: number;
      Department: string;
      Relevance: string;
    }>;
    Improvements: string[];
    Final_Proposal: {
      Summary: string;
    };
  };
  similar_projects: Array<{
    title: string;
    abstract: ReactNode;
    project_title: string;
    department: string;
    year: number;
    similarity_score: number;
  }>;
  recommended_supervisors: Array<{
    name: string;
    email: string;
    department: string;
    research_match_score: number;
  }>;
  skills_analysis?: {
    matched_skills: string[];
    gap_skills: string[];
    match_percentage: number;
  };
}

export function TextAnalysis({ onBack }: TextAnalysisProps) {
  const { user, isAuthenticated } = useAuth();
  const [projectIdea, setProjectIdea] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ إصلاح المهارات: تحويلها إلى مصفوفة بدلاً من نص
  const studentSkills = user?.skills || [];
  const studentSpecialization = user?.specialization || "Not Specified";

  const handleAnalyze = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to analyze your idea.");
      return;
    }

    if (!projectTitle || !projectIdea) {
      toast.error("Please enter both project title and description.");
      return;
    }

    // 🔍 طباعة للتحقق من المهارات قبل الإرسال
    console.log("📊 [TextAnalysis] Student Skills before sending:", studentSkills);
    console.log("📊 [TextAnalysis] Skills type:", typeof studentSkills, Array.isArray(studentSkills));
    console.log("📊 [TextAnalysis] Skills count:", studentSkills.length);

    setAnalyzing(true);
    setError(null);
    setResult(null);
    setIsSaved(false);

    try {
      console.log("📊 Sending to FastAPI for analysis...");
      
      const requestPayload = {
        title: projectTitle,
        description: projectIdea,
        technologies: technologies ? technologies.split(",").map(t => t.trim()) : [],
        student_id: user._id,
        email: user.email,
        specialization: studentSpecialization,
        skills: studentSkills, // ✅ إرسال المصفوفة الصحيحة
        language: "en",
      };

      // 🔍 طباعة الـ Payload الكامل
      console.log("📤 [TextAnalysis] Full Request Payload:", JSON.stringify(requestPayload, null, 2));

      const analysisResponse = await apiClient.post<AnalysisResult>("/analysis/analyze", requestPayload);

      console.log("✅ [TextAnalysis] Analysis Response:", analysisResponse.data);
      setResult(analysisResponse.data);
      toast.success("Analysis completed successfully!");

    } catch (err: any) {
      console.error("❌ Analysis error:", err);
      setError(err.response?.data?.detail || "Failed to analyze idea. Please try again.");
      toast.error(err.response?.data?.detail || "Failed to analyze idea.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveIdea = async () => {
    if (!result || !user) return;

    setSaving(true);
    try {
      console.log("💾 Saving idea to Flask...");
      const saveResponse = await fetch(`${FLASK_API_URL}/students/profile/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          idea: {
            id: result.id || '',
            message: result.message || '',
            title: projectTitle || 'Untitled Project',
            description: projectIdea || 'No description provided',
            keywords: Array.isArray(result.stage_1_initial_analysis?.Required_Skills?.Skills)
              ? result.stage_1_initial_analysis.Required_Skills.Skills
              : [],
            status: 'Analyzed',
            score: result.score || 85,
            strengths: Array.isArray(result.stage_1_initial_analysis?.SWOT_Analysis?.Strengths)
              ? result.stage_1_initial_analysis.SWOT_Analysis.Strengths
              : [],
            weaknesses: Array.isArray(result.stage_1_initial_analysis?.SWOT_Analysis?.Weaknesses)
              ? result.stage_1_initial_analysis.SWOT_Analysis.Weaknesses
              : [],
            opportunities: Array.isArray(result.stage_1_initial_analysis?.SWOT_Analysis?.Opportunities)
              ? result.stage_1_initial_analysis.SWOT_Analysis.Opportunities
              : [],
            threats: Array.isArray(result.stage_1_initial_analysis?.SWOT_Analysis?.Threats)
              ? result.stage_1_initial_analysis.SWOT_Analysis.Threats
              : [],
            stage_1_initial_analysis: result.stage_1_initial_analysis,
            stage_2_extended_analysis: result.stage_2_extended_analysis,
            similar_projects: result.similar_projects || [],
            recommendedSupervisors: result.recommended_supervisors || [],
            date: new Date().toISOString(),
          },
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.error || 'Failed to save idea');
      }

      console.log("✅ Idea saved successfully!");
      toast.success("Idea saved to your profile!");
      setIsSaved(true);
    } catch (saveError: any) {
      console.error("❌ Failed to save idea to profile:", saveError);
      toast.error("Failed to save idea to profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    toast.info("Analysis not saved");
    setResult(null);
    setProjectIdea("");
    setProjectTitle("");
    setTechnologies("");
    setIsSaved(false);
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setProjectIdea("");
    setProjectTitle("");
    setTechnologies("");
    setIsSaved(false);
    setError(null);
  };

  // 🆕 دالة لحساب حالة الجاهزية
  const getReadinessStatus = (percentage: number) => {
    if (percentage >= 80) return { 
      label: 'Excellent Readiness', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200',
      icon: CheckCircle 
    };
    if (percentage >= 60) return { 
      label: 'Good Preparation', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200',
      icon: TrendingUp 
    };
    if (percentage >= 40) return { 
      label: 'Learning Required', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      icon: AlertTriangle 
    };
    return { 
      label: 'High Learning Curve', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-200',
      icon: TrendingDown 
    };
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <InteractiveBackground />
      <main className="container mx-auto px-4 py-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="hover:bg-emerald-900/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hub
          </Button>

          {/* Title Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-900/10 to-slate-700/10 text-emerald-900 px-4 py-2 rounded-full mb-4 border border-emerald-800/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">AI-Powered Analysis</span>
            </div>
            <h1 className="text-4xl md:text-5xl mb-4 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent">
              Smart Analysis
            </h1>
            <p className="text-lg text-slate-600">
              Enter your project idea and get comprehensive AI-powered insights
            </p>
            {user && (
              <p className="text-sm text-emerald-800 mt-2">
                {/* ✅ عرض عدد المهارات */}
                Analyzing as: {user.name || user.email} | Skills: {studentSkills.length}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-2 border-red-300 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">Error</p>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Input Section */}
          {!result && (
            <Card className="border-2 border-emerald-900/10 shadow-lg mb-8">
              <CardHeader>
                <CardTitle>Describe Your Project Idea</CardTitle>
                <CardDescription>
                  Provide a detailed description of your graduation project idea (minimum 20 words)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={projectTitle}
                    onChange={(e) => {
                      setProjectTitle(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g., AI-Powered Credit Card Fraud Detection System"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={analyzing}
                  />
                </div>
                <div>
                  <label htmlFor="idea" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Idea
                  </label>
                  <Textarea
                    id="idea"
                    placeholder="Example: I want to build an AI-powered healthcare diagnosis system that uses machine learning to analyze medical images..."
                    value={projectIdea}
                    onChange={(e) => {
                      setProjectIdea(e.target.value);
                      setError(null);
                    }}
                    className="min-h-[200px] border-emerald-900/20 focus:border-emerald-800"
                    disabled={analyzing}
                  />
                  <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
                    <span>
                      {projectIdea.trim().split(/\s+/).filter(Boolean).length} / 20 words minimum
                    </span>
                    {projectIdea.trim().split(/\s+/).filter(Boolean).length >= 20 && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={!projectIdea.trim() || !projectTitle.trim() || analyzing || !isAuthenticated || !user}
                  className="w-full text-lg py-6 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-slate-800 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing your idea... (this may take 30-60 seconds)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analyze Project
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Analysis Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-6 h-6 text-amber-500" />
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Executive Summary */}
                    {result.stage_1_initial_analysis?.Executive_Summary && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border-2 border-blue-200">
                        <h3 className="font-semibold text-lg text-blue-900 mb-3 flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          Executive Summary
                        </h3>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                          {result.stage_1_initial_analysis.Executive_Summary}
                        </p>
                      </div>
                    )}

                    {/* Domain */}
                    {result.stage_1_initial_analysis?.Domain && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border-2 border-green-200">
                        <h3 className="font-semibold text-lg text-green-900 mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Domain
                        </h3>
                        <p className="text-slate-800">
                          <strong>General:</strong> {result.stage_1_initial_analysis.Domain.General_Domain}
                        </p>
                        <p className="text-slate-800">
                          <strong>Technical:</strong> {result.stage_1_initial_analysis.Domain.Technical_Domain}
                        </p>
                      </div>
                    )}

               {/* === Technical Readiness Evaluation - Formal, Calm, Academic === */} 
{result.stage_1_initial_analysis?.Required_Skills?.Skills?.length > 0 && (() => {
  const allSkills = result.stage_1_initial_analysis.Required_Skills.Skills || [];
  const matchedSkills = result.stage_1_initial_analysis.Required_Skills.Matches || [];
  const gapSkills = result.stage_1_initial_analysis.Required_Skills.Gaps || [];
  const matchPercentage = result.stage_1_initial_analysis.Required_Skills.Match_Percentage ||
    (allSkills.length > 0 ? (matchedSkills.length / allSkills.length) * 100 : 0);

  const getReadinessStatus = (percentage: number) => {
    if (percentage >= 80) return { 
      label: 'Excellent', 
      color: '#166534', 
      bgColor: '#F0FDF4', 
      borderColor: '#BBF7D0',
      icon: CheckCircle 
    };
    if (percentage >= 60) return { 
      label: 'Good', 
      color: '#1E40AF', 
      bgColor: '#EFF6FF', 
      borderColor: '#BFDBFE',
      icon: TrendingUp 
    };
    if (percentage >= 40) return { 
      label: 'Requires Learning', 
      color: '#92400E', 
      bgColor: '#FFFBEB', 
      borderColor: '#FEF3C7',
      icon: AlertTriangle 
    };
    return { 
      label: 'High Learning Curve', 
      color: '#991B1B', 
      bgColor: '#FEF2F2', 
      borderColor: '#FECACA',
      icon: TrendingDown 
    };
  };

  const status = getReadinessStatus(matchPercentage);
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
    >
      {/* Title + Percentage */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Zap className="w-5 h-5" style={{ color: '#6B7280' }} />
          Technical Readiness Evaluation
        </h3>
        <div className="text-3xl font-bold" style={{ color: status.color }}>
          {matchPercentage.toFixed(0)}%
        </div>
      </div>

      {/* Status + Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <StatusIcon className="w-6 h-6" style={{ color: status.color }} />
          <div>
            <p className="font-medium" style={{ color: status.color }}>{status.label}</p>
            <p className="text-sm text-slate-600">
              {matchedSkills.length} out of {allSkills.length} skills available
            </p>
          </div>
        </div>

        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${matchPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ 
              backgroundColor: status.color,
            }}
          />
        </div>
      </div>

      {/* Matched + Missing Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Matched Skills */}
        {matchedSkills.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5" style={{ color: '#166534' }} />
              <h4 className="font-medium text-slate-800">
                Available Skills ({matchedSkills.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {gapSkills.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5" style={{ color: '#991B1B' }} />
              <h4 className="font-medium text-slate-800">
                Skills to Learn ({gapSkills.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {gapSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All Skills */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-5">
        <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5" style={{ color: '#6B7280' }} />
          All Required Skills ({allSkills.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {allSkills.map((skill, i) => {
            const isMatched = matchedSkills.includes(skill);
            return (
              <span
                key={i}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  isMatched
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}
              >
                {isMatched ? 'Check' : 'Close'} {skill}
              </span>
            );
          })}
        </div>
      </div>

      {/* Learning Tips */}
      {gapSkills.length > 0 && (
        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4" style={{ color: '#1E40AF' }} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 mb-2">Learning Recommendations</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                {gapSkills.length >= 5 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>High Learning Curve:</strong> Allocate {Math.ceil(gapSkills.length / 2)}–{gapSkills.length} weeks</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Start with:</strong> {gapSkills.slice(0, 2).join(', ')}{gapSkills.length > 2 ? `, then ${gapSkills[2]}` : ''}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Collaborate:</strong> Find a student experienced in {gapSkills[0]}</span>
                </li>
                {matchPercentage < 50 && (
                  <li className="flex items-start gap-2 text-red-700">
                    <span className="mt-0.5">Warning</span>
                    <span><strong>Schedule Impact:</strong> Expect a 20–30% delay</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* مربع روابط المنصات التعليمية - النسخة الصحيحة داخل النطاق */}
{gapSkills.length > 0 && (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200 mt-6">
    <div className="flex items-center gap-2 mb-4">
      <BookOpen className="w-6 h-6 text-blue-700" />
      <h4 className="font-semibold text-lg text-slate-800">
        منصات تعليمية موصى بها
      </h4>
    </div>
    <p className="text-sm text-slate-600 mb-4">
      يمكنك تعلم المهارات الناقصة من خلال هذه المنصات التعليمية الموثوقة:
    </p>

    {/* المنصات العربية */}
    <div className="mb-5">
      <h5 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
        <span className="text-lg">Saudi Arabia Flag</span>
        منصات عربية
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <a href="https://tuwaiq.edu.sa/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">أكاديمية طويق</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://maharattech.sa/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">مهارات من Google</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://academy.hsoub.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">أكاديمية حسوب</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://www.rwaq.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">رواق</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://www.edraak.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">إدراك</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://www.doroob.sa/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">دروب</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
      </div>
    </div>

    {/* المنصات العالمية */}
    <div>
      <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
        <span className="text-lg">World</span>
        منصات عالمية
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <a href="https://www.coursera.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">Coursera</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.udemy.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">Udemy</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.edx.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">edX</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.khanacademy.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">Khan Academy</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.linkedin.com/learning/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">LinkedIn Learning</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.udacity.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">Udacity</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
      </div>
    </div>

    <div className="mt-4 bg-blue-100/50 rounded-lg p-3 border border-blue-300">
      <p className="text-sm text-blue-900">
        Tip: <strong>نصيحة:</strong> ابدأ بالمنصات العربية للمفاهيم الأساسية، ثم انتقل للمنصات العالمية للتخصص المتقدم.
      </p>
    </div>
  </div>
)}
    </motion.div>
  );
 
  
})()}
                  
                    {/* SWOT Analysis */}
                    {result.stage_1_initial_analysis?.SWOT_Analysis && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-5 rounded-lg border-2 border-amber-200">
                        <h3 className="font-semibold text-lg text-amber-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          SWOT Analysis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/80 rounded-lg p-3 border border-green-200">
                            <p className="font-semibold text-green-900 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Strengths
                            </p>
                            <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                              {result.stage_1_initial_analysis.SWOT_Analysis.Strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white/80 rounded-lg p-3 border border-red-200">
                            <p className="font-semibold text-red-900 mb-2 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              Weaknesses
                            </p>
                            <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                              {result.stage_1_initial_analysis.SWOT_Analysis.Weaknesses.map((w, i) => (
                                <li key={i}>{w}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white/80 rounded-lg p-3 border border-blue-200">
                            <p className="font-semibold text-blue-900 mb-2 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Opportunities
                            </p>
                            <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                              {result.stage_1_initial_analysis.SWOT_Analysis.Opportunities.map((o, i) => (
                                <li key={i}>{o}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white/80 rounded-lg p-3 border border-yellow-200">
                            <p className="font-semibold text-yellow-900 mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              Threats
                            </p>
                            <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                              {result.stage_1_initial_analysis.SWOT_Analysis.Threats.map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Target Audience */}
                    {result.stage_1_initial_analysis?.Target_Audience && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border-2 border-blue-200">
                        <h3 className="font-semibold text-lg text-blue-900 mb-3 flex items-center gap-2">
                          <UsersIcon className="w-5 h-5" />
                          Target Audience
                        </h3>
                        <p className="text-slate-800">
                          <strong>Primary:</strong> {result.stage_1_initial_analysis.Target_Audience.Primary.join(", ")}
                        </p>
                        <p className="text-slate-800">
                          <strong>Secondary:</strong> {result.stage_1_initial_analysis.Target_Audience.Secondary.join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Recommended Supervisors */}
                    {result.stage_2_extended_analysis?.Supervisors?.length > 0 && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border-2 border-green-200">
                        <h3 className="font-semibold text-lg text-green-900 mb-3 flex items-center gap-2">
                          <UsersIcon className="w-5 h-5" />
                          Recommended Supervisors
                        </h3>
                        <ul className="space-y-3">
                          {result.stage_2_extended_analysis.Supervisors.map((supervisor, i) => (
                            <li key={i} className="bg-white/80 rounded-lg p-4 border border-green-200">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className="font-semibold text-slate-900">{supervisor.Name}</span>
                                  <p className="text-sm text-slate-600">{supervisor.Department}</p>
                                </div>
                                <Badge className="bg-green-600 text-white">
                                  #{i + 1}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-700 mb-2 leading-relaxed">{supervisor.Justification}</p>
                              <a
                                href={`mailto:${supervisor.Email}`}
                                className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center gap-1"
                              >
                                📧 {supervisor.Email}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Similar Projects */}
                    {result.similar_projects?.length > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border-2 border-purple-200">
                        <h3 className="font-semibold text-lg text-purple-900 mb-3 flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          Similar Projects
                        </h3>

                        <ul className="space-y-3">
                          {result.similar_projects.map((qdrantProject, i) => {
                            const qTitle = (qdrantProject.title || "").trim().toLowerCase().replace(/[^\w\s]/g, '');
                            const qYear = qdrantProject.year;
                            const qDept = (qdrantProject.department || "").trim().toLowerCase();

                            const geminiProject = result.stage_2_extended_analysis?.Similar_Projects?.find(p => {
                              const gTitle = (p.Title || "").trim().toLowerCase().replace(/[^\w\s]/g, '');
                              const gYear = p.Year;
                              const gDept = (p.Department || "").trim().toLowerCase();

                              const qWords = qTitle.split(" ").filter(w => w.length > 2);
                              const gWords = gTitle.split(" ").filter(w => w.length > 2);
                              const commonWords = qWords.filter(w => gWords.includes(w));
                              const wordMatch = commonWords.length >= 2;

                              const yearMatch = !gYear || !qYear || gYear == qYear;
                              const deptMatch = !gDept || !qDept || gDept.includes(qDept) || qDept.includes(gDept);

                              return wordMatch && yearMatch && deptMatch;
                            });

                            const relevance = geminiProject?.Relevance || 
                                             result.stage_2_extended_analysis?.Similar_Projects?.[i]?.Relevance ||
                                             "There is no analytical assessment available.";

                            return (
                              <li key={i} className="bg-white/80 rounded-lg p-4 border border-purple-200">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-semibold text-slate-900 flex-1">{qdrantProject.title}</span>
                                  <div className="flex gap-2 ml-2">
                                    <Badge className="bg-purple-600 text-white">
                                      {qdrantProject.year || "N/A"}
                                    </Badge>
                                    <Badge variant="outline">
                                      {(qdrantProject.similarity_score * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-slate-600 mb-2">
                                  Department: {qdrantProject.department || "غير محدد"}
                                </p>

                                <p className="text-sm text-purple-700 italic leading-relaxed whitespace-pre-line">
                                  {relevance}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Suggested Improvements */}
                    {result.stage_2_extended_analysis?.Improvements?.length > 0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-5 rounded-lg border-2 border-amber-200">
                        <h3 className="font-semibold text-lg text-amber-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Suggested Improvements
                        </h3>
                        <ul className="space-y-2">
                          {result.stage_2_extended_analysis.Improvements.map((imp, i) => (
                            <li key={i} className="flex items-start gap-3 bg-white/80 rounded-lg p-3 border border-amber-200">
                              <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </span>
                              <p className="text-sm text-slate-700 leading-relaxed">{imp}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Final Proposal */}
                    {result.stage_2_extended_analysis?.Final_Proposal?.Summary && (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-5 rounded-lg border-2 border-indigo-200">
                        <h3 className="font-semibold text-lg text-indigo-900 mb-3 flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Final Proposal Summary
                        </h3>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                          {result.stage_2_extended_analysis.Final_Proposal.Summary}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Save/Cancel Buttons */}
                {!isSaved ? (
                  <Card className="border-2 border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-amber-900 font-semibold mb-1">
                              Save Analysis?
                            </p>
                            <p className="text-amber-800 text-sm mb-4">
                              Would you like to save this analysis to your profile? You can review it later and track your project ideas.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                          <Button
                            onClick={handleCancel}
                            variant="outline"
                            className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveIdea}
                            disabled={saving}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save to Profile
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3 mb-4">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-900 font-semibold mb-1">
                            Analysis Saved!
                          </p>
                          <p className="text-green-800 text-sm">
                            Your project idea has been saved to your profile. You can view it anytime from your dashboard.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleNewAnalysis}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze New Idea
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}