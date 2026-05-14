import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, ChevronRight, Hash } from "lucide-react";

interface PromptBarProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const QUICK_PROMPTS = [
  { label: "Luxury perfume ad with golden tones", tag: "Luxury", color: "#d4a843" },
  { label: "Retro sci-fi movie poster", tag: "Cinematic", color: "#60a5fa" },
  { label: "Fashion editorial magazine cover", tag: "Editorial", color: "#f472b6" },
  { label: "Minimalist tech product launch", tag: "Minimal", color: "#94a3b8" },
  { label: "Neon cyberpunk nightclub event", tag: "Neon", color: "#22d3ee" },
  { label: "Vintage jazz concert poster", tag: "Vintage", color: "#fb923c" },
  { label: "Epic fantasy movie poster", tag: "Fantasy", color: "#a78bfa" },
  { label: "Tropical travel destination", tag: "Travel", color: "#34d399" },
];

const PromptBar = ({ onGenerate, isGenerating }: PromptBarProps) => {
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt.trim());
      setShowSuggestions(false);
    }
  };

  const active = prompt.trim() && !isGenerating;

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.7, bounce: 0 }}
        onSubmit={handleSubmit}
      >
        {/* Animated gradient border wrapper */}
        <div
          className="relative transition-all duration-700"
          style={{
            borderRadius: 22,
            border: "1.5px solid",
            borderColor: focused ? "#a855f7" : "rgba(168,85,247,0.4)",
            boxShadow: focused
              ? "0 0 0 3px rgba(124,58,237,0.08), 0 20px 60px rgba(0,0,0,0.1)"
              : "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          {/* Inner pill */}
          <div
            className="flex items-center gap-3 px-3 py-2"
            style={{
              borderRadius: 20,
              background: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(72px) saturate(200%)",
              WebkitBackdropFilter: "blur(72px) saturate(200%)",
            }}
          >
            {/* Wand icon */}
            <motion.div
              animate={isGenerating ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1.6, repeat: isGenerating ? Infinity : 0, ease: "linear" }}
              className="flex-shrink-0 w-10 h-10 rounded-[14px] flex items-center justify-center cursor-pointer"
              onClick={() => inputRef.current?.focus()}
              style={{
                background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <Wand2 className="h-4 w-4 text-white" strokeWidth={2} />
            </motion.div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => { setFocused(true); !prompt && setShowSuggestions(true); }}
              onBlur={() => { setFocused(false); setTimeout(() => setShowSuggestions(false), 180); }}
              placeholder="Describe your vision — luxury perfume, cinematic portrait, bold editorial…"
              disabled={isGenerating}
              className="flex-1 h-11 bg-transparent outline-none disabled:opacity-40 text-[13.5px]"
              style={{
                color: "rgba(15,10,30,0.9)",
                caretColor: "#7c3aed",
                letterSpacing: "0.012em",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 400,
              }}
            />

            {/* Char count hint */}
            {focused && prompt.length > 0 && (
              <span className="text-[10px] flex-shrink-0 tabular-nums"
                style={{ color: "rgba(124,58,237,0.5)", fontFamily: "monospace" }}>
                {prompt.length}
              </span>
            )}

            {/* Divider */}
            <div className="w-px h-7 flex-shrink-0" style={{ background: "rgba(0,0,0,0.08)" }} />

            {/* Generate button */}
            <motion.button
              type="submit"
              disabled={!active}
              whileHover={active ? { scale: 1.03 } : {}}
              whileTap={active ? { scale: 0.96 } : {}}
              className="flex-shrink-0 h-10 px-5 rounded-[14px] text-[12px] font-semibold flex items-center gap-2 text-white transition-all duration-400 disabled:cursor-not-allowed"
              style={{
                background: active
                  ? "linear-gradient(135deg, #5b21b6 0%, #7c3aed 45%, #a855f7 100%)"
                  : "rgba(255,255,255,0.06)",
                boxShadow: active
                  ? "0 4px 24px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.2)"
                  : "none",
                color: active ? "#fff" : "rgba(0,0,0,0.25)",
                letterSpacing: "0.04em",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {isGenerating
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />
              }
              {isGenerating ? "Creating…" : "Generate"}
            </motion.button>
          </div>
        </div>
      </motion.form>

      {/* Suggestions panel */}
      <AnimatePresence>
        {showSuggestions && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="absolute top-full left-0 right-0 mt-3 z-50 overflow-hidden"
            style={{
              borderRadius: 20,
              background: "linear-gradient(160deg, rgba(18,10,40,0.98) 0%, rgba(10,6,24,0.99) 100%)",
              border: "1px solid rgba(124,58,237,0.18)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
              backdropFilter: "blur(48px)",
            }}
          >
            {/* Top accent line */}
            <div className="h-px w-full" style={{
              background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.6), rgba(168,85,247,0.4), transparent)"
            }} />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-center gap-2.5 px-1 pb-3.5">
                <div className="h-5 w-5 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-[9.5px] font-bold tracking-[0.22em] uppercase"
                  style={{ color: "rgba(168,85,247,0.6)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Inspiration
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                  {QUICK_PROMPTS.length} ideas
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1">
                {QUICK_PROMPTS.map((q, i) => (
                  <motion.button
                    key={q.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025, type: "spring", duration: 0.3, bounce: 0 }}
                    onClick={() => { setPrompt(q.label); setShowSuggestions(false); onGenerate(q.label); }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[13px] text-left group transition-all duration-200"
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(124,58,237,0.1)";
                      e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                    style={{ border: "1px solid transparent" }}
                  >
                    {/* Color dot */}
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: q.color, boxShadow: `0 0 6px ${q.color}80` }} />

                    <span className="text-[11.5px] font-medium leading-snug flex-1"
                      style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {q.label}
                    </span>

                    <span className="text-[8.5px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(124,58,237,0.2)", color: q.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {q.tag}
                    </span>

                    <ChevronRight className="h-2.5 w-2.5 flex-shrink-0 opacity-0 group-hover:opacity-30 transition-opacity -ml-1"
                      style={{ color: "#a855f7" }} />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromptBar;
