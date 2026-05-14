import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, Layers, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SparkxLogo from "@/components/SparkxLogo";
import SparkxText from "@/components/SparkxText";

const placeholders = [
  "A luxury perfume ad with golden tones...",
  "Retro sci-fi movie poster with neon lights...",
  "Fashion editorial magazine cover...",
  "Minimalist tech product launch...",
  "Neon cyberpunk nightclub event...",
  "Vintage jazz concert poster...",
];

const templates = [
  { label: "Luxury Perfume", prompt: "Luxury perfume ad with golden tones and dark elegance", emoji: "✨", accent: "#d4a843" },
  { label: "Sci-Fi Movie", prompt: "Retro sci-fi movie poster with neon lights and space", emoji: "🚀", accent: "#60a5fa" },
  { label: "Fashion Cover", prompt: "Fashion editorial magazine cover bold and modern", emoji: "👗", accent: "#f472b6" },
  { label: "Tech Launch", prompt: "Minimalist tech product launch clean and futuristic", emoji: "💻", accent: "#94a3b8" },
  { label: "Cyberpunk", prompt: "Neon cyberpunk nightclub event poster dark city vibes", emoji: "🌆", accent: "#22d3ee" },
  { label: "Jazz Concert", prompt: "Vintage jazz concert poster warm retro tones", emoji: "🎷", accent: "#fb923c" },
  { label: "Fantasy Epic", prompt: "Epic fantasy movie poster dramatic lighting and magic", emoji: "🧙", accent: "#a78bfa" },
  { label: "Travel", prompt: "Tropical travel destination poster vibrant and dreamy", emoji: "🌴", accent: "#34d399" },
];

interface PosterPromptPageProps {
  onGenerate: (prompt: string) => void;
}

