import { ArrowLeft, UsersIcon, Loader2, Sparkles, Search, GraduationCap, Star, Mail, Award, ExternalLink, User } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "../../Frontend/lib/auth-context"
import { Input } from "./ui/input"
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {getSupervisors} from "../../Frontend/lib/api";
import { InteractiveBackground } from "./Backgrounds";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";

interface SupervisorProfilesProps {
  onBack: () => void;
  initialSearch?: string;
}

interface Supervisor {
  _id: string;
  name: string;
  email?: string;
  specialization?: string;
  researchInterests?: string[];
  researchPapers?: Array<{
    title: string;
    platform: string;
  }>;
  publications?: number;
  activeProjects?: number;
  completedProjects?: number;
  availability?: string;
  rating?: number;
  expertise?: string[];
  authorId?: string;
}

interface ProfileLinkProps {
  supervisorId: string;
  className?: string;
  variant?: 'button' | 'inline' | 'badge';
}

function ViewProfileLink({ 
  supervisorId, 
  className = "",
  variant = 'button'
}: ProfileLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/SupervisorProfile', { state: { supervisorId } }); // هنا التعديل الوحيد
  };

  if (variant === 'button') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm ${className}`}
      >
        <button onClick={handleClick} className="flex items-center gap-2 w-full h-full">
          <User size={16} />
          <span>View Profile</span>
        </button>
      </motion.div>
    );
  }

  if (variant === 'badge') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 rounded-full transition-all duration-200 text-xs border border-emerald-200 ${className}`}
      >
        <button onClick={handleClick} className="flex items-center gap-1.5 w-full h-full">
          <User size={12} />
          <span>Profile</span>
        </button>
      </motion.div>
    );
  }

  return null;
}

interface GoogleScholarLinkProps {
  authorId?: string;
  researchTopic?: string;
  className?: string;
  variant?: 'button' | 'inline' | 'badge';
}

