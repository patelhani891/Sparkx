import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { WebsiteContent } from "@/lib/generateContent";

interface IntroAnimationProps {
  content: WebsiteContent;
  onComplete: () => void;
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const steps = [
  "Analyzing your brand...",
  "Generating AI content...",
  "Crafting visual identity...",
  "Building layout structure...",
  "Applying typography...",
  "Finalizing design...",
];

const IntroAnimation = ({ content, onComplete }: IntroAnimationProps) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(onComplete, 4200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(i => i < steps.length - 1 ? i + 1 : i);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const { primary, accent } = content.colorScheme;

  // Pastel background colors
  const pastelBg = "#f5f0ff";
  const pastelText = "#2d1b69";

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fdf6ec 0%, #fef0f5 35%, #f0f0ff 65%, #edfdf5 100%)" }}
    >
      {/* Soft pastel orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute" style={{ top: "-10%", left: "-10%", width: 700, height: 700, background: "radial-gradient(circle, rgba(192,132,252,0.25) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute" style={{ bottom: "-10%", right: "-10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(244,114,182,0.2) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute" style={{ top: "30%", right: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(129,140,248,0.18) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div className="absolute" style={{ bottom: "20%", left: "5%", width: 350, height: 350, background: "radial-gradient(circle, rgba(110,231,183,0.15) 0%, transparent 65%)", filter: "blur(60px)" }} />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Floating pastel particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: 4 + (i % 3) * 3, height: 4 + (i % 3) * 3,
            background: ["rgba(192,132,252,0.5)", "rgba(244,114,182,0.5)", "rgba(129,140,248,0.5)", "rgba(110,231,183,0.4)"][i % 4],
            left: `${8 + (i * 7.5) % 85}%`,
            top: `${12 + (i * 11) % 75}%`,
            filter: "blur(1px)",
          }}
          animate={{ y: [0, -30 - i * 4, 0], x: [0, i % 2 === 0 ? 12 : -12, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
        />
      ))}

      <div className="relative z-10 px-6 max-w-3xl text-center mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.3, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease }}
          className="mx-auto mb-8 rounded-2xl flex items-center justify-center text-white text-2xl font-black"
          style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${primary}, ${accent})`, boxShadow: `0 14px 40px ${primary}40, 0 0 80px ${primary}15` }}
        >
          {content.siteName.charAt(0)}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-5">
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.7, ease }}
            className="h-px w-20 origin-right" style={{ background: `linear-gradient(90deg, transparent, ${primary}50)` }} />
          <motion.div initial={{ scale: 0, rotate: 45 }} animate={{ scale: 1, rotate: 45 }} transition={{ delay: 0.5, duration: 0.4, ease }}
            className="w-1.5 h-1.5" style={{ background: primary, boxShadow: `0 0 12px ${primary}` }} />
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.7, ease }}
            className="h-px w-20 origin-left" style={{ background: `linear-gradient(90deg, ${primary}50, transparent)` }} />
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.7, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
          className="text-[10px] tracking-[0.4em] uppercase mb-4 font-semibold" style={{ color: primary }}>
          {content.introSubtitle}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.6, duration: 1, ease }}
          className="font-bold mb-4 leading-[1.05] text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ fontFamily: "var(--font-display)", color: pastelText, textShadow: `0 0 40px ${primary}20` }}
        >
          {content.siteName}
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.75, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }}
          className="text-lg sm:text-xl font-medium mb-3 max-w-lg mx-auto leading-relaxed"
          style={{ color: "rgba(45,27,105,0.6)", fontFamily: "var(--font-display)" }}>
          {content.tagline}
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          className="flex flex-wrap gap-2 justify-center mb-6 max-w-md mx-auto">
          {content.introKeywords?.slice(0, 5).map((kw, i) => (
            <motion.span key={kw}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 0.5, scale: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}
              className="px-3 py-1 rounded-full text-[10px] font-medium tracking-wide"
              style={{ background: `${primary}10`, color: `${primary}cc`, border: `1px solid ${primary}15` }}>
              {kw}
            </motion.span>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="mt-4 max-w-xs mx-auto">
          <div className="h-[2px] rounded-full overflow-hidden" style={{ background: `${primary}10` }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${primary}, ${accent})`, boxShadow: `0 0 12px ${primary}40` }}
              initial={{ width: "0%" }} animate={{ width: "100%" }}
              transition={{ delay: 1.4, duration: 2.5, ease: "easeInOut" }}
            />
          </div>
          <motion.div className="mt-3 h-4 overflow-hidden" key={stepIndex}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.35, y: 0 }} transition={{ duration: 0.3 }}>
            <p className="text-[9px] tracking-[0.3em] uppercase text-center" style={{ color: "rgba(45,27,105,0.4)" }}>
              {steps[stepIndex]}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default IntroAnimation;
