import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";

interface ProjectScholarLinkProps {
  projectTitle: string;
  className?: string;
  iconSize?: string;
}

export function ProjectScholarLink({ 
  projectTitle, 
  className = "",
  iconSize = "w-4 h-4"
}: ProjectScholarLinkProps) {
  if (!projectTitle) return null;

  const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(projectTitle)}`;

  return (
    <motion.a
      href={scholarUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center justify-center w-8 h-8 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 hover:text-cyan-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
      title="Search this project on Google Scholar"
    >
      <ExternalLink className={iconSize} />
    </motion.a>
  );
}
