import { Button } from "./ui/button";
import { 
  Menu, X, ArrowRight, Sparkles, Brain, Search, Zap, GraduationCap, 
  BarChart3, Check, Edit3, Settings, FileText, Heart 
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { InteractiveBackground, GreenGradientBackground } from "./Backgrounds";

// ============================================
// 1. HEADER COMPONENT
// ============================================
interface HeaderProps {
  onOpenAuthModal: () => void;
  isAuthModalOpen: boolean;
  onCloseAuthModal: () => void;
}

export function Header({ onOpenAuthModal }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-lg shadow-lg border-b border-emerald-900/10' 
          : 'bg-white/70 backdrop-blur-md border-b border-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-800 to-slate-800 rounded-lg flex items-center justify-center text-white shadow-md">
              <span>GP</span>
            </div>
            <span className="text-xl bg-gradient-to-r from-emerald-900 to-slate-800 bg-clip-text text-transparent">GPRS</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Features', 'How it works'].map((item, index) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-slate-700 hover:text-emerald-800 transition-colors relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-800 to-slate-700 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </nav>

          {/* Auth Buttons */}
          <motion.div 
            className="hidden md:flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              variant="ghost" 
              className="hover:text-emerald-800 hover:bg-emerald-900/5"
              onClick={onOpenAuthModal}
            >
              Log in
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-slate-800 shadow-md hover:shadow-lg transition-all duration-300"
              onClick={onOpenAuthModal}
            >
              Create an account
            </Button>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-900/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-emerald-800" /> : <Menu className="w-6 h-6 text-emerald-800" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="mt-4 pb-4 flex flex-col gap-4">
                {['Home', 'Features', 'How it works'].map((item, index) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-slate-700 hover:text-emerald-800 transition-colors py-2 px-4 rounded-lg hover:bg-emerald-900/5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </motion.a>
                ))}
                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    variant="ghost" 
                    className="justify-start hover:bg-emerald-900/5"
                    onClick={() => {
                      onOpenAuthModal();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Log in
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-emerald-800 to-emerald-900"
                    onClick={() => {
                      onOpenAuthModal();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Create an account
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

// ============================================
// 2. HERO COMPONENT
// ============================================
interface HeroProps {
  onOpenAuth?: () => void;
}

export function Hero({ onOpenAuth }: HeroProps = {}) {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered",
      description: "Advanced analysis",
      gradient: "from-emerald-800 to-emerald-900",
      delay: 0
    },
    {
      icon: Search,
      title: "Smart Matching",
      description: "Perfect supervisors",
      gradient: "from-slate-800 to-slate-900",
      delay: 0.1
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Quick analysis",
      gradient: "from-teal-800 to-teal-900",
      delay: 0.2
    }
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Green Gradient Background */}
      <GreenGradientBackground />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-900/10 to-slate-700/10 text-emerald-900 px-4 py-2 rounded-full mb-6 border border-emerald-800/20 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Powered by AI & RAG Technology</span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl mb-6 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Welcome to GPRS
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-6 text-slate-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Graduation Project Recommendation System 
          </motion.p>
          
          <motion.p 
            className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            The GPRS system is an intelligent companion that transforms raw ideas into guided innovation — analyzing, refining, and matching every vision with the right mentor.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={onOpenAuth}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* Interactive Features - New Design */}
          <motion.div 
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="group relative"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1 + feature.delay }}
                  whileHover={{ y: -10 }}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-2xl rounded-full transition-all duration-500`}></div>
                  
                  <div className="relative bg-white/60 backdrop-blur-lg rounded-2xl p-8 border-2 border-emerald-900/10 group-hover:border-emerald-800/30 shadow-lg group-hover:shadow-2xl transition-all duration-500">
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-2xl`}></div>
                    </div>

                    {/* Icon container with animation */}
                    <motion.div 
                      className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Outer ring */}
                      <motion.div
                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${feature.gradient} opacity-20`}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.2, 0.1, 0.2]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      ></motion.div>
                      
                      {/* Middle ring */}
                      <motion.div
                        className={`absolute inset-2 rounded-full bg-gradient-to-br ${feature.gradient} opacity-30`}
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.3, 0.15, 0.3]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5
                        }}
                      ></motion.div>

                      {/* Icon background */}
                      <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300`}>
                        <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                      </div>

                      {/* Particles */}
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`absolute w-2 h-2 rounded-full bg-gradient-to-br ${feature.gradient}`}
                          animate={{
                            y: [-20, -40, -20],
                            x: [0, (i - 1) * 15, 0],
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeInOut"
                          }}
                        ></motion.div>
                      ))}
                    </motion.div>

                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className={`text-2xl mb-2 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 group-hover:text-slate-700 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-2xl overflow-hidden"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    >
                      <motion.div
                        className={`h-full bg-gradient-to-r ${feature.gradient}`}
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.8 }}
                        style={{ transformOrigin: 'left' }}
                      ></motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// 3. FEATURES COMPONENT
// ============================================
export function Features() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: "Smart analysis of the idea using artificial intelligence",
      description: "Advanced AI algorithms analyze your graduation project idea to identify key concepts, technical requirements, and research opportunities.",
      stats: "98% Accuracy",
      gradient: "from-emerald-800 via-emerald-900 to-slate-800",
      benefits: [
        "Deep semantic understanding",
        "Automatic keyword extraction",
        "Technical feasibility assessment"
      ]
    },
    {
      icon: Search,
      title: "Digital Archive of Previous Projects",
      description: "The platform provides access to a comprehensive digital archive of past graduation projects, enabling students and supervisors to:",
      stats: "3000+ Projects",
      gradient: "from-slate-800 via-emerald-900 to-teal-900",
      benefits: [
        "Advanced Browsing & Search",
        "Avoid Duplication",
        "Similarity Detection",
        "Originality Scoring"
      ]
    },
    {
      icon: GraduationCap,
      title: "Discover the Right Supervisor",
      description: "AI-powered insights to help you find the right supervisors and explore their profiles.",
      stats: "100+ Supervisors",
      gradient: "from-teal-900 via-slate-800 to-emerald-900",
      benefits: [
        "SmartHubMatching",
        "Profile Browsing",
        "Expert Alignment"
      ]
    },
    {
      icon: BarChart3,
      title: "Display of results in an easy-to-use interactive dashboard",
      description: "View comprehensive analysis, similarity scores, and supervisor recommendations in a clean, intuitive interface.",
      stats: "Real-time Results",
      gradient: "from-emerald-900 via-teal-900 to-slate-900",
      benefits: [
        "Visual analytics",
        "Export capabilities",
        "Collaborative features"
      ]
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-900/20 to-transparent rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-slate-700/20 to-transparent rounded-full filter blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block mb-6"
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-900/10 via-slate-700/10 to-teal-900/10 text-emerald-900 px-5 py-2.5 rounded-full border-2 border-emerald-800/20 shadow-lg backdrop-blur-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-700 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-800"></span>
              </span>
              System Capabilities
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent">
            Explore the Power of Our Platform
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Cutting-edge technology designed to streamline your academic journey
          </p>
        </motion.div>

        {/* Features List - Alternating Layout */}
        <div className="max-w-7xl mx-auto space-y-32">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isEven = index % 2 === 0;
            const isActive = activeIndex === index;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                onHoverStart={() => setActiveIndex(index)}
                onHoverEnd={() => setActiveIndex(null)}
                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-16 items-center`}
              >
                {/* Icon Side */}
                <motion.div 
                  className="flex-1 relative"
                  animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    {/* Decorative circles */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20 rounded-full blur-3xl`}
                      animate={isActive ? {
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.3, 0.2]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    ></motion.div>
                    
                    {/* Main icon container */}
                    <div className="relative bg-white rounded-3xl p-12 shadow-2xl border-2 border-emerald-900/10 hover:border-emerald-800/30 transition-all duration-300">
                      <motion.div
                        className={`w-full aspect-square bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                      >
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
                        </div>
                        
                        <Icon className="w-32 h-32 text-white relative z-10" strokeWidth={1.5} />
                        
                        {/* Stats badge */}
                        <motion.div
                          className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <span className={`bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                            {feature.stats}
                          </span>
                        </motion.div>
                      </motion.div>

                      {/* Corner decoration */}
                      <div className={`absolute ${isEven ? 'top-0 right-0' : 'top-0 left-0'} w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-10 ${isEven ? 'rounded-br-full' : 'rounded-bl-full'}`}></div>
                    </div>

                    {/* Number badge */}
                    <motion.div
                      className={`absolute ${isEven ? '-left-6' : '-right-6'} top-8 w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center shadow-xl border-4 border-white`}
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <span className="text-2xl text-white">{index + 1}</span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Content Side */}
                <div className="flex-1 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Title */}
                    <h3 className="text-3xl md:text-4xl text-slate-800 leading-tight mb-4">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                      {feature.description}
                    </p>

                    {/* Benefits list */}
                    <div className="space-y-3">
                      {feature.benefits.map((benefit, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-3 group"
                          initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                        >
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-slate-700 group-hover:text-emerald-900 transition-colors">
                            {benefit}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Learn more link */}
                    <motion.div
                      className="pt-6"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 }}
                    >
                      <motion.a
                        href="#"
                        className={`inline-flex items-center gap-2 text-emerald-800 group`}
                        whileHover={{ x: 5 }}
                      >
                        <span>Learn more about this feature</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.a>
                    </motion.div>
                  </motion.div>

                  {/* Progress indicator */}
                  <motion.div
                    className="h-2 bg-slate-100 rounded-full overflow-hidden"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    style={{ transformOrigin: isEven ? 'left' : 'right' }}
                  >
                    <motion.div
                      className={`h-full bg-gradient-to-r ${feature.gradient} rounded-full`}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6, duration: 1 }}
                      style={{ transformOrigin: 'left' }}
                    ></motion.div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

// ============================================
// 4. HOW IT WORKS COMPONENT
// ============================================
export function HowItWorks() {
  const steps = [
    {
      icon: Edit3,
      number: "1",
      title: "Enter your project idea",
      description: "Simply describe your graduation project idea in detail. Include the problem you want to solve, technologies you're interested in, and your goals.",
      color: "from-emerald-800 to-emerald-900"
    },
    {
      icon: Settings,
      number: "2",
      title: "It is analyzed via the GPRS + RAG system",
      description: "Our AI-powered system processes your idea using advanced RAG (Retrieval-Augmented Generation) technology to understand and evaluate your project.",
      color: "from-slate-800 to-slate-900"
    },
    {
      icon: FileText,
      number: "3",
      title: "The results are displayed",
      description: "Receive a comprehensive analytical report that presents your idea's insights intelligently and clearly to support your academic decisions.",
      color: "from-teal-800 to-teal-900"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-slate-700/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" style={{animationDelay: '2s'}}></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block mb-4"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-900/10 to-slate-700/10 text-emerald-900 px-4 py-2 rounded-full border border-emerald-800/20 backdrop-blur-sm">
              <span className="w-2 h-2 bg-emerald-800 rounded-full animate-pulse"></span>
              How It Works
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl mb-4 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent">
            Three Simple Steps
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Your path to the perfect graduation project
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={index} 
                  className="relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <motion.div 
                      className="hidden md:block absolute top-24 left-[60%] w-[80%] h-1 bg-gradient-to-r from-slate-200 via-emerald-100 to-slate-200 z-0 rounded-full"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.2 + 0.4 }}
                      style={{ transformOrigin: 'left' }}
                    >
                      <motion.div
                        className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: index * 0.2 + 0.8 }}
                        style={{ transformOrigin: 'left' }}
                      ></motion.div>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    className="relative z-10 text-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Icon Circle */}
                    <motion.div 
                      className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center relative shadow-xl group cursor-pointer`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Icon className="w-10 h-10 text-white" />
                      <motion.div 
                        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-emerald-900 rounded-full flex items-center justify-center shadow-lg"
                        whileHover={{ scale: 1.2 }}
                      >
                        <span>{step.number}</span>
                      </motion.div>
                      
                      {/* Pulse effect */}
                      <motion.div
                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-30`}
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0, 0.3, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      ></motion.div>
                    </motion.div>
                    
                    <h3 className="text-xl mb-3 text-slate-800">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{step.description}</p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

// ============================================
// 5. CTA COMPONENT
// ============================================
interface CTAProps {
  onOpenAuth?: () => void;
}

export function CTA({ onOpenAuth }: CTAProps = {}) {
  return (
    <section className="py-20 bg-gradient-to-br from-emerald-900 via-slate-800 to-teal-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6 border border-white/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ready to get started?</span>
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl mb-8 text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Get started now, and take your project one step closer to academic excellence
          </motion.h2>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-white text-emerald-900 hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all duration-300"
                onClick={onOpenAuth}
              >
                Start the analysis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-16 text-white" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
          <path d="M321.39 56.44c58-10.79 114.16-30.13 172-41.86 82.39-16.72 168.19-17.73 250.45-.39C823.78 31 906.67 72 985.66 92.83c70.05 18.48 146.53 26.09 214.34 3V0H0v27.35a600.21 600.21 0 00321.39 29.09z" fill="currentColor"></path>
        </svg>
      </div>
    </section>
  );
}

// ============================================
// 6. FOOTER COMPONENT
// ============================================
export function Footer() {
  const quickLinks = ['Home', 'Features', 'How it works', 'About'];

  return (
    <footer className="bg-gradient-to-br from-slate-50 to-emerald-50/30 border-t border-emerald-900/10 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/10 rounded-full filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-700/10 rounded-full filter blur-3xl opacity-30"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <motion.div 
            className="col-span-1 md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="flex items-center gap-2 mb-4 cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-800 to-slate-800 rounded-lg flex items-center justify-center text-white shadow-md">
                <span>GP</span>
              </div>
              <span className="text-xl bg-gradient-to-r from-emerald-900 to-slate-800 bg-clip-text text-transparent">GPRS</span>
            </motion.div>
            <p className="text-slate-600 max-w-md leading-relaxed">
              Graduation Project Recommendation System - Empowering students with AI-driven project analysis and supervisor matching.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="mb-4 text-slate-800">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                >
                  <a 
                    href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-slate-600 hover:text-emerald-800 transition-colors inline-block group"
                  >
                    <span className="relative">
                      {link}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-800 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div 
          className="pt-8 border-t border-emerald-900/10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-slate-600">
            &copy; {new Date().getFullYear()} GPRS
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