const PosterPromptPage = ({ onGenerate }: PosterPromptPageProps) => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (isFocused) return;
    const target = placeholders[placeholderIndex];
    if (isTyping) {
      if (displayedPlaceholder.length < target.length) {
        const t = setTimeout(() => setDisplayedPlaceholder(target.slice(0, displayedPlaceholder.length + 1)), 42);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setIsTyping(false), 2200);
        return () => clearTimeout(t);
      }
    } else {
      if (displayedPlaceholder.length > 0) {
        const t = setTimeout(() => setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1)), 18);
        return () => clearTimeout(t);
      } else {
        setPlaceholderIndex(i => (i + 1) % placeholders.length);
        setIsTyping(true);
      }
    }
  }, [displayedPlaceholder, isTyping, placeholderIndex, isFocused]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 200% 150% at 50% 0%, #1a1a1a 0%, #141414 30%, #111111 55%, #0d0d0d 100%)" }}>

      {/* Ambient orbs */}
      <div className="absolute pointer-events-none" style={{ top: "-10%", left: "-5%", width: 600, height: 600, background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)", filter: "blur(100px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "-10%", right: "-5%", width: 500, height: 500, background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 65%)", filter: "blur(100px)" }} />

      {/* Fine grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", fontFamily: "'Outfit', sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
            <ArrowLeft className="w-3 h-3" /><span>Back</span>
          </motion.button>
          <SparkxLogo isDark={true} />
        </div>
        <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Outfit', sans-serif" }}>Poster Studio</span>
      </motion.header>

      {/* Poster frame preview */}
      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-8">
        <div className="text-center max-w-4xl mx-auto w-full">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.85, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-10"
            style={{ border: "1px solid rgba(168,85,247,0.18)", background: "rgba(168,85,247,0.06)", backdropFilter: "blur(12px)" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: "rgba(192,132,252,0.7)" }} />
            </motion.div>
            <span className="text-[11px] font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Outfit', sans-serif" }}>
              Describe your vision → Get a stunning AI poster
            </span>
            <motion.div className="w-1.5 h-1.5 rounded-full" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }} style={{ background: "#c084fc" }} />
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold mb-5 leading-[1.02] tracking-tight"
            style={{ fontFamily: "'Cinzel', serif" }}>
            <span style={{ color: "rgba(255,255,255,0.92)" }}>Design it.</span>
            <br />
            <motion.span className="bg-clip-text text-transparent inline-block"
              style={{ backgroundImage: "linear-gradient(90deg, #c084fc, #e879f9, #f472b6, #fb923c, #c084fc)", backgroundSize: "300% 100%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              Instantly.
            </motion.span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="text-base sm:text-lg mb-14 max-w-lg mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Space Grotesk', sans-serif" }}>
            Describe any idea and watch AI generate a stunning poster with custom imagery, typography, and effects.
          </motion.p>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-2xl mx-auto mb-12">

            <AnimatePresence>
              {isFocused && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute -inset-4 rounded-3xl pointer-events-none"
                  style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)", filter: "blur(24px)" }} />
              )}
            </AnimatePresence>

            <div className="relative rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #1a1a1a, #161616)",
                border: `1px solid ${isFocused ? "rgba(168,85,247,0.45)" : "rgba(255,255,255,0.07)"}`,
                boxShadow: isFocused ? "0 0 0 3px rgba(168,85,247,0.08), 0 28px 70px rgba(0,0,0,0.55)" : "0 8px 40px rgba(0,0,0,0.4)",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}>

              <AnimatePresence>
                {isFocused && (
                  <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }}
                    transition={{ duration: 0.4 }} className="absolute top-0 left-0 right-0 h-px origin-left pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.9), rgba(236,72,153,0.6), transparent)" }} />
                )}
              </AnimatePresence>

              <div className="flex items-center p-2">
                <div className="pl-4 pr-2">
                  <motion.div animate={isFocused ? { rotate: [0, 20, -20, 0], scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.5 }}>
                    <Sparkles className="w-5 h-5 transition-colors duration-300" style={{ color: isFocused ? "#c084fc" : "rgba(255,255,255,0.15)" }} />
                  </motion.div>
                </div>
                <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                  onKeyDown={e => e.key === "Enter" && prompt.trim() && onGenerate(prompt.trim())}
                  placeholder={isFocused ? "" : displayedPlaceholder + "│"}
                  className="flex-1 px-3 py-4 bg-transparent text-base outline-none text-white placeholder:text-white/20"
                  style={{ fontFamily: "'Outfit', sans-serif" }} />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => prompt.trim() && onGenerate(prompt.trim())}
                  disabled={!prompt.trim()}
                  className="flex items-center gap-2 px-6 py-3.5 m-1 rounded-xl font-semibold text-sm text-white disabled:opacity-20 transition-all duration-300 relative overflow-hidden"
                  style={{
                    background: prompt.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)" : "rgba(255,255,255,0.04)",
                    boxShadow: prompt.trim() ? "0 4px 24px rgba(168,85,247,0.45)" : "none",
                    border: prompt.trim() ? "none" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                  {prompt.trim() && (
                    <motion.div className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }}
                      animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5 }} />
                  )}
                  <Play className="w-4 h-4 relative z-10" fill="currentColor" />
                  <span className="relative z-10" style={{ fontFamily: "'Outfit', sans-serif" }}>Generate</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Templates */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }} className="max-w-3xl mx-auto mb-10">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px flex-1 max-w-[60px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08))" }} />
              <motion.div animate={{ rotate: [0, 180, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                <Layers className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />
              </motion.div>
              <span className="text-[10px] tracking-[0.25em] uppercase font-medium" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Outfit', sans-serif" }}>Quick Ideas</span>
              <motion.div animate={{ rotate: [360, 180, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                <Layers className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />
              </motion.div>
              <div className="h-px flex-1 max-w-[60px]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)" }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {templates.map((t, i) => (
                <motion.button key={t.label}
                  initial={{ opacity: 0, y: 14, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.95 + i * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onGenerate(t.prompt)}
                  className="group relative overflow-hidden text-left px-4 py-3 rounded-xl transition-all duration-300"
                  style={{ background: "linear-gradient(145deg, #1a1a1a, #161616)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${t.accent}35`; e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.4), 0 0 20px ${t.accent}10`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 50% 100%, ${t.accent}08, transparent 70%)` }} />
                  <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${t.accent}50, transparent)` }} />
                  <div className="relative flex items-center gap-2.5">
                    <span className="text-base">{t.emoji}</span>
                    <p className="text-xs font-semibold text-white/55 group-hover:text-white/85 transition-colors truncate flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{t.label}</p>
                    <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-white/35 shrink-0 transition-all group-hover:translate-x-0.5" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="relative z-10 py-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}><span style={{ color: "rgba(255,255,255,0.5)", WebkitTextFillColor: "rgba(255,255,255,0.5)" }}>POWERED BY SPARK</span><span style={{ background: "linear-gradient(90deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>X</span><span style={{ color: "rgba(255,255,255,0.5)", WebkitTextFillColor: "rgba(255,255,255,0.5)" }}> AI</span></p>
      </motion.div>
    </div>
  );
};

export default PosterPromptPage;
