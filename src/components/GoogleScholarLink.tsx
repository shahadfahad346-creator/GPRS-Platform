import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";

interface GoogleScholarLinkProps {
  authorId?: string;
  researchTopic?: string;
  className?: string;
  variant?: 'button' | 'inline' | 'badge';
}

export function GoogleScholarLink({ 
  authorId, 
  researchTopic, 
  className = "",
  variant = 'button'
}: GoogleScholarLinkProps) {
  // If no authorId and no research topic, don't render
  if (!authorId && !researchTopic) return null;

  // Build the URL
  const scholarUrl = authorId 
    ? `https://scholar.google.com/citations?user=${authorId}&hl=en`
    : `https://scholar.google.com/scholar?q=${encodeURIComponent(researchTopic || '')}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Button variant (default)
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

  // Inline variant (small icon link)
  if (variant === 'inline') {
    return (
      <motion.a
        href={scholarUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        className={`inline-flex items-center justify-center w-8 h-8 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-full transition-colors ${className}`}
        title="View on Google Scholar"
      >
        <ExternalLink className="w-4 h-4" />
      </motion.a>
    );
  }

  // Badge variant (pill-shaped button)
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

  return null;
}
