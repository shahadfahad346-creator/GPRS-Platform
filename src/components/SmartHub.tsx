import { motion } from "motion/react";
import { Button } from "./ui/button";
import { 
  FolderOpen, 
  Sparkles, 
  Users, 
  User, 
  LogOut,
  Home,
  GraduationCap,
  Brain,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import { useAuth } from "../../Frontend/lib/auth-context";
import { useState } from "react";
import { InteractiveBackground } from "./Backgrounds";

interface SmartHubProps {
  onNavigate: (page: 'archive' | 'analysis' | 'supervisors' | 'profile') => void;
}

export function SmartHub({onNavigate }: SmartHubProps) {
  const { user, logout } = useAuth();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const tools = [
    {
      id: 'analysis' as const,
      icon: Sparkles,
      title: "AI Text Analysis",
      shortTitle: "Text Analysis",
      description: "Analyze your project idea with AI",
      color: "from-emerald-700 to-emerald-500",
      borderColor: "border-emerald-500/30",
      glowColor: "rgba(16, 185, 129, 0.4)",
      angle: -90, // Top
      distance: 280
    },
    {
      id: 'archive' as const,
      icon: FolderOpen,
      title: "Smart Archive",
      shortTitle: "Project Archive",
      description: "Explore past graduation projects",
      color: "from-teal-700 to-teal-500",
      borderColor: "border-teal-500/30",
      glowColor: "rgba(20, 184, 166, 0.4)",
      angle: 150, // Bottom Left
      distance: 280
    },
    {
      id: 'supervisors' as const,
      icon: Users,
      title: "Find Supervisors",
      shortTitle: "Supervisors",
      description: "Connect with expert supervisors",
      color: "from-slate-800 to-cyan-700",
      borderColor: "border-slate-500/30",
      glowColor: "rgba(100, 116, 139, 0.4)",
      angle: 30, // Bottom Right
      distance: 280
    }
  ];

  // Calculate position for orbital tools
  const getOrbitalPosition = (angle: number, distance: number) => {
    const radian = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radian) * distance,
      y: Math.sin(radian) * distance
    };
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Interactive Background */}
      <InteractiveBackground />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-emerald-900/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-800 to-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl bg-gradient-to-r from-emerald-900 to-slate-800 bg-clip-text text-transparent">
                  GPRS
                </h1>
                <p className="text-xs text-slate-600">Smart</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-emerald-900 bg-emerald-900/5"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate('analysis')}
                className="text-slate-700 hover:text-emerald-900 hover:bg-emerald-900/5"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Smart Analysis
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate('archive')}
                className="text-slate-700 hover:text-emerald-900 hover:bg-emerald-900/5"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Browse Archive
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate('supervisors')}
                className="text-slate-700 hover:text-emerald-900 hover:bg-emerald-900/5"
              >
                <Users className="w-4 h-4 mr-2" />
                Browse Supervisors
              </Button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => onNavigate('profile')}
                className="hidden md:flex"
              >
                <User className="w-4 h-4 mr-2" />
                {user?.name}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-slate-700 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Orbital System */}
      <main className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-900/10 to-slate-900/10 text-emerald-900 px-6 py-3 rounded-full mb-6 border border-emerald-800/20"
          >
            <Brain className="w-5 h-5" />
            <span className="text-sm">AI-Powered Graduation Project System</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent">
            Welcome to GPRS
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your intelligent companion for graduation project planning and supervisor matching
          </p>
        </motion.div>

        {/* Orbital System Container */}
        <div className="relative flex items-center justify-center" style={{ minHeight: '700px' }}>
          
          {/* Orbital Rings */}
          <motion.div
            className="absolute"
            style={{ width: '600px', height: '600px' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Outer Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-emerald-900/10"
              animate={{ rotate: 360 }}
              transition={{
                duration: 60,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Middle Ring */}
            <motion.div
              className="absolute inset-8 rounded-full border-2 border-emerald-900/20"
              animate={{ rotate: -360 }}
              transition={{
                duration: 45,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Inner Ring */}
            <motion.div
              className="absolute inset-16 rounded-full border border-emerald-900/10"
              animate={{ rotate: 360 }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>

          {/* Center Core - GPRS Core */}
          <motion.div
            className="absolute z-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Core Circle */}
              <div className="relative w-40 h-40 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-800 rounded-full shadow-2xl flex items-center justify-center border-4 border-white/20">
                {/* Inner Glow */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-600/30 to-teal-600/30 blur-xl" />
                
                {/* Icon */}
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Brain className="w-16 h-16 text-white" />
                  </motion.div>
                </div>
                
                {/* Pulse Rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
                  animate={{
                    scale: [1, 1.5],
                    opacity: [0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
                  animate={{
                    scale: [1, 1.5],
                    opacity: [0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1
                  }}
                />
              </div>
              
              {/* Core Label */}
              <motion.div
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-emerald-900/10">
                  <p className="text-sm bg-gradient-to-r from-emerald-900 to-slate-800 bg-clip-text text-transparent">
                    GPRS Core
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Connection Lines (Dynamic) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ width: '700px', height: '700px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            {tools.map((tool) => {
              const pos = getOrbitalPosition(tool.angle, tool.distance);
              const isHovered = hoveredTool === tool.id;
              
              return (
                <motion.line
                  key={tool.id}
                  x1="50%"
                  y1="50%"
                  x2={`calc(50% + ${pos.x}px)`}
                  y2={`calc(50% + ${pos.y}px)`}
                  stroke={isHovered ? tool.glowColor : "rgba(6, 95, 70, 0.1)"}
                  strokeWidth={isHovered ? "3" : "1.5"}
                  strokeDasharray="8 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: 1, 
                    opacity: isHovered ? 0.8 : 0.3,
                    strokeWidth: isHovered ? 3 : 1.5
                  }}
                  transition={{ 
                    duration: 1, 
                    delay: 0.8 + tool.angle / 360,
                    opacity: { duration: 0.3 },
                    strokeWidth: { duration: 0.3 }
                  }}
                />
              );
            })}
            
            {/* Animated Particles on Lines */}
            {tools.map((tool) => {
              const pos = getOrbitalPosition(tool.angle, tool.distance);
              
              return (
                <motion.circle
                  key={`particle-${tool.id}`}
                  r="4"
                  fill={tool.glowColor}
                  initial={{ opacity: 0 }}
                  animate={{
                    cx: [`50%`, `calc(50% + ${pos.x}px)`],
                    cy: [`50%`, `calc(50% + ${pos.y}px)`],
                    opacity: [0, 0.8, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: tool.angle / 180
                  }}
                />
              );
            })}
          </svg>

          {/* Orbital Tools */}
          {tools.map((tool, index) => {
            const pos = getOrbitalPosition(tool.angle, tool.distance);
            const Icon = tool.icon;
            
            return (
              <motion.div
                key={tool.id}
                className="absolute z-30"
                style={{
                  left: '50%',
                  top: '50%',
                  x: pos.x,
                  y: pos.y,
                  translateX: '-50%',
                  translateY: '-50%'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.8 + index * 0.2,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{ scale: 1.05, z: 50 }}
                onHoverStart={() => setHoveredTool(tool.id)}
                onHoverEnd={() => setHoveredTool(null)}
              >
                <motion.button
                  onClick={() => onNavigate(tool.id)}
                  className={`relative group cursor-pointer`}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Glow Effect on Hover */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl blur-xl"
                    style={{ background: tool.glowColor }}
                    animate={{
                      opacity: hoveredTool === tool.id ? 0.6 : 0,
                      scale: hoveredTool === tool.id ? 1.2 : 1
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Card */}
                  <div className={`relative w-56 bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border-2 ${tool.borderColor} p-6 transition-all duration-300`}>
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg mx-auto`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg text-center text-slate-900 mb-2">
                      {tool.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-xs text-center text-slate-600 leading-relaxed">
                      {tool.description}
                    </p>
                    
                    {/* Hover Indicator */}
                    <motion.div
                      className="absolute bottom-4 left-1/2 -translate-x-1/2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: hoveredTool === tool.id ? 1 : 0,
                        y: hoveredTool === tool.id ? 0 : 10
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`flex items-center gap-2 text-xs bg-gradient-to-r ${tool.color} text-white px-3 py-1 rounded-full`}>
                        <span>Explore</span>
                        <Zap className="w-3 h-3" />
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Orbiting Particle */}
                  <motion.div
                    className="absolute w-3 h-3 rounded-full"
                    style={{ background: tool.glowColor }}
                    animate={{
                      x: [0, 20, 0, -20, 0],
                      y: [0, -20, 0, 20, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2 }}
          className="text-center mt-20"
        >
          <div className="inline-flex items-center gap-2 text-slate-600 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-emerald-900/10">
            <Target className="w-4 h-4 text-emerald-700" />
            <span className="text-sm">Click on any tool to explore its capabilities</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
