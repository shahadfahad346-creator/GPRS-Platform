import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, Search, Sparkles, Calendar, BookOpen, FileText, Eye, Users, Layers, Target, Loader2, Grid3x3, Table2, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { getProjects } from "../../Frontend/lib/api";
import { useAuth } from "../../Frontend/lib/auth-context";
import { InteractiveBackground } from "./Backgrounds";
import { useState, useEffect, useCallback } from "react";

interface ProjectArchiveProps {
  onBack: () => void;
  onNavigate?: (page: 'supervisors', searchTerm?: string) => void;
}

interface Project {
  project_domain: string;
  _id: string;
  project_title: string;
  collage?: string;
  department?: string;
  year?: number | string;
  abstract?: string;
  supervisors?: string[] | string;
}


const ensureArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      if (value.includes(',')) {
        return value.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [value];
    }
  }
  return [];
};


const SupervisorBadge = ({ supervisor, onClick, variant = "default" }: { 
  supervisor: string; 
  onClick?: (e: React.MouseEvent) => void;
  variant?: "default" | "compact";
}) => {
  if (variant === "compact") {
    return (
      <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/50 text-slate-600 px-2 py-0.5 rounded text-xs font-light">
        <Users className="w-3 h-3" />
        {supervisor}
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-900 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 border border-slate-200 hover:border-cyan-300 hover:shadow-sm group"
    >
      <Users className="w-3 h-3 group-hover:text-cyan-700" />
      {supervisor}
    </button>
  );
};

const ProjectCard = ({ project, index, onSelect, onNavigate }: {
  project: Project;
  index: number;
  onSelect: () => void;
  onNavigate?: (page: 'supervisors', searchTerm?: string) => void;
}) => {
  const supervisors = ensureArray(project.supervisors);

  return (
    <motion.div
      key={project._id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -5 }}
      onClick={onSelect}
      className="cursor-pointer"
    >
      <Card className="h-full border-2 border-slate-900/10 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-cyan-600/30 group overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-5"
          style={{ background: 'radial-gradient(circle at 50% 50%, #0891b2 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <CardHeader className="relative pb-3">
          <div className="flex items-start gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
<CardTitle className="text-base font-normal text-slate-900 group-hover:text-cyan-900 transition-colors mb-3 leading-tight line-clamp-2">                {project.project_title || 'Untitled Project'}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {project.year && (
                  <Badge className="bg-slate-900/10 text-slate-800 border-slate-900/20 font-semibold">
                    <Calendar className="w-3 h-3 mr-1" />
                    {project.year}
                  </Badge>
                )}
                {project.project_domain && (
                  <Badge className="bg-cyan-900/10 text-cyan-800 border-cyan-900/20">
                    {project.project_domain}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 relative pt-0">
          {project.abstract && (
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Abstract</span>
              </div>
              <p className="text-sm text-slate-700 line-clamp-4 leading-relaxed">
                {project.abstract}
              </p>
            </div>
          )}
          {supervisors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Supervisors</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {supervisors.map((sup, i) => (
                  <SupervisorBadge
                    key={i}
                    supervisor={sup}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate?.('supervisors', sup);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <Button
            className="w-full bg-gradient-to-r from-slate-800 to-cyan-700 hover:from-slate-900 hover:to-cyan-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Full Details
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ProjectTableRow = ({ project, index, onView }: {
  project: Project;
  index: number;
  onView: () => void;
}) => {
  const supervisors = ensureArray(project.supervisors);

  return (
    <TableRow className="hover:bg-gradient-to-r hover:from-cyan-50/40 hover:to-slate-50/40 transition-all duration-200 border-b border-slate-100/50 group">
      <TableCell className="text-center align-top pt-4">
        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-cyan-100 text-slate-700 text-xs font-normal group-hover:from-slate-200 group-hover:to-cyan-200 transition-colors">
          {index + 1}
        </div>
      </TableCell>

      {/* عمود العنوان مع سكرول أفقي داخلي */}
      <TableCell className="py-4 align-top min-w-0">
        <div className="max-w-full overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-slate-200 pr-4 pb-1">
            <h3 
              className="text-sm font-normal text-slate-900 cursor-pointer hover:text-cyan-800 transition-colors leading-relaxed break-words"
              onClick={onView}
            >
              {project.project_title || 'Untitled Project'}
            </h3>
          </div>
          
          {project.collage && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-light mt-2">
              <Building2 className="w-3 h-3 text-slate-400" />
              {project.collage}
            </p>
          )}
        </div>
      </TableCell>

      <TableCell className="align-top pt-4 text-center">
        {project.year ? (
          <div className="inline-flex items-center gap-1 bg-slate-900/5 border border-slate-900/10 text-slate-700 px-2.5 py-1 rounded-md text-xs font-normal">
            <Calendar className="w-3 h-3" />
            {project.year}
          </div>
        ) : <span className="text-xs text-slate-400">-</span>}
      </TableCell>

      <TableCell className="align-top pt-4">
        {project.project_domain ? (
          <div className="inline-flex items-center bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200/50 text-cyan-800 px-2.5 py-1 rounded-md text-xs font-normal">
            {project.project_domain}
          </div>
        ) : <span className="text-xs text-slate-400">-</span>}
      </TableCell>

      <TableCell className="text-slate-600 text-xs font-light align-top pt-4">
        {project.department || '-'}
      </TableCell>

      <TableCell className="align-top pt-4">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {supervisors.slice(0, 2).map((sup, i) => (
            <SupervisorBadge key={i} supervisor={sup} variant="compact" />
          ))}
          {supervisors.length > 2 && (
            <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-xs font-light">
              +{supervisors.length - 2}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="text-center align-top pt-3.5">
        <Button
          size="sm"
          onClick={onView}
          className="bg-gradient-to-r from-slate-700 to-cyan-700 hover:from-slate-800 hover:to-cyan-800 text-white text-xs font-normal px-3 py-1.5 h-auto shadow-sm hover:shadow-md transition-all"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

type ViewMode = 'cards' | 'table';

export function ProjectArchive({ onBack, onNavigate }: ProjectArchiveProps) {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  
  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  
  useEffect(() => {
    async function fetchProjects() {
      try {
        if (!projects.length) setLoading(true);
        setError(null);
        const result = await getProjects({ 
          page: 1, 
          limit: 50,
          search: debouncedSearchTerm 
        });
        
        if (result.projects && result.projects.length > 0) {
          setProjects(result.projects);
          setPagination(result.pagination || { page: 1, limit: 50, total: result.projects.length, totalPages: 1 });
        } else {
          setProjects([]);
          setPagination({ page: 1, limit: 50, total: 0, totalPages: 0 });
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [debouncedSearchTerm]);

  
  const loadMoreProjects = useCallback(async () => {
    if (loadingMore || pagination.page >= pagination.totalPages) return;
    
    try {
      setLoadingMore(true);
      const result = await getProjects({ 
        page: pagination.page + 1, 
        limit: 50,
        search: debouncedSearchTerm 
      });
      
      if (result.projects && result.projects.length > 0) {
        setProjects(prev => [...prev, ...result.projects]);
        setPagination(result.pagination || pagination);
      }
    } catch (err) {
      console.error('Error loading more projects:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, pagination, debouncedSearchTerm]);

  
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 500
      ) {
        loadMoreProjects();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreProjects]);

  const selectedSupervisors = ensureArray(selectedProject?.supervisors);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 to-cyan-50/30">
      <InteractiveBackground />
      
      <header className="bg-white/90 backdrop-blur-lg border-b border-slate-900/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="hover:bg-slate-900/5 text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm text-slate-900">Project Archive</h2>
                  <p className="text-xs text-slate-600">Past Projects</p>
                </div>
              </div>
            </div>
            <Badge className="bg-slate-900/10 text-slate-900 border-slate-900/20">{user?.name}</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-8 xl:px-12 py-12 relative z-10">
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-slate-700 animate-spin mx-auto mb-4" />
              <p className="text-lg text-slate-600">Loading projects from database...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <div className="text-amber-600">⚠️</div>
              <div>
                <p className="text-sm text-amber-800">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()} className="mt-4 text-amber-800 border-amber-300 hover:bg-amber-100">
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="text-center mb-12 max-w-5xl mx-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900/10 to-cyan-900/10 text-slate-900 px-5 py-2 rounded-full mb-6 border border-slate-800/20"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Explore Past Projects</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4 bg-gradient-to-r from-slate-900 via-cyan-800 to-emerald-800 bg-clip-text text-transparent">
                Smart Project Archive
              </h1>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Discover innovative graduation projects from previous years
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-4xl mx-auto mb-8"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-600" />
                <Input
                  type="text"
                  placeholder="Search by title, supervisor, domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 pr-6 py-7 text-lg border-2 border-slate-900/20 focus:border-slate-800 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-700 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-cyan-800 to-slate-900 bg-clip-text text-transparent">
                    {pagination.total}
                  </span>
                  <span className="text-sm text-slate-600 font-normal">Projects Found</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-xl border-2 border-slate-900/10 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={`${viewMode === 'cards' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'} transition-all duration-200`}
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`${viewMode === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'} transition-all duration-200`}
                >
                  <Table2 className="w-4 h-4 mr-2" />
                  Table
                </Button>
              </div>
            </motion.div>

            {viewMode === 'cards' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {projects.map((project, index) => (
                      <ProjectCard
                        key={project._id}
                        project={project}
                        index={index}
                        onSelect={() => setSelectedProject(project)}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {pagination.page < pagination.totalPages && (
                  <div className="flex justify-center mt-12">
                    <Button
                      onClick={loadMoreProjects}
                      disabled={loadingMore}
                      className="bg-gradient-to-r from-slate-800 to-cyan-700 hover:from-slate-900 hover:to-cyan-800 text-white px-8 py-6 text-lg shadow-lg"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Projects
                          <span className="ml-2 text-sm opacity-80">
                            ({projects.length} of {pagination.total})
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-2 border-slate-900/20 bg-white/95 backdrop-blur-sm shadow-2xl">
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-cyan-800 px-6 py-4">
                  <h3 className="text-white text-sm font-normal">Academic Project Repository</h3>
                </div>

<div className="h-[600px] w-full overflow-x-auto overflow-y-auto border border-slate-200 rounded-lg shadow-md">
  <table className="min-w-max w-full border-collapse">
    <thead>
      <tr className="bg-gradient-to-r from-slate-50 to-cyan-50/30 sticky top-0 z-10 border-b-2 border-slate-900/10">
        <th className="text-slate-700 text-xs font-medium uppercase text-center px-4 py-2">#</th>
        <th className="text-slate-700 text-xs font-medium uppercase min-w-[500px] px-4 py-2">Project</th>
        <th className="text-slate-700 text-xs font-medium uppercase text-center min-w-[200px] px-4 py-2">Year</th>
        <th className="text-slate-700 text-xs font-medium uppercase min-w-[250px] px-4 py-2">Domain</th>
        <th className="text-slate-700 text-xs font-medium uppercase min-w-[250px] px-4 py-2">Department</th>
        <th className="text-slate-700 text-xs font-medium uppercase min-w-[300px] px-4 py-2">Supervisors</th>
        <th className="text-slate-700 text-xs font-medium uppercase text-center min-w-[150px] px-4 py-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      {projects.map((project, index) => (
        <ProjectTableRow
          key={project._id}
          project={project}
          index={index}
          onView={() => setSelectedProject(project)}
        />
      ))}
    </tbody>
  </table>
</div>


                  
                  {pagination.page < pagination.totalPages && (
                    <div className="flex justify-center py-6">
                      <Button
                        onClick={loadMoreProjects}
                        disabled={loadingMore}
                        variant="outline"
                        className="border-slate-300"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          `Load More (${projects.length} of {pagination.total})`
                        )}
                      </Button>
                    </div>
                  )}
                

              </Card>
            )}

            {projects.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl text-slate-900 mb-2">No projects found</h3>
                <p className="text-slate-600">Try adjusting your search</p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl text-slate-900 leading-tight mb-2">
                  {selectedProject?.project_title}
                </DialogTitle>
                <DialogDescription className="sr-only">Project details</DialogDescription>
                <div className="flex flex-wrap gap-2">
                  {selectedProject?.year && (
                    <Badge className="bg-slate-900/10 text-slate-700 border-slate-900/20">
                      <Calendar className="w-3 h-3 mr-1" />
                      {selectedProject.year}
                    </Badge>
                  )}
                  {selectedProject?.project_domain && (
                    <Badge className="bg-cyan-900/10 text-cyan-800 border-cyan-900/20">
                      <Target className="w-3 h-3 mr-1" />
                      {selectedProject.project_domain}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {selectedProject?.collage && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-slate-600" />
                      <span className="text-xs text-slate-600">College</span>
                    </div>
                    <p className="text-slate-900">{selectedProject.collage}</p>
                  </div>
                )}
                {selectedProject?.department && (
                  <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-cyan-700" />
                      <span className="text-xs text-cyan-700">Department</span>
                    </div>
                    <p className="text-slate-900">{selectedProject.department}</p>
                  </div>
                )}
              </div>
              {selectedProject?.abstract && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-slate-700" />
                    <h4 className="text-slate-900">Project Abstract</h4>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedProject.abstract}
                  </p>
                </div>
              )}
              {selectedSupervisors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-slate-700" />
                    <h4 className="text-slate-900">Academic Supervisors</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSupervisors.map((supervisor, index) => (
                      <Badge
                        key={index}
                        className="bg-slate-100 text-slate-900 border-slate-300 px-4 py-2 cursor-pointer"
                        onClick={() => onNavigate?.('supervisors', supervisor)}
                      >
                        {supervisor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}