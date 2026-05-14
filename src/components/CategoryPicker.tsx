import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Palette } from "lucide-react";
import SparkxLogo from "@/components/SparkxLogo";

export type WebsiteCategory = "ecommerce" | "restaurant" | "portfolio" | "service" | "saas" | "blog" | "education" | "fitness" | "agency" | "nonprofit";

interface CategoryPickerProps {
  prompt: string;
  onSelect: (category: WebsiteCategory) => void;
  onBack: () => void;
}

const categories: { id: WebsiteCategory; label: string; description: string; accent: string; preview: string }[] = [
  {
    id: "ecommerce",
    label: "E-Commerce",
    description: "Online store with products, cart & checkout",
    accent: "#f472b6",
    preview: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop&auto=format&q=95",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    description: "Menu, reservations & dining experience",
    accent: "#f87171",
    preview: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop&auto=format&q=95",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Showcase your work & creative projects",
    accent: "#a78bfa",
    preview: "https://images.unsplash.com/photo-1500051638674-ff996a0ec29e?w=600&h=400&fit=crop&auto=format&q=95",
  },
  {
    id: "saas",
    label: "SaaS / Tech",
    description: "Software platform with features & pricing",
    accent: "#60a5fa",
    preview: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop&auto=format&q=95",
  },
  {
    id: "service",
    label: "Service",
    description: "Professional services & consulting",
    accent: "#34d399",
    preview: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&h=400&fit=crop&auto=format&q=95",
  },
  {
    id: "blog",
    label: "Blog",
    description: "Articles, stories & content publishing",
    accent: "#fbbf24",
    preview: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop&auto=format&q=95",
  },
  {
    id: "education",
    label: "Education",
    description: "Courses, learning & online academy",
    accent: "#818cf8",
    preview: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop&auto=format&q=95",
  },
  {
    id: "fitness",
    label: "Fitness",
    description: "Gym, training & wellness programs",
    accent: "#fb923c",
    preview: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop&auto=format&q=95",
  },
  {
    id: "agency",
    label: "Agency",
    description: "Creative or marketing agency showcase",
    accent: "#2dd4bf",
    preview: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop&auto=format&q=95",
  },
  {
    id: "nonprofit",
    label: "Nonprofit",
    description: "Charity, cause & donation platform",
    accent: "#4ade80",
    preview: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=600&h=400&fit=crop&auto=format&q=95",
  },
];

const CategoryPicker = ({ prompt, onSelect, onBack }: CategoryPickerProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
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
          <SparkxLogo isDark={true} size="md" />
        </div>
        <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Outfit', sans-serif" }}>Website Studio</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-5xl mx-auto w-full">

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
            <Palette className="w-3.5 h-3.5 text-violet-400/70" />
            <span className="text-[11px] font-medium text-white/35 tracking-wide">Choose your website type</span>
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 text-white/95" style={{ fontFamily: "'Cinzel', serif" }}>
            What kind of website?
          </motion.h2>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-sm text-white/25 mb-10 max-w-md mx-auto truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            "{prompt}"
          </motion.p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                whileHover={{ scale: 1.04, y: -6 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelect(cat.id)}
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] transition-all duration-300"
                style={{
                  boxShadow: hoveredId === cat.id ? `0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px ${cat.accent}30` : "0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                {/* Image */}
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  <img
                    src={cat.preview}
                    alt={cat.label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Dark overlay always */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.15) 100%)" }} />
                  {/* Accent color tint on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to top, ${cat.accent}40 0%, transparent 60%)` }}
                  />
                  {/* Text over image */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                    <p className="text-xs font-bold text-white/90 group-hover:text-white transition-colors leading-tight mb-0.5"
                      style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {cat.label}
                    </p>
                    <p className="text-[8px] text-white/40 group-hover:text-white/60 transition-colors leading-tight"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {cat.description}
                    </p>
                  </div>
                  {/* Accent line at bottom on hover */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                    style={{ background: cat.accent }}
                  />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 py-6 text-center">
        <p className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(255,255,255,0.08)" }}>AI will customize everything for your prompt</p>
      </div>
    </div>
  );
};

export default CategoryPicker;
