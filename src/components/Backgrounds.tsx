import { motion } from "motion/react";
import { useEffect, useState } from "react";

// ============================================
// 1. INTERACTIVE BACKGROUND (Modern Gradient with Glowing Orbs)
// Modern interactive gradient background with 3 glowing orbs in corners
// Colors: White (Slate 50) → Green (Cyan 50-600) → Gray (Slate 100)
// Very low opacity (3-8%) for eye comfort
// ============================================
export function InteractiveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Gradient - White to Light Green */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-cyan-50/40 to-slate-100/60" />

      {/* Top Right Corner - Glowing Cyan Orb */}
      <motion.div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(8, 145, 178, 0.05) 35%, rgba(14, 116, 144, 0.03) 60%, transparent 80%)',
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.85, 0.6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Bottom Left Corner - Glowing Slate Orb */}
      <motion.div
        className="absolute -bottom-40 -left-40 w-[650px] h-[650px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(100, 116, 139, 0.07) 0%, rgba(71, 85, 105, 0.04) 40%, rgba(51, 65, 85, 0.02) 65%, transparent 80%)',
          filter: 'blur(70px)',
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.5, 0.75, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Center Top - Glowing Cyan Orb */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, rgba(6, 182, 212, 0.04) 45%, rgba(8, 145, 178, 0.02) 70%, transparent 85%)',
          filter: 'blur(65px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Subtle Corner Accent - Top Left */}
      <motion.div
        className="absolute top-0 left-0 w-[300px] h-[300px]"
        style={{
          background: 'radial-gradient(circle at top left, rgba(224, 242, 254, 0.08) 0%, rgba(186, 230, 253, 0.04) 50%, transparent 75%)',
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle Corner Accent - Bottom Right */}
      <motion.div
        className="absolute bottom-0 right-0 w-[350px] h-[350px]"
        style={{
          background: 'radial-gradient(circle at bottom right, rgba(241, 245, 249, 0.07) 0%, rgba(203, 213, 225, 0.04) 50%, transparent 75%)',
          filter: 'blur(45px)',
        }}
        animate={{
          opacity: [0.35, 0.65, 0.35],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />

      {/* Floating Small Particles - Very Subtle */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: i % 3 === 0 
              ? 'rgba(6, 182, 212, 0.15)' 
              : i % 3 === 1
              ? 'rgba(100, 116, 139, 0.12)'
              : 'rgba(186, 230, 253, 0.18)',
            left: `${15 + Math.random() * 70}%`,
            top: `${15 + Math.random() * 70}%`,
            boxShadow: i % 3 === 0 
              ? '0 0 8px rgba(6, 182, 212, 0.2)' 
              : i % 3 === 1
              ? '0 0 6px rgba(100, 116, 139, 0.15)'
              : '0 0 10px rgba(186, 230, 253, 0.25)',
          }}
          animate={{
            x: [0, Math.random() * 60 - 30, 0],
            y: [0, Math.random() * 60 - 30, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10 + Math.random() * 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}

      {/* Ultra Subtle Dot Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(6, 182, 212, 0.4) 1px, transparent 0)',
          backgroundSize: '80px 80px'
        }}
      />

      {/* Soft Vignette Effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(248, 250, 252, 0.4) 100%)'
        }}
      />
    </div>
  );
}

// ============================================
// 2. INTERACTIVE GRADIENT MESH BACKGROUND
// خلفية شبكة تدرجية تفاعلية مع جزيئات عائمة وكرات ديناميكية
// ============================================
export function SimpleInteractiveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Gradient - White → Cyan → Gray */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-100/50" />

      {/* Mesh Grid Pattern - 60x60px, 3% opacity */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(14, 116, 144, 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Dot Pattern - Very Fine */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.4) 0.5px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Dynamic Orb 1 - Cyan Glow (Top Right) */}
      <motion.div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(14, 116, 144, 0.04) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, 50, 0],
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Dynamic Orb 2 - Slate Glow (Bottom Left) */}
      <motion.div
        className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(15, 23, 42, 0.06) 0%, rgba(51, 65, 85, 0.03) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.12, 1],
          opacity: [0.5, 0.75, 0.5],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Dynamic Orb 3 - Cyan Center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(8, 145, 178, 0.05) 0%, rgba(6, 182, 212, 0.025) 50%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [-30, 30, -30],
          y: [30, -30, 30],
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Floating Particles - 15 particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`gradient-particle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 3 === 0 
              ? 'rgba(6, 182, 212, 0.4)' 
              : i % 3 === 1
              ? 'rgba(15, 23, 42, 0.35)'
              : 'rgba(14, 116, 144, 0.38)',
            left: `${Math.random() * 100}%`,
            top: `${100 + Math.random() * 20}%`,
            boxShadow: i % 3 === 0 
              ? '0 0 6px rgba(6, 182, 212, 0.6)' 
              : i % 3 === 1
              ? '0 0 6px rgba(15, 23, 42, 0.5)'
              : '0 0 6px rgba(14, 116, 144, 0.55)',
          }}
          animate={{
            y: [0, -1200],
            x: [0, Math.random() * 100 - 50],
            opacity: [0, 0.6, 0.8, 0.6, 0],
            scale: [0.8, 1.2, 1, 0.8],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
            delay: i * 1.5,
          }}
        />
      ))}

      {/* Technical Lines - Horizontal Pulsing */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`tech-line-${i}`}
          className="absolute left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(6, 182, 212, 0.15), transparent)',
            top: `${20 + i * 25}%`,
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scaleX: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}

      {/* Corner Accents - Subtle Lights */}
      <motion.div
        className="absolute top-0 left-0 w-[300px] h-[300px]"
        style={{
          background: 'radial-gradient(circle at top left, rgba(6, 182, 212, 0.06) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-[300px] h-[300px]"
        style={{
          background: 'radial-gradient(circle at bottom right, rgba(15, 23, 42, 0.05) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Subtle Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(248, 250, 252, 0.3) 100%)'
        }}
      />
    </div>
  );
}

// ============================================
// 3. GREEN GRADIENT BACKGROUND (Landing Page Hero)
// خلفية تدرجية خضراء تفاعلية مع كرات ديناميكية
// ============================================
export function GreenGradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Gradient - White → Green → Gray */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100/50" />

      {/* Dynamic Orb 1 - Emerald Glow (Top Right) */}
      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.04) 40%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, -60, 0],
          y: [0, 60, 0],
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Dynamic Orb 2 - Green Glow (Bottom Left) */}
      <motion.div
        className="absolute bottom-0 left-0 w-[550px] h-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, rgba(74, 222, 128, 0.03) 40%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, 70, 0],
          y: [0, -50, 0],
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Dynamic Orb 3 - Emerald Center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.025) 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [-40, 40, -40],
          y: [40, -40, 40],
          scale: [1, 1.25, 1],
          opacity: [0.3, 0.65, 0.3],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Corner Accent - Top Left (Emerald) */}
      <motion.div
        className="absolute top-0 left-0 w-[350px] h-[350px]"
        style={{
          background: 'radial-gradient(circle at top left, rgba(16, 185, 129, 0.07) 0%, rgba(5, 150, 105, 0.03) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          opacity: [0.4, 0.75, 0.4],
          scale: [1, 1.12, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Corner Accent - Bottom Right (Gray-Green) */}
      <motion.div
        className="absolute bottom-0 right-0 w-[350px] h-[350px]"
        style={{
          background: 'radial-gradient(circle at bottom right, rgba(100, 116, 139, 0.05) 0%, rgba(148, 163, 184, 0.025) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.18, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Subtle Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(248, 250, 252, 0.3) 100%)'
        }}
      />
    </div>
  );
}

// =============================================
// 4. SUPERVISOR BACKGROUND (Supervisor - Navy & Olive)
// =============================================
export function SupervisorBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Colored Background - Navy & Olive Green */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-green-50" />
      
      {/* Strong Colored Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/60 via-slate-100/40 to-green-100/50" />

      {/* Large Floating Navy Orbs - VERY VISIBLE */}
      <motion.div
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(30, 58, 138, 0.65) 0%, rgba(59, 130, 246, 0.45) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 left-0 w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(52, 73, 94, 0.60) 0%, rgba(71, 85, 105, 0.40) 40%, transparent 70%)',
          filter: 'blur(90px)',
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, -50, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Olive Green Orbs - VERY VISIBLE */}
      <motion.div
        className="absolute top-1/2 left-1/3 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(71, 85, 65, 0.55) 0%, rgba(82, 95, 75, 0.35) 50%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, 50, 0],
          scale: [1, 1.4, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-1/4 right-1/4 w-[650px] h-[650px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(29, 78, 216, 0.58) 0%, rgba(37, 99, 235, 0.38) 45%, transparent 70%)',
          filter: 'blur(75px)',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 right-1/3 w-[550px] h-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(64, 75, 65, 0.50) 0%, rgba(75, 88, 78, 0.30) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 40, 0],
          y: [0, 60, 0],
          scale: [1.05, 1.35, 1.05],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Additional Navy Blue Orb */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(30, 64, 175, 0.52) 0%, rgba(59, 130, 246, 0.32) 50%, transparent 70%)',
          filter: 'blur(65px)',
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 19,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Navy Grid Pattern - More Visible */}
      <div 
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(29, 78, 216) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgb(29, 78, 216) 1.5px, transparent 1.5px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Olive Dot Pattern - More Visible */}
      <div 
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(71, 85, 65) 2px, transparent 0)',
          backgroundSize: '45px 45px'
        }}
      />

      {/* Corner Accents - MAXIMUM VISIBILITY */}
      <motion.div
        className="absolute top-0 left-0 w-[450px] h-[450px]"
        style={{
          background: 'radial-gradient(circle at top left, rgba(37, 99, 235, 0.45) 0%, rgba(59, 130, 246, 0.25) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-[450px] h-[450px]"
        style={{
          background: 'radial-gradient(circle at bottom right, rgba(64, 75, 65, 0.42) 0%, rgba(82, 95, 75, 0.22) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Top Right Olive Accent */}
      <motion.div
        className="absolute top-1/4 right-0 w-[400px] h-[400px]"
        style={{
          background: 'radial-gradient(circle at top right, rgba(71, 85, 65, 0.40) 0%, rgba(82, 95, 75, 0.20) 50%, transparent 70%)',
          filter: 'blur(45px)',
        }}
        animate={{
          opacity: [0.7, 0.95, 0.7],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Bottom Left Navy Accent */}
      <motion.div
        className="absolute bottom-1/4 left-0 w-[400px] h-[400px]"
        style={{
          background: 'radial-gradient(circle at bottom left, rgba(30, 58, 138, 0.38) 0%, rgba(59, 130, 246, 0.18) 50%, transparent 70%)',
          filter: 'blur(45px)',
        }}
        animate={{
          opacity: [0.7, 0.95, 0.7],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />

      {/* Subtle Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255, 255, 255, 0.15) 100%)'
        }}
      />
    </div>
  );
}

// =============================================
// 3. NEURAL BACKGROUND (Interactive Neural Network)
// =============================================
interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function NeuralBackground() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize nodes
    const initialNodes: Node[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.03,
      vy: (Math.random() - 0.5) * 0.03,
    }));
    setNodes(initialNodes);

    // Animate nodes
    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          let newX = node.x + node.vx;
          let newY = node.y + node.vy;
          let newVx = node.vx;
          let newVy = node.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= 100) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(100, newX));
          }
          if (newY <= 0 || newY >= 100) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(100, newY));
          }

          return {
            ...node,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Calculate connections
  const connections = nodes.flatMap((node, i) =>
    nodes.slice(i + 1).map((otherNode) => {
      const distance = Math.sqrt(
        Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
      );
      return distance < 15 ? { from: node, to: otherNode, distance } : null;
    }).filter(Boolean)
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
      {/* Floating Orbs */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute w-32 h-32 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${
                i % 3 === 0 ? 'rgba(6, 95, 70, 0.15)' : 
                i % 3 === 1 ? 'rgba(15, 118, 110, 0.15)' : 
                'rgba(15, 23, 42, 0.15)'
              } 0%, transparent 70%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      <svg className="w-full h-full" preserveAspectRatio="none">
        {/* Connections */}
        {connections.map((conn, i) => {
          if (!conn) return null;
          const opacity = 1 - conn.distance / 15;
          return (
            <motion.line
              key={`line-${i}`}
              x1={`${conn.from.x}%`}
              y1={`${conn.from.y}%`}
              x2={`${conn.to.x}%`}
              y2={`${conn.to.y}%`}
              stroke="url(#neural-gradient)"
              strokeWidth="1"
              opacity={opacity * 0.4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2 }}
            />
          );
        })}

        {/* Mouse connections */}
        {nodes.map((node) => {
          const distance = Math.sqrt(
            Math.pow(node.x - mousePos.x, 2) + Math.pow(node.y - mousePos.y, 2)
          );
          if (distance > 20) return null;
          const opacity = 1 - distance / 20;
          return (
            <motion.line
              key={`mouse-${node.id}`}
              x1={`${mousePos.x}%`}
              y1={`${mousePos.y}%`}
              x2={`${node.x}%`}
              y2={`${node.y}%`}
              stroke="url(#neural-gradient-bright)"
              strokeWidth="2"
              opacity={opacity * 0.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: opacity * 0.6 }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <motion.circle
            key={node.id}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r="3"
            fill="url(#node-gradient)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: node.id * 0.01 }}
          />
        ))}

        {/* Gradients */}
        <defs>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#065f46" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0f766e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="neural-gradient-bright" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="1" />
          </linearGradient>
          <radialGradient id="node-gradient">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
