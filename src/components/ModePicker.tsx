import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Globe, ImageIcon, LogOut, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SparkxLogo from "@/components/SparkxLogo";
import SparkxText from "@/components/SparkxText";

interface ModePickerProps { onSelect: (mode: "website" | "poster") => void; }

const modes = [
  {
    id: "website" as const, icon: Globe,
    title: "Website Generation",
    desc: "Describe your business and watch AI craft a stunning, fully-designed website with custom images and content.",
    accent: "#a78bfa", accentRgb: "167,139,250", badge: "Most Popular",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
    particles: ["✦", "◆", "✧", "⬡"],
  },
  {
    id: "poster" as const, icon: ImageIcon,
    title: "Poster Generation",
    desc: "Create stunning promotional posters, banners, and visual assets for your brand in seconds.",
    accent: "#f472b6", accentRgb: "244,114,182", badge: "New",
    gradient: "linear-gradient(135deg, #db2777 0%, #ec4899 50%, #f472b6 100%)",
    particles: ["✦", "◇", "✧", "○"],
  },
];

const Particle = ({ x, y, char, color }: { x: number; y: number; char: string; color: string }) => (
  <motion.span className="absolute text-[10px] pointer-events-none select-none"
    style={{ left: x, top: y, color, fontFamily: "monospace" }}
    initial={{ opacity: 0, scale: 0, y: 0 }}
    animate={{ opacity: [0, 0.8, 0], scale: [0, 1.3, 0.5], y: -55 }}
    transition={{ duration: 1.6, ease: "easeOut" }}>
    {char}
  </motion.span>
);

const IDLE_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() < 0.25 ? 2 : 1,
  delay: Math.random() * 8, dur: 5 + Math.random() * 5,
  drift: (Math.random() - 0.5) * 35,
  color: i % 3 === 0 ? "rgba(168,85,247,0.6)" : i % 3 === 1 ? "rgba(236,72,153,0.5)" : "rgba(255,255,255,0.2)",
}));

