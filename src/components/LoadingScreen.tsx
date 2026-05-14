import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import SparkxLogo from "@/components/SparkxLogo";

interface LoadingScreenProps {
  prompt: string;
  onComplete: () => void;
  aiProgress?: number;
  aiStatus?: string;
  onBack?: () => void;
}

const steps = [
  { text: "Analyzing your vision", icon: "🔍" },
  { text: "Designing color palette", icon: "🎨" },
  { text: "Crafting layout structure", icon: "📐" },
  { text: "Writing unique content", icon: "✍️" },
  { text: "Generating AI images", icon: "🤖" },
  { text: "Building sections", icon: "📱" },
  { text: "Polishing details", icon: "✨" },
  { text: "Almost ready", icon: "💎" },
];

const LoadingScreen = ({ prompt, onComplete, aiProgress = 0, aiStatus, onBack }: LoadingScreenProps) => {
  const [visualProgress, setVisualProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const completeCalled = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisualProgress(prev => {
        const aiDone = aiProgress >= 100;
        if (aiDone) {
          const next = Math.min(prev + 2, 100);
          if (next >= 100 && !completeCalled.current) {
            completeCalled.current = true;
            clearInterval(interval);
            setTimeout(onComplete, 400);
          }
          return next;
        }
        return Math.min(prev + 0.3 + Math.random() * 0.2, 85);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete, aiProgress]);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, steps.length - 1));
    }, 700);
    return () => clearInterval(stepInterval);
  }, []);

  const displayStatus = aiStatus || steps[stepIndex]?.text || "";

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 200% 150% at 50% 0%, #1a1a1a 0%, #141414 30%, #111111 55%, #0d0d0d 100%)" }}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute" style={{ top: "-20%", left: "-15%", width: 800, height: 800, background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)", filter: "blur(100px)" }} />
        <div className="absolute" style={{ bottom: "-20%", right: "-15%", width: 700, height: 700, background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 65%)", filter: "blur(100px)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onBack(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", fontFamily: "'Outfit', sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
            >
              <ArrowLeft className="w-3 h-3" /><span>Back</span>
            </button>
          )}
          <SparkxLogo isDark={true} size="md" />
        </div>
        <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Outfit', sans-serif" }}>Website Studio</span>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col items-center justify-center text-center max-w-md w-full mx-auto px-6 relative z-10"
      >
        <div className="relative w-36 h-36 mx-auto mb-14">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full" style={{ border: "1.5px solid transparent", borderTopColor: "rgba(124,58,237,0.5)", borderRightColor: "rgba(124,58,237,0.1)" }} />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full" style={{ border: "1.5px solid transparent", borderBottomColor: "rgba(236,72,153,0.4)", borderLeftColor: "rgba(236,72,153,0.08)" }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-8 rounded-full" style={{ border: "1px solid transparent", borderTopColor: "rgba(6,182,212,0.35)" }} />
          <motion.div animate={{ scale: [0.7, 1, 0.7], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        </div>

        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold mb-3 text-white/95" style={{ fontFamily: "'Cinzel', serif" }}>
          Crafting Your Website
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mb-12 text-sm truncate max-w-xs mx-auto text-white/20">"{prompt}"</motion.p>

        <div className="mb-8 h-8">
          <motion.div key={displayStatus} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2.5">
            <span className="text-base">{steps[stepIndex]?.icon || "✨"}</span>
            <span className="text-sm font-medium text-white/35">{displayStatus}</span>
          </motion.div>
        </div>

        <div className="relative w-full h-1 rounded-full overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.04)" }}>
          <motion.div className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa, #ec4899)", width: `${visualProgress}%` }}
            transition={{ duration: 0.05 }} />
          <motion.div className="absolute inset-0 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)", backgroundSize: "200% 100%" }}
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
        </div>

        <div className="flex justify-between items-center w-full">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ background: i <= stepIndex ? "rgba(124,58,237,0.7)" : "rgba(255,255,255,0.04)" }}
                animate={i === stepIndex ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.5 }} />
            ))}
          </div>
          <span className="text-sm font-bold tabular-nums font-mono text-white/25">{Math.round(visualProgress)}%</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
