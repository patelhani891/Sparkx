import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, Compass, Layers, ChevronRight, ArrowLeft, LogOut } from "lucide-react";
import SparkxLogo from "@/components/SparkxLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const placeholders = [
  "A luxury tea brand with zen aesthetics...",
  "A bold lipstick brand with glamorous vibes...",
  "A cozy pizza place with rustic Italian charm...",
  "A high-energy fitness studio...",
  "A minimalist photography portfolio...",
  "A streetwear sneaker store...",
];

const templates = [
  { label: "Tea Shop", prompt: "Premium tea selling online store", emoji: "🍵", accent: "#34d399" },
  { label: "Beauty Brand", prompt: "Luxury lipstick and cosmetics selling brand", emoji: "💄", accent: "#f472b6" },
  { label: "Restaurant", prompt: "Fine dining Italian restaurant with wine bar", emoji: "🍷", accent: "#f87171" },
  { label: "Coffee Shop", prompt: "Artisan coffee shop and roastery", emoji: "☕", accent: "#fbbf24" },
  { label: "Tech Startup", prompt: "AI-powered SaaS analytics platform startup", emoji: "🚀", accent: "#60a5fa" },
  { label: "Photography", prompt: "Wedding and portrait photography portfolio", emoji: "📸", accent: "#a78bfa" },
  { label: "Sneaker Store", prompt: "Premium sneaker and footwear selling store", emoji: "👟", accent: "#fb923c" },
  { label: "Jewelry Brand", prompt: "Handcrafted gold and diamond jewelry boutique", emoji: "💎", accent: "#fcd34d" },
  { label: "Bakery", prompt: "Artisan bakery and cake shop with fresh pastries", emoji: "🧁", accent: "#fb7185" },
  { label: "Fitness Gym", prompt: "Modern fitness gym and personal training studio", emoji: "💪", accent: "#818cf8" },
  { label: "Plant Shop", prompt: "Indoor plant and succulent selling nursery", emoji: "🌿", accent: "#4ade80" },
  { label: "Pet Store", prompt: "Premium pet supplies and grooming shop", emoji: "🐾", accent: "#2dd4bf" },
];

interface SearchPageProps {
  onGenerate: (prompt: string) => void;
  onBack?: () => void;
}

const SearchPage = ({ onGenerate, onBack }: SearchPageProps) => {
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = placeholders[placeholderIndex];
    if (isTyping) {
      if (displayedPlaceholder.length < target.length) {
        const timer = setTimeout(() => setDisplayedPlaceholder(target.slice(0, displayedPlaceholder.length + 1)), 40);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setIsTyping(false), 2000);
        return () => clearTimeout(timer);
      }
    } else {
      if (displayedPlaceholder.length > 0) {
        const timer = setTimeout(() => setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1)), 20);
        return () => clearTimeout(timer);
      } else {
        setPlaceholderIndex((i) => (i + 1) % placeholders.length);
        setIsTyping(true);
      }
    }
  }, [displayedPlaceholder, isTyping, placeholderIndex]);

  const handleSubmit = () => {
    if (prompt.trim()) onGenerate(prompt.trim());
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col relative" style={{ background: "radial-gradient(ellipse 200% 150% at 50% 0%, #1a1a1a 0%, #141414 30%, #111111 55%, #0d0d0d 100%)", overflowX: "hidden" }}>
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Purple orb top-left */}
        <div className="absolute pointer-events-none" style={{ top: "-20%", left: "-15%", width: 800, height: 800, background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)", filter: "blur(100px)" }} />
        {/* Pink orb bottom-right */}
        <div className="absolute pointer-events-none" style={{ bottom: "-20%", right: "-15%", width: 700, height: 700, background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 65%)", filter: "blur(100px)" }} />
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
        className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <motion.button whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", fontFamily: "'Outfit', sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
              <ArrowLeft className="w-3 h-3" /><span>Back</span>
            </motion.button>
          )}
          <SparkxLogo isDark={true} size="md" />
        </div>
        <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Outfit', sans-serif" }}>Website Studio</span>
      </motion.header>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-8">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
          className="text-center max-w-4xl mx-auto w-full">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-10 border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
              <Compass className="w-3.5 h-3.5 text-violet-400/70" />
            </motion.div>
            <span className="text-[11px] font-medium text-white/35 tracking-wide">Describe your business → Get a unique AI website</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold mb-5 leading-[1.02] tracking-tight"
            style={{ fontFamily: "'Cinzel', serif" }}>
            <span className="text-white/95">Imagine it.</span><br />
            <motion.span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #c084fc, #f472b6, #fb923c, #a78bfa)", backgroundSize: "300% 100%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              We craft it.
            </motion.span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-base sm:text-lg mb-14 max-w-lg mx-auto leading-relaxed text-white/25"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Describe any business idea and watch AI create a stunning, fully-designed website with custom AI-generated images.
          </motion.p>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }}
            className="relative max-w-2xl mx-auto mb-10">
            <AnimatePresence>
              {isFocused && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute -inset-2 rounded-3xl"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.12), rgba(6,182,212,0.08))", filter: "blur(24px)" }} />
              )}
            </AnimatePresence>
            <div className={`relative rounded-2xl transition-all duration-500 overflow-hidden ${isFocused ? "ring-1 ring-violet-500/25" : ""}`}
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${isFocused ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.06)"}`, backdropFilter: "blur(20px)" }}>
              <div className="flex items-center p-1.5">
                <div className="pl-5 pr-2">
                  <motion.div animate={isFocused ? { rotate: [0, 15, -15, 0] } : {}} transition={{ duration: 0.5 }}>
                    <Sparkles className={`w-5 h-5 transition-colors duration-300 ${isFocused ? "text-violet-400" : "text-white/12"}`} />
                  </motion.div>
                </div>
                <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder={displayedPlaceholder + "│"}
                  className="flex-1 px-3 py-4.5 bg-transparent text-base outline-none text-white/90 placeholder:text-white/15"
                  style={{ fontFamily: "'DM Sans', sans-serif" }} />
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                  disabled={!prompt.trim()}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-8 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
                  style={{ background: prompt.trim() ? "linear-gradient(135deg, #7c3aed, #6366f1)" : "transparent" }}>
                  {prompt.trim() && (
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                  )}
                  <Play className="w-4 h-4 relative z-10" fill="currentColor" /> <span className="relative z-10">Generate</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Template Gallery */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
            className="max-w-3xl mx-auto mb-14">
            <div className="flex items-center justify-center gap-2 mb-5">
              <Layers className="w-3.5 h-3.5 text-white/15" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/15 font-medium">Try a Template</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {templates.map((t, i) => (
                <motion.button key={t.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.03 }}
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onGenerate(t.prompt)}
                  className="group relative overflow-hidden text-left px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300">
                  {/* Accent glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 100%, ${t.accent}12, transparent 70%)` }} />
                  <div className="relative flex items-center gap-2.5">
                    <span className="text-lg">{t.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white/45 group-hover:text-white/70 transition-colors truncate">{t.label}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-white/8 group-hover:text-white/25 shrink-0 transition-all group-hover:translate-x-0.5" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>


        </motion.div>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="relative z-10 py-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}><span style={{ color: "rgba(255,255,255,0.5)", WebkitTextFillColor: "rgba(255,255,255,0.5)" }}>POWERED BY SPARK</span><span style={{ background: "linear-gradient(90deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>X</span><span style={{ color: "rgba(255,255,255,0.5)", WebkitTextFillColor: "rgba(255,255,255,0.5)" }}> AI</span></p>
      </motion.div>
    </div>
  );
};

export default SearchPage;