const ModeCard = ({ m, i, onSelect }: { m: typeof modes[0]; i: number; onSelect: (id: "website" | "poster") => void }) => {
  const [hovered, setHovered] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; char: string }[]>([]);
  const cardRef = useRef<HTMLButtonElement>(null);
  const pidRef = useRef(0);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useTransform(mouseY, [0, 1], [7, -7]);
  const rotateY = useTransform(mouseX, [0, 1], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseX.set((e.clientX - r.left) / r.width);
    mouseY.set((e.clientY - r.top) / r.height);
    if (Math.random() > 0.68) {
      const char = m.particles[Math.floor(Math.random() * m.particles.length)];
      const id = pidRef.current++;
      setParticles(p => [...p.slice(-10), { id, x: e.clientX - r.left, y: e.clientY - r.top, char }]);
    }
  };

  return (
    <motion.button ref={cardRef}
      initial={{ opacity: 0, y: 50, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5 + i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(m.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); mouseX.set(0.5); mouseY.set(0.5); }}
      onMouseMove={handleMouseMove}
      className="group relative text-left rounded-3xl overflow-hidden cursor-pointer"
      style={{
        background: "linear-gradient(145deg, #181818, #131313)",
        border: `1px solid ${hovered ? `rgba(${m.accentRgb},0.4)` : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered
          ? `0 0 0 1px rgba(${m.accentRgb},0.15), 0 40px 90px rgba(0,0,0,0.65), 0 0 80px rgba(${m.accentRgb},0.08)`
          : `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)`,
        transition: "border-color 0.4s, box-shadow 0.4s", transformStyle: "preserve-3d",
      }}>

      <motion.div className="absolute inset-0 pointer-events-none rounded-3xl"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 4 + i * 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 2 }}
        style={{ background: `radial-gradient(ellipse 70% 50% at 50% 100%, rgba(${m.accentRgb},0.07) 0%, transparent 70%)` }} />

      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="p-8">
        <AnimatePresence>
          {hovered && (
            <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.4 }} className="absolute top-0 left-0 right-0 h-px origin-left"
              style={{ background: `linear-gradient(90deg, transparent, ${m.accent}, rgba(255,255,255,0.8), ${m.accent}, transparent)` }} />
          )}
        </AnimatePresence>

        <motion.div className="absolute inset-0 pointer-events-none"
          animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.5 }}
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 110%, rgba(${m.accentRgb},0.12) 0%, transparent 70%)` }} />

        <motion.div className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
          animate={{ opacity: hovered ? 0.25 : 0.04, scale: hovered ? 1 : 0.5 }} transition={{ duration: 0.6 }}
          style={{ background: `radial-gradient(circle, ${m.accent}, transparent 70%)`, filter: "blur(20px)" }} />

        {particles.map(p => <Particle key={p.id} x={p.x} y={p.y} char={p.char} color={m.accent} />)}

        {/* Icon */}
        <div className="relative mb-7">
          <motion.div animate={{ scale: hovered ? 1.12 : 1 }} transition={{ duration: 0.3 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden"
            style={{ background: `rgba(${m.accentRgb},0.1)`, border: `1px solid rgba(${m.accentRgb},0.2)` }}>
            <AnimatePresence>
              {hovered && (
                <motion.div className="absolute inset-0" initial={{ x: "-100%" }} animate={{ x: "200%" }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }} style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }} />
              )}
            </AnimatePresence>
            <m.icon className="w-6 h-6 relative z-10" style={{ color: m.accent }} />
          </motion.div>
          <AnimatePresence>
            {hovered && (
              <motion.div className="absolute inset-0 rounded-2xl"
                initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }} style={{ border: `1px solid rgba(${m.accentRgb},0.5)` }} />
            )}
          </AnimatePresence>
        </div>

        <motion.span animate={{ opacity: hovered ? 1 : 0.65 }}
          className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-4"
          style={{ background: `rgba(${m.accentRgb},0.1)`, color: m.accent, border: `1px solid rgba(${m.accentRgb},0.2)`, fontFamily: "'Outfit', sans-serif" }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
            className="w-1 h-1 rounded-full" style={{ background: m.accent }} />
          {m.badge}
        </motion.span>

        <motion.h2 animate={{ color: hovered ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.75)" }}
          transition={{ duration: 0.3 }} className="text-xl font-bold mb-3 leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {m.title}
        </motion.h2>

        <motion.p animate={{ color: hovered ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.28)" }}
          transition={{ duration: 0.3 }} className="text-sm leading-relaxed mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {m.desc}
        </motion.p>

        <div className="flex items-center justify-between">
          <motion.div className="flex items-center gap-2 text-xs font-semibold"
            animate={{ x: hovered ? 4 : 0, color: hovered ? m.accent : `rgba(${m.accentRgb},0.4)` }}
            transition={{ duration: 0.3 }} style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span>Get started</span>
            <motion.div animate={{ x: hovered ? 5 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </motion.div>
          <motion.div animate={{ scale: hovered ? 1 : 0.6, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: m.gradient }}>
            <ChevronRight className="w-4 h-4 text-white" />
          </motion.div>
        </div>
      </motion.div>
    </motion.button>
  );
};

const ModePicker = ({ onSelect }: ModePickerProps) => {
  const navigate = useNavigate();
  const handleSelect = (mode: "website" | "poster") => {
    fetch("http://localhost:3001/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:"mode_selected",mode})}).catch(()=>{});
    if (mode === "poster") { navigate("/poster"); return; }
    onSelect(mode);
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 25, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 25, damping: 30 });
  const orb1X = useTransform(smoothX, [-600, 600], [-30, 30]);
  const orb1Y = useTransform(smoothY, [-400, 400], [-20, 20]);
  const orb2X = useTransform(smoothX, [-600, 600], [20, -20]);
  const orb2Y = useTransform(smoothY, [-400, 400], [15, -15]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      mouseX.set(e.clientX - r.width / 2);
      mouseY.set(e.clientY - r.height / 2);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col relative overflow-hidden"
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
        <SparkxLogo isDark={true} />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={async () => { await supabase.auth.signOut(); toast.success("Signed out"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", fontFamily: "'Outfit', sans-serif" }}
          onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
          <LogOut className="w-3 h-3" /><span className="hidden sm:inline">Sign Out</span>
        </motion.button>
      </motion.header>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-6">
        <div className="text-center max-w-3xl mx-auto w-full">

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-8"
            style={{ border: "1px solid rgba(168,85,247,0.18)", background: "rgba(168,85,247,0.05)", backdropFilter: "blur(12px)" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-3 h-3" style={{ color: "rgba(192,132,252,0.7)" }} />
            </motion.div>
            <span className="text-[10px] tracking-[0.22em] uppercase font-medium" style={{ color: "rgba(192,132,252,0.6)", fontFamily: "'Outfit', sans-serif" }}>
              What would you like to create?
            </span>
            <motion.div className="w-1.5 h-1.5 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ background: "#c084fc" }} />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl font-bold mb-4 leading-[1.05]" style={{ fontFamily: "'Cinzel', serif" }}>
            <span style={{ color: "rgba(255,255,255,0.92)" }}>Choose your</span>{" "}
            <motion.span className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #c084fc, #e879f9, #f472b6, #c084fc)", backgroundSize: "300% 100%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              mode
            </motion.span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="text-sm mb-14" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "rgba(255,255,255,0.35)" }}>
            Select a creation mode to get started with <span style={{ color: "rgba(255,255,255,0.8)", WebkitTextFillColor: "rgba(255,255,255,0.8)" }}>SPARK</span><span style={{ background: "linear-gradient(90deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>X</span> AI
          </motion.p>

          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {modes.map((m, i) => <ModeCard key={m.id} m={m} i={i} onSelect={handleSelect} />)}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="relative z-10 py-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}><span style={{ color: "rgba(255,255,255,0.5)", WebkitTextFillColor: "rgba(255,255,255,0.5)" }}>POWERED BY SPARK</span><span style={{ background: "linear-gradient(90deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>X</span><span style={{ color: "rgba(255,255,255,0.5)", WebkitTextFillColor: "rgba(255,255,255,0.5)" }}> AI</span></p>
      </motion.div>
    </div>
  );
};

export default ModePicker;