function GoogleScholarLink({ 
  authorId, 
  researchTopic, 
  className = "",
  variant = 'button'
}: GoogleScholarLinkProps) {
  if (!authorId && !researchTopic) return null;

  const scholarUrl = authorId 
    ? `https://scholar.google.com/citations?user=${authorId}&hl=en`
    : `https://scholar.google.com/scholar?q=${encodeURIComponent(researchTopic || '')}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (variant === 'badge') {
    return (
      <motion.a
        href={scholarUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 hover:text-cyan-900 rounded-full transition-all duration-200 text-xs border border-cyan-200 ${className}`}
      >
        <ExternalLink className="w-3 h-3" />
        <span>Scholar</span>
      </motion.a>
    );
  }

  if (variant === 'button') {
    return (
      <motion.a
        href={scholarUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-slate-700 hover:from-cyan-700 hover:to-slate-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm ${className}`}
      >
        <ExternalLink className="w-4 h-4" />
        <span>Google Scholar</span>
      </motion.a>
    );
  }

  return null;
}

const mockSupervisors: Supervisor[] = [
  {
    _id: "1",
    name: "Dr. Ahmed Hassan",
    email: "ahmed.hassan@university.edu",
    specialization: "Artificial Intelligence & Machine Learning",
    researchInterests: ["Deep Learning", "Computer Vision", "Natural Language Processing", "Neural Networks"],
    publications: 45,
    activeProjects: 3,
    completedProjects: 28,
    availability: "Available",
    rating: 4.9,
    expertise: ["Python", "TensorFlow", "PyTorch", "Research Methodology"],
    authorId: "_f9gV0EAAAAJ"
  }
];

export function SupervisorProfiles({ onBack, initialSearch = "" }: SupervisorProfilesProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [filteredSupervisors, setFilteredSupervisors] = useState<Supervisor[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🆕 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    async function fetchSupervisors() {
      try {
        if (supervisors.length === 0) setLoading(true);

        setError(null);
        console.log(`📡 Fetching supervisors - Page ${currentPage}`);
        
        const { supervisors: data, pagination } = await getSupervisors({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: searchTerm
        });
        
        if (data && data.length > 0) {
          console.log(`✅ Loaded ${data.length} supervisors from page ${currentPage}`);
          setSupervisors(data);
          setFilteredSupervisors(data);
          setTotalPages(pagination.totalPages || 1);
          setTotalCount(pagination.total || data.length);
        } else {
          console.warn("⚠️ No supervisors found");
          setError(`No supervisors found. Showing sample data.`);
          setSupervisors(mockSupervisors);
          setFilteredSupervisors(mockSupervisors);
        }
      } catch (err) {
        console.error("❌ Error:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Error: ${errorMessage}. Showing sample data.`);
        setSupervisors(mockSupervisors);
        setFilteredSupervisors(mockSupervisors);
      } finally {
        setLoading(false);
      }
    }

    fetchSupervisors();
  }, [currentPage, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <InteractiveBackground />

      <header className="bg-white/90 backdrop-blur-lg border-b border-slate-900/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="hover:bg-slate-900/5 text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm text-slate-900">Find Supervisors</h2>
                  <p className="text-xs text-slate-600">Expert Guidance</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-slate-900/10 text-slate-900 border-slate-900/20">
                {user?.name}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10">
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-slate-700 animate-spin mx-auto mb-4" />
              <p className="text-lg text-slate-600">Loading supervisors...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <div className="text-amber-600">⚠️</div>
              <div>
                <p className="text-sm text-amber-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900/10 to-cyan-900/10 text-slate-900 px-5 py-2 rounded-full mb-6 border border-slate-800/20"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Connect with Expert Supervisors</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4 bg-gradient-to-r from-slate-900 via-cyan-800 to-emerald-800 bg-clip-text text-transparent">
                Browse Supervisor Profiles
              </h1>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Discover experienced faculty members who can guide your graduation project
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-3xl mx-auto mb-8"
              >
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-600" />
  {loading && supervisors.length > 0 && (
    <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 animate-spin" />
  )}
  <Input
    type="text"
    placeholder="Search by name, specialization, or research interest..."
    value={searchTerm}
    onChange={(e) => handleSearch(e.target.value)}
    className="pl-14 pr-12 py-7 text-lg border-2 border-slate-900/20 focus:border-slate-800 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg"
  />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center mb-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-700 rounded-xl flex items-center justify-center shadow-lg">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-cyan-800 to-slate-900 bg-clip-text text-transparent">
                    {totalCount}
                  </span>
                  <span className="text-sm text-slate-600">
                    {searchTerm ? 'Matching Supervisors' : 'Total Supervisors'}
                  </span>
                </div>
              </div>
            </motion.div>

            {filteredSupervisors.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredSupervisors.map((supervisor, index) => (
                    <motion.div
                      key={supervisor._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -5 }}                    >
                      <Card className="h-full border-2 border-slate-900/10 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-cyan-600/30 group">
                        <CardHeader>
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                              <GraduationCap className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-xl text-slate-900 group-hover:text-cyan-900 transition-colors mb-1">
                                {supervisor.name || 'Unknown Supervisor'}
                              </CardTitle>
                              {supervisor.specialization && (
                                <CardDescription className="text-sm line-clamp-2">
                                  {supervisor.specialization}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {supervisor.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-4 h-4 text-cyan-700" />
                              <a 
                                href={`mailto:${supervisor.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="truncate text-xs hover:text-cyan-700 hover:underline"
                              >
                                {supervisor.email}
                              </a>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {supervisor.authorId && (
                              <GoogleScholarLink 
                                authorId={supervisor.authorId}
                                variant="badge"
                              />
                            )}
                            <ViewProfileLink 
                              supervisorId={supervisor._id}
                              variant="badge"
                            />
                          </div>
                          {supervisor.publications && supervisor.publications > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <GraduationCap className="w-4 h-4 text-emerald-700" />
                              <span className="text-emerald-700">
                                {supervisor.publications} Publications
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* 🆕 Pagination UI */}
            {!loading && filteredSupervisors.length > 0 && totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center items-center gap-4 mt-12 mb-8"
              >
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="disabled:opacity-50"
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => handlePageClick(pageNum)}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        className={currentPage === pageNum ? "bg-gradient-to-r from-slate-800 to-cyan-700" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="disabled:opacity-50"
                >
                  Next
                </Button>
                
                <span className="text-sm text-slate-600 ml-4">
                  Page {currentPage} of {totalPages} ({totalCount} total)
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>

      {/* Modal للـ Supervisor Details */}
      <AnimatePresence>
        {selectedSupervisor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSupervisor(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl text-slate-900 mb-2">{selectedSupervisor.name}</h2>
                    {selectedSupervisor.specialization && (
                      <p className="text-lg text-slate-600">{selectedSupervisor.specialization}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSupervisor(null)}
                  className="hover:bg-slate-100 text-2xl"
                >
                  ×
                </Button>
              </div>

              {selectedSupervisor.email && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-4">
                    <a 
                      href={`mailto:${selectedSupervisor.email}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg border border-cyan-200"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{selectedSupervisor.email}</span>
                    </a>
                    {selectedSupervisor.authorId && (
                      <GoogleScholarLink 
                        authorId={selectedSupervisor.authorId}
                        variant="button"
                      />
                    )}
                    <ViewProfileLink 
                      supervisorId={selectedSupervisor._id}
                      variant="button"
                    />
                  </div>
                </div>
              )}

              {selectedSupervisor.researchPapers && selectedSupervisor.researchPapers.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl text-slate-900">Research Publications</h3>
                      <p className="text-sm text-slate-600">{selectedSupervisor.researchPapers.length} published papers</p>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {selectedSupervisor.researchPapers.map((paper, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ scale: 1.01, x: 5 }}
                      >
                        <div className="p-4 bg-gradient-to-r from-white to-slate-50 hover:from-emerald-50 hover:to-slate-50 border-2 border-slate-200 hover:border-emerald-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                          <h4 className="text-slate-900 mb-2 font-medium">{paper.title}</h4>
                          <div className="flex items-center gap-3 flex-wrap">
                            {paper.platform && (
                              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                {paper.platform}
                              </span>
                            )}
                            
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {(!selectedSupervisor.researchPapers || selectedSupervisor.researchPapers.length === 0) && 
               selectedSupervisor.publications && selectedSupervisor.publications > 0 && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-slate-50 border-2 border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-6 h-6 text-emerald-700" />
                    <div>
                      <p className="text-slate-900">{selectedSupervisor.publications} Research Publications</p>
                      <p className="text-xs text-slate-600">Contact supervisor for details</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}