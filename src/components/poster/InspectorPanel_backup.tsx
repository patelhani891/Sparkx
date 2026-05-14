import { motion, AnimatePresence } from "framer-motion";
import {
  Type, Image, Palette, SlidersHorizontal, Trash2, Plus,
  AlignLeft, AlignCenter, AlignRight, RotateCcw, Download,
  Layers, ChevronDown, Frame, Upload, Blend, Film, Droplets,
  Copy, PaintBucket, Scan, Sparkles, Move, Maximize2,
  AlignJustify, Zap, CircleDot, Eye, Wand2,
  SquareStack, Paintbrush, Ruler,
  Italic, Underline, Strikethrough, SunMedium,
} from "lucide-react";
import type { PosterState, PosterElement } from "@/types/poster";
import {
  POSTER_FILTERS, FONT_OPTIONS, FRAME_PRESETS, BG_GALLERY,
  OVERLAY_GRADIENTS, TEXT_GRADIENTS, BLEND_MODES
} from "@/types/poster";
import { Slider } from "@/components/ui/slider";
import { useState, useRef, useEffect } from "react";

interface InspectorPanelProps {
  poster: PosterState;
  selectedElement: PosterElement | null;
  onUpdatePoster: (updates: Partial<PosterState>) => void;
  onUpdateElement: (id: string, updates: Partial<PosterElement>) => void;
  onAddElement: () => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  onExport: () => void;
}

const spring = { type: "spring" as const, duration: 0.4, bounce: 0 };

// Pink/Purple palette
const G = {
  gold: "#c026d3",
  goldBright: "#e879f9",
  goldDim: "rgba(192,38,211,0.45)",
  goldFaint: "rgba(192,38,211,0.08)",
  goldBorder: "rgba(147,51,234,0.25)",
  ivory: "#fdf4ff",
  ivoryDim: "rgba(253,244,255,0.55)",
  ivoryFaint: "rgba(147,51,234,0.07)",
  divider: "rgba(192,38,211,0.12)",
};

const isDarkTheme = () => document.documentElement.classList.contains("dark");
const textColor = () => isDarkTheme() ? G.ivory : "#111111";
const textColorDim = () => isDarkTheme() ? G.ivoryDim : "#444444";
const inputBg = () => isDarkTheme() ? G.ivoryFaint : "rgba(0,0,0,0.04)";
const inputBorder = () => G.goldBorder;

const Section = ({ title, icon: Icon, children, defaultOpen = true, badge }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const isDarkMode = document.documentElement.classList.contains("dark");
  return (
    <div className="mx-3 my-2 rounded-lg overflow-hidden"
      style={{ background: "rgba(201,168,76,0.04)", border: `1px solid ${G.goldBorder}` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-all"
        style={{ color: open ? G.gold : G.goldDim }}
        onMouseEnter={e => (e.currentTarget.style.color = G.gold)}
        onMouseLeave={e => (e.currentTarget.style.color = open ? G.gold : G.goldDim)}
      >
        <div className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: open ? "rgba(201,168,76,0.15)" : G.goldFaint, border: `1px solid ${G.goldBorder}` }}
        >
          <Icon className="h-3 w-3" style={{ color: G.gold }} />
        </div>
        <span className="flex-1 text-left text-[9px] uppercase"
          style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.2em", color: open ? (isDarkMode ? G.goldBright : "#000000") : (isDarkMode ? G.gold : "#000000") }}>
          {title}
        </span>
        {badge && (
          <span className="text-[7px] px-1.5 py-0.5 rounded"
            style={{ background: G.goldFaint, color: G.gold, border: `1px solid ${G.goldBorder}`, fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>
            {badge}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} style={{ color: G.goldDim }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2.5"
              style={{ borderTop: `1px solid ${G.divider}` }}
            >{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block mb-1 text-[9px] uppercase tracking-[0.25em]"
    style={{ fontFamily: "'Cormorant Garamond', serif", color: textColorDim(), fontStyle: "italic", letterSpacing: "0.25em" }}>
    {children}
  </label>
);

const ColorInput = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex items-center gap-1.5">
      <div className="relative w-7 h-7 rounded overflow-hidden cursor-pointer flex-shrink-0"
        style={{ border: `1px solid ${G.goldBorder}` }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="w-full h-full" style={{ backgroundColor: value }} />
      </div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-7 px-2 rounded text-[10px] font-mono outline-none"
        style={{ background: inputBg(), border: `1px solid ${G.goldBorder}`, color: textColor() }} />
    </div>
  </div>
);

const MiniButton = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => (
  <button onClick={onClick} title={title}
    className="h-7 rounded flex items-center justify-center transition-all text-[10px]"
    style={active ? {
      background: `linear-gradient(135deg, #7e22ce, #c026d3, #a855f7)`,
      color: "#fff",
      boxShadow: `0 2px 10px rgba(168,85,247,0.4)`,
      fontFamily: "'Cinzel', serif",
      fontWeight: 600,
      letterSpacing: "0.05em",
    } : {
      background: inputBg(),
      color: textColorDim(),
      border: `1px solid ${G.goldBorder}`,
      fontFamily: "'Cinzel', serif",
      letterSpacing: "0.05em",
    }}
  >
    {children}
  </button>
);

const TEXT_SHADOW_PRESETS = [
  { label: "None", value: "none" },
  { label: "Subtle", value: "0 2px 8px rgba(0,0,0,0.3)" },
  { label: "Medium", value: "0 4px 16px rgba(0,0,0,0.5)" },
  { label: "Strong", value: "0 6px 30px rgba(0,0,0,0.7)" },
  { label: "Glow", value: "0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.1)" },
  { label: "Hard", value: "2px 2px 0 rgba(0,0,0,0.8)" },
  { label: "Retro", value: "3px 3px 0 #ff4444, 6px 6px 0 rgba(0,0,0,0.3)" },
  { label: "Neon", value: "0 0 10px #00ff88, 0 0 30px #00ff88, 0 0 60px #00ff88" },
  { label: "Cinematic", value: "0 8px 32px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.4)" },
  { label: "Electric", value: "0 0 10px #00d4ff, 0 0 30px #00d4ff" },
  { label: "3D Pop", value: "1px 1px 0 #ff6b6b, 2px 2px 0 #feca57, 3px 3px 0 #48dbfb" },
  { label: "Elegant", value: "0 2px 4px rgba(212,175,55,0.3), 0 4px 12px rgba(0,0,0,0.4)" },
  { label: "Fire", value: "0 0 10px #ff6b35, 0 0 30px #ff4500, 0 0 60px #ff000055" },
  { label: "Ice", value: "0 0 10px #87ceeb, 0 0 30px #00bfff, 0 0 60px #1e90ff55" },
  { label: "Purple", value: "0 0 10px #a855f7, 0 0 30px #7c3aed" },
];

const FONT_STYLE_PRESETS = [
  { label: "Classic Serif", family: "Playfair Display", weight: 700, transform: "none" as const, spacing: -0.02 },
  { label: "Bold Impact", family: "Bebas Neue", weight: 400, transform: "uppercase" as const, spacing: 0.05 },
  { label: "Elegant", family: "Cormorant Garamond", weight: 500, transform: "none" as const, spacing: 0.03 },
  { label: "Modern Sans", family: "Space Grotesk", weight: 600, transform: "none" as const, spacing: -0.01 },
  { label: "Editorial", family: "DM Serif Display", weight: 400, transform: "none" as const, spacing: 0 },
  { label: "Display", family: "Abril Fatface", weight: 400, transform: "none" as const, spacing: 0 },
  { label: "Brutalist", family: "Archivo Black", weight: 400, transform: "uppercase" as const, spacing: 0 },
  { label: "Gothic", family: "Dela Gothic One", weight: 400, transform: "uppercase" as const, spacing: 0.02 },
  { label: "Funky", family: "Righteous", weight: 400, transform: "none" as const, spacing: 0.01 },
  { label: "Expressive", family: "Syne", weight: 800, transform: "none" as const, spacing: -0.02 },
];

const BACKGROUND_PATTERNS = [
  { label: "None", value: "none" },
  { label: "Dots", value: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)" },
  { label: "Grid", value: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)" },
  { label: "Diagonal", value: "repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 10px)" },
  { label: "Cross", value: "repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 20px)" },
  { label: "Waves", value: "repeating-radial-gradient(circle at 0 0, transparent 0, rgba(255,255,255,0.05) 10px), repeating-linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.05))" },
  { label: "Hex", value: "radial-gradient(circle farthest-side at 0% 50%, rgba(255,255,255,0.05) 23.5%, rgba(240,166,17,0) 0) 21px 30px, radial-gradient(circle farthest-side at 0% 50%, rgba(255,255,255,0.08) 24%, rgba(240,166,17,0) 0) 19px 30px" },
];

const GLOW_COLORS = [
  { label: "None", color: "" },
  { label: "White", color: "#ffffff" },
  { label: "Pink", color: "#ec4899" },
  { label: "Purple", color: "#a855f7" },
  { label: "Blue", color: "#3b82f6" },
  { label: "Cyan", color: "#06b6d4" },
  { label: "Green", color: "#22c55e" },
  { label: "Yellow", color: "#eab308" },
  { label: "Red", color: "#ef4444" },
  { label: "Orange", color: "#f97316" },
];
  canvas: Frame,
  element: Type,
  effects: Sparkles,
};

const InspectorPanel = ({
  poster,
  selectedElement,
  onUpdatePoster,
  onUpdateElement,
  onAddElement,
  onDeleteElement,
  onDuplicateElement,
  onExport,
}: InspectorPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [activeTab, setActiveTab] = useState<"canvas" | "element" | "effects">("canvas");

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Auto-switch to element tab when an element is selected
  useEffect(() => {
    if (selectedElement) setActiveTab("element");
  }, [selectedElement?.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) onUpdatePoster({ backgroundImage: result });
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: "canvas" as const, label: "Canvas", icon: Frame },
    { id: "element" as const, label: "Element", icon: Type },
    { id: "effects" as const, label: "Effects", icon: Sparkles },
  ];

  const panelStyle = isDark
    ? {
        background: "linear-gradient(180deg, #0a0010 0%, #0d0015 60%, #080008 100%)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderLeft: `1px solid ${G.goldBorder}`,
      }
    : {
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderLeft: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.06)",
      };

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={spring}
      className="w-[300px] flex flex-col border-l h-full flex-shrink-0"
      style={panelStyle}
    >
      {/* ƒ"?ƒ"? Luxury Header ƒ"?ƒ"? */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4"
        style={{ borderBottom: `1px solid ${G.divider}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${G.gold})` }} />
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.45em", background: "linear-gradient(90deg, #e879f9, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>STUDIO</span>
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${G.gold}, transparent)` }} />
        </div>
        <button
          onClick={onAddElement}
          className="w-full h-9 rounded transition-all hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, #7e22ce, ${G.gold}, #a21caf)`,
            color: "#fff",
            boxShadow: `0 2px 16px rgba(192,38,211,0.35), inset 0 1px 0 rgba(255,255,255,0.15)`,
            fontFamily: "'Cinzel', serif",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          ADD TEXT ELEMENT
        </button>
      </div>

      {/* ƒ"?ƒ"? Tab Bar ƒ"?ƒ"? */}
      <div className="flex-shrink-0 flex px-2 pt-1 pb-0"
        style={{ borderBottom: `1px solid ${G.divider}` }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center gap-1 pb-2 pt-2 relative transition-all"
              style={{ opacity: isActive ? 1 : 0.35 }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: isActive ? G.goldBright : (isDark ? G.ivory : "#555") }} />
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "8px",
                letterSpacing: "0.2em",
                color: isActive ? G.goldBright : (isDark ? G.ivory : "#555"),
              }}>
                {tab.label.toUpperCase()}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-3 right-3 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${G.goldBright}, transparent)` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ƒ"?ƒ"? Scrollable Content ƒ"?ƒ"? */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        {/* ƒ"?ƒ"?ƒ"? CANVAS TAB ƒ"?ƒ"?ƒ"? */}
        {activeTab === "canvas" && (
          <div>
      <Section title="Frame & Size" icon={Frame}>
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <Label>Width</Label>
            <input type="number" value={poster.width} onChange={(e) => onUpdatePoster({ width: Number(e.target.value) })} className="w-full h-7 px-2 rounded text-[11px] outline-none" style={{ background: inputBg(), border: `1px solid ${G.goldBorder}`, color: textColor() }} />
          </div>
          <div>
            <Label>Height</Label>
            <input type="number" value={poster.height} onChange={(e) => onUpdatePoster({ height: Number(e.target.value) })} className="w-full h-7 px-2 rounded text-[11px] outline-none" style={{ background: inputBg(), border: `1px solid ${G.goldBorder}`, color: textColor() }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {FRAME_PRESETS.map((preset) => (
            <MiniButton key={preset.label} active={poster.width === preset.w && poster.height === preset.h} onClick={() => onUpdatePoster({ width: preset.w, height: preset.h })}>
              <span className="mr-1">{preset.icon}</span>{preset.label}
            </MiniButton>
          ))}
        </div>
      </Section>

      <Section title="Background" icon={Image}>
        <ColorInput label="Background Color" value={poster.backgroundColor} onChange={(backgroundColor) => onUpdatePoster({ backgroundColor })} />
        <button onClick={() => fileInputRef.current?.click()} className="w-full h-8 rounded text-[10px] flex items-center justify-center gap-1.5 transition-all hover:brightness-110" style={{ background: inputBg(), color: textColor(), border: `1px solid ${G.goldBorder}`, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
          <Upload className="h-3 w-3" /> UPLOAD IMAGE
        </button>
        <div>
          <Label>Background Blur</Label>
          <Slider value={[poster.blurBackground ?? 0]} onValueChange={([v]) => onUpdatePoster({ blurBackground: v })} min={0} max={20} step={1} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.blurBackground ?? 0}px</span>
        </div>
        {poster.backgroundImage && (
          <button onClick={() => onUpdatePoster({ backgroundImage: null })} className="w-full h-6 rounded text-[10px] transition-all hover:brightness-110" style={{ background: "rgba(180,30,30,0.1)", color: "rgba(220,80,80,0.8)", border: "1px solid rgba(180,30,30,0.2)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>REMOVE IMAGE</button>
        )}
      </Section>

      <Section title="Background Gallery" icon={Palette} defaultOpen={false} badge={`${BG_GALLERY.length}`}>
        <div className="grid grid-cols-3 gap-1.5">
          {BG_GALLERY.map((bg) => (
            <button key={bg.label} onClick={() => onUpdatePoster({ backgroundImage: null, backgroundColor: "#000" })} className="relative h-14 rounded-lg overflow-hidden hover:ring-2 hover:ring-accent transition-all group" style={{ background: bg.css }} title={bg.label}>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1"><span className="text-[7px] text-white/80 font-ui">{bg.label}</span></div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Color Overlay" icon={Layers}>
        <ColorInput label="Overlay Color" value={poster.overlayColor} onChange={(overlayColor) => onUpdatePoster({ overlayColor })} />
        <div>
          <Label>Opacity</Label>
          <Slider value={[poster.overlayOpacity]} onValueChange={([v]) => onUpdatePoster({ overlayOpacity: v })} min={0} max={0.95} step={0.01} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{Math.round(poster.overlayOpacity * 100)}%</span>
        </div>
      </Section>

      <Section title="Gradient Overlay" icon={Droplets} defaultOpen={false} badge={`${OVERLAY_GRADIENTS.length}`}>
        <div className="grid grid-cols-2 gap-1">
          {OVERLAY_GRADIENTS.map((g) => (
            <MiniButton key={g.label} active={poster.overlayGradient === g.css} onClick={() => onUpdatePoster({ overlayGradient: g.css })}>{g.label}</MiniButton>
          ))}
        </div>
      </Section>

      <Section title="Film & Texture" icon={Film} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Film Grain</Label>
            <Slider value={[poster.grain ?? 0]} onValueChange={([v]) => onUpdatePoster({ grain: v })} min={0} max={1} step={0.01} className="mt-1" />
            <span className="text-[9px] text-muted-foreground/50 font-mono">{Math.round((poster.grain ?? 0) * 100)}%</span>
          </div>
          <div>
            <Label>Vignette</Label>
            <Slider value={[poster.vignette ?? 0]} onValueChange={([v]) => onUpdatePoster({ vignette: v })} min={0} max={1} step={0.01} className="mt-1" />
            <span className="text-[9px] text-muted-foreground/50 font-mono">{Math.round((poster.vignette ?? 0) * 100)}%</span>
          </div>
        </div>
      </Section>

      <Section title="Color Filter" icon={Paintbrush} badge={poster.filter !== "none" ? "ON" : undefined}>
        <div className="grid grid-cols-3 gap-1">
          {POSTER_FILTERS.map((f) => (
            <MiniButton key={f.id} active={poster.filter === f.id} onClick={() => onUpdatePoster({ filter: f.id })}>{f.label}</MiniButton>
          ))}
        </div>
      </Section>

      <Section title="Adjustments" icon={SunMedium} defaultOpen={false} badge="NEW">
        <div>
          <Label>Brightness</Label>
          <Slider value={[poster.brightness ?? 100]} onValueChange={([v]) => onUpdatePoster({ brightness: v })} min={0} max={200} step={1} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.brightness ?? 100}%</span>
        </div>
        <div>
          <Label>Contrast</Label>
          <Slider value={[poster.contrast ?? 100]} onValueChange={([v]) => onUpdatePoster({ contrast: v })} min={0} max={200} step={1} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.contrast ?? 100}%</span>
        </div>
        <div>
          <Label>Saturation</Label>
          <Slider value={[poster.saturation ?? 100]} onValueChange={([v]) => onUpdatePoster({ saturation: v })} min={0} max={300} step={1} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.saturation ?? 100}%</span>
        </div>
        <div>
          <Label>Hue Rotate</Label>
          <Slider value={[poster.hueRotate ?? 0]} onValueChange={([v]) => onUpdatePoster({ hueRotate: v })} min={0} max={360} step={1} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.hueRotate ?? 0}Aø</span>
        </div>
        <div>
          <Label>Drop Shadow</Label>
          <Slider value={[poster.shadowIntensity ?? 0]} onValueChange={([v]) => onUpdatePoster({ shadowIntensity: v })} min={0} max={100} step={1} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.shadowIntensity ?? 0}</span>
        </div>
        <button onClick={() => onUpdatePoster({ brightness: 100, contrast: 100, saturation: 100, shadowIntensity: 0, hueRotate: 0 })} className="w-full h-6 rounded text-[10px] flex items-center justify-center gap-1 transition-all hover:brightness-110" style={{ background: inputBg(), color: textColorDim(), border: `1px solid ${G.goldBorder}`, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
          <RotateCcw className="h-2.5 w-2.5" /> RESET
        </button>
      </Section>

      <Section title="Background Pattern" icon={SquareStack} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1">
          {BACKGROUND_PATTERNS.map((p) => (
            <MiniButton key={p.label} active={(poster.backgroundPattern ?? "none") === p.value} onClick={() => onUpdatePoster({ backgroundPattern: p.value })}>{p.label}</MiniButton>
          ))}
        </div>
        {poster.backgroundPattern && poster.backgroundPattern !== "none" && (
          <div>
            <Label>Pattern Opacity</Label>
            <Slider value={[poster.noiseOpacity ?? 0.15]} onValueChange={([v]) => onUpdatePoster({ noiseOpacity: v })} min={0.01} max={1} step={0.01} className="mt-1" />
            <span className="text-[9px] text-muted-foreground/50 font-mono">{Math.round((poster.noiseOpacity ?? 0.15) * 100)}%</span>
          </div>
        )}
      </Section>

      <Section title="Canvas Style" icon={Maximize2} defaultOpen={false}>
        <div>
          <Label>Border Radius</Label>
          <Slider value={[poster.borderRadius ?? 0]} onValueChange={([v]) => onUpdatePoster({ borderRadius: v })} min={0} max={60} step={1} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.borderRadius ?? 0}px</span>
        </div>
        <div>
          <Label>Border Width</Label>
          <Slider value={[poster.borderWidth ?? 0]} onValueChange={([v]) => onUpdatePoster({ borderWidth: v })} min={0} max={20} step={1} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.borderWidth ?? 0}px</span>
        </div>
        {(poster.borderWidth ?? 0) > 0 && (
          <ColorInput label="Border Color" value={poster.borderColor || "#ffffff"} onChange={(borderColor) => onUpdatePoster({ borderColor })} />
        )}
        <div>
          <Label>Inner Padding</Label>
          <Slider value={[poster.padding ?? 0]} onValueChange={([v]) => onUpdatePoster({ padding: v })} min={0} max={60} step={1} className="mt-1" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.padding ?? 0}px</span>
        </div>
      </Section>
          </div>
        )}

        {/* ƒ"?ƒ"?ƒ"? ELEMENT TAB ƒ"?ƒ"?ƒ"? */}
        {activeTab === "element" && (
          <div>
            {!selectedElement ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
                <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: G.goldFaint, border: `1px solid ${G.goldBorder}` }}>
                  <Type className="h-5 w-5" style={{ color: G.gold }} />
                </div>
                <div className="text-center space-y-1">
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", color: G.gold }}>SELECT AN ELEMENT</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", color: textColorDim(), fontStyle: "italic" }}>to edit its properties</p>
                </div>
              </div>
            ) : (
            <>
            <Section title="Style Presets" icon={Wand2} badge="Quick">
              <div className="grid grid-cols-2 gap-1">
                {FONT_STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onUpdateElement(selectedElement.id, {
                      fontFamily: preset.family,
                      fontWeight: preset.weight,
                      textTransform: preset.transform,
                      letterSpacing: preset.spacing,
                    })}
                    className="h-9 rounded-lg text-[10px] font-ui flex items-center justify-center transition-all"
                    style={selectedElement.fontFamily === preset.family ? {
                      background: `linear-gradient(135deg, #7e22ce, #c026d3)`,
                      color: "#fff", fontFamily: preset.family, fontWeight: 700,
                    } : {
                      background: inputBg(), color: textColorDim(),
                      border: `1px solid ${G.goldBorder}`, fontFamily: preset.family,
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? TYPOGRAPHY ƒ"?ƒ"?ƒ"? */}
            <Section title="Typography" icon={Type} badge={selectedElement.fontFamily.split(' ')[0]}>
              <div>
                <Label>Font Family</Label>
                <select
                  value={selectedElement.fontFamily}
                  onChange={(e) => onUpdateElement(selectedElement.id, { fontFamily: e.target.value })}
                  className="w-full h-7 px-2 rounded text-[11px] outline-none"
                  style={{ background: inputBg(), border: `1px solid ${G.goldBorder}`, color: textColor() }}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <Label>Size</Label>
                  <input
                    type="number"
                    value={selectedElement.fontSize}
                    onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                    className="w-full h-7 px-2 rounded text-[11px] outline-none"
                    style={{ background: inputBg(), border: `1px solid ${G.goldBorder}`, color: textColor() }}
                    min={6} max={300}
                  />
                </div>
                <div>
                  <Label>Weight</Label>
                  <select
                    value={selectedElement.fontWeight}
                    onChange={(e) => onUpdateElement(selectedElement.id, { fontWeight: Number(e.target.value) })}
                    className="w-full h-7 px-2 rounded text-[11px] outline-none"
                    style={{ background: inputBg(), border: `1px solid ${G.goldBorder}`, color: textColor() }}
                  >
                    {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Case</Label>
                  <select
                    value={selectedElement.textTransform}
                    onChange={(e) => onUpdateElement(selectedElement.id, { textTransform: e.target.value as PosterElement["textTransform"] })}
                    className="w-full h-7 px-2 rounded text-[11px] outline-none"
                    style={{ background: inputBg(), border: `1px solid ${G.goldBorder}`, color: textColor() }}
                  >
                    <option value="none">Aa</option>
                    <option value="uppercase">AA</option>
                    <option value="lowercase">aa</option>
                    <option value="capitalize">Ab</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Alignment</Label>
                <div className="grid grid-cols-4 gap-1">
                  {([
                    ["left", AlignLeft],
                    ["center", AlignCenter],
                    ["right", AlignRight],
                    ["justify", AlignJustify],
                  ] as const).map(([align, Icon]) => (
                    <MiniButton
                      key={align}
                      active={selectedElement.textAlign === align}
                      onClick={() => onUpdateElement(selectedElement.id, { textAlign: align as any })}
                    >
                      <Icon className="h-3 w-3" />
                    </MiniButton>
                  ))}
                </div>
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? TEXT DECORATION ƒ"?ƒ"?ƒ"? */}
            <Section title="Text Decoration" icon={Italic} defaultOpen={false}>
              <div>
                <Label>Style</Label>
                <div className="grid grid-cols-3 gap-1">
                  <MiniButton active={!!selectedElement.italic} onClick={() => onUpdateElement(selectedElement.id, { italic: !selectedElement.italic })} title="Italic">
                    <Italic className="h-3 w-3" />
                  </MiniButton>
                  <MiniButton active={!!selectedElement.underline} onClick={() => onUpdateElement(selectedElement.id, { underline: !selectedElement.underline })} title="Underline">
                    <Underline className="h-3 w-3" />
                  </MiniButton>
                  <MiniButton active={!!selectedElement.strikethrough} onClick={() => onUpdateElement(selectedElement.id, { strikethrough: !selectedElement.strikethrough })} title="Strikethrough">
                    <Strikethrough className="h-3 w-3" />
                  </MiniButton>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Scale X</Label>
                  <Slider value={[selectedElement.scaleX ?? 1]} onValueChange={([v]) => onUpdateElement(selectedElement.id, { scaleX: v })} min={0.1} max={3} step={0.05} className="mt-1" />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{(selectedElement.scaleX ?? 1).toFixed(2)}x</span>
                </div>
                <div>
                  <Label>Scale Y</Label>
                  <Slider value={[selectedElement.scaleY ?? 1]} onValueChange={([v]) => onUpdateElement(selectedElement.id, { scaleY: v })} min={0.1} max={3} step={0.05} className="mt-1" />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{(selectedElement.scaleY ?? 1).toFixed(2)}x</span>
                </div>
              </div>
              <div>
                <Label>Layer (Z-Index)</Label>
                <Slider value={[selectedElement.zIndex ?? 1]} onValueChange={([v]) => onUpdateElement(selectedElement.id, { zIndex: v })} min={1} max={50} step={1} className="mt-1" />
                <span className="text-[9px] text-muted-foreground/50 font-mono">Layer {selectedElement.zIndex ?? 1}</span>
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? SPACING & SIZE ƒ"?ƒ"?ƒ"? */}
            <Section title="Spacing & Size" icon={Ruler} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Letter Spacing</Label>
                  <Slider
                    value={[selectedElement.letterSpacing]}
                    onValueChange={([v]) => onUpdateElement(selectedElement.id, { letterSpacing: v })}
                    min={-0.1} max={0.5} step={0.01} className="mt-1"
                  />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.letterSpacing.toFixed(2)}em</span>
                </div>
                <div>
                  <Label>Line Height</Label>
                  <Slider
                    value={[selectedElement.lineHeight ?? 1.2]}
                    onValueChange={([v]) => onUpdateElement(selectedElement.id, { lineHeight: v })}
                    min={0.6} max={3} step={0.05} className="mt-1"
                  />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{(selectedElement.lineHeight ?? 1.2).toFixed(1)}</span>
                </div>
              </div>
              <div>
                <Label>Max Width</Label>
                <Slider
                  value={[selectedElement.width ?? poster.width - 80]}
                  onValueChange={([v]) => onUpdateElement(selectedElement.id, { width: v })}
                  min={50} max={poster.width} step={5} className="mt-1"
                />
                <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.width ?? 'auto'}px</span>
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? COLOR & GRADIENT ƒ"?ƒ"?ƒ"? */}
            <Section title="Color & Fill" icon={PaintBucket}>
              <ColorInput
                label="Text Color"
                value={selectedElement.color}
                onChange={(color) => onUpdateElement(selectedElement.id, { color, gradient: "" })}
              />
              <div>
                <Label>Text Gradient</Label>
                <div className="grid grid-cols-5 gap-1">
                  {TEXT_GRADIENTS.map((g) => (
                    <button
                      key={g.label}
                      onClick={() => onUpdateElement(selectedElement.id, { gradient: g.css })}
                      className={`h-6 rounded-md transition-all ${
                        selectedElement.gradient === g.css ? "ring-2 ring-accent ring-offset-1 ring-offset-card" : "hover:scale-110"
                      }`}
                      style={{ background: g.css || "hsl(var(--secondary))" }}
                      title={g.label}
                    />
                  ))}
                </div>
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? TEXT SHADOWS ƒ"?ƒ"?ƒ"? */}
            <Section title="Text Shadow" icon={Sparkles} defaultOpen={false} badge={`${TEXT_SHADOW_PRESETS.length}`}>
              <div className="grid grid-cols-3 gap-1">
                {TEXT_SHADOW_PRESETS.map((preset) => (
                  <MiniButton
                    key={preset.label}
                    active={selectedElement.textShadow === preset.value}
                    onClick={() => onUpdateElement(selectedElement.id, { textShadow: preset.value })}
                  >
                    {preset.label}
                  </MiniButton>
                ))}
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? TEXT STROKE ƒ"?ƒ"?ƒ"? */}
            <Section title="Text Stroke" icon={CircleDot} defaultOpen={false}>
              <div>
                <Label>Stroke Width</Label>
                <Slider
                  value={[selectedElement.textStroke ?? 0]}
                  onValueChange={([v]) => onUpdateElement(selectedElement.id, { textStroke: v })}
                  min={0} max={8} step={0.5} className="mt-1"
                />
                <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.textStroke ?? 0}px</span>
              </div>
              {(selectedElement.textStroke ?? 0) > 0 && (
                <ColorInput
                  label="Stroke Color"
                  value={selectedElement.textStrokeColor || "#000000"}
                  onChange={(textStrokeColor) => onUpdateElement(selectedElement.id, { textStrokeColor })}
                />
              )}
            </Section>

            {/* ƒ"?ƒ"?ƒ"? TEXT BACKGROUND BOX ƒ"?ƒ"?ƒ"? */}
            <Section title="Text Background" icon={Scan} defaultOpen={false}>
              <ColorInput
                label="Background Color"
                value={selectedElement.backgroundColor || "#00000000"}
                onChange={(backgroundColor) => onUpdateElement(selectedElement.id, { backgroundColor: backgroundColor === "#00000000" ? "" : backgroundColor })}
              />
              {selectedElement.backgroundColor && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Padding</Label>
                      <Slider
                        value={[selectedElement.backgroundPadding ?? 4]}
                        onValueChange={([v]) => onUpdateElement(selectedElement.id, { backgroundPadding: v })}
                        min={0} max={40} step={1} className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Radius</Label>
                      <Slider
                        value={[selectedElement.borderRadius ?? 0]}
                        onValueChange={([v]) => onUpdateElement(selectedElement.id, { borderRadius: v })}
                        min={0} max={30} step={1} className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Border Width</Label>
                    <Slider
                      value={[selectedElement.backgroundBorderWidth ?? 0]}
                      onValueChange={([v]) => onUpdateElement(selectedElement.id, { backgroundBorderWidth: v })}
                      min={0} max={10} step={1} className="mt-1"
                    />
                    <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.backgroundBorderWidth ?? 0}px</span>
                  </div>
                  {(selectedElement.backgroundBorderWidth ?? 0) > 0 && (
                    <ColorInput
                      label="Border Color"
                      value={selectedElement.backgroundBorderColor || "#ffffff"}
                      onChange={(backgroundBorderColor) => onUpdateElement(selectedElement.id, { backgroundBorderColor })}
                    />
                  )}
                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { backgroundColor: "", backgroundPadding: 0 })}
                    className="w-full h-6 rounded text-[10px] transition-all hover:brightness-110"
                    style={{ background: "rgba(180,30,30,0.1)", color: "rgba(220,80,80,0.8)", border: "1px solid rgba(180,30,30,0.2)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}
                  >
                    REMOVE BG
                  </button>
                </>
              )}
            </Section>

            {/* ƒ"?ƒ"?ƒ"? GLOW ƒ"?ƒ"?ƒ"? */}
            <Section title="Text Glow" icon={Zap} defaultOpen={false}>
              <div>
                <Label>Glow Color</Label>
                <div className="grid grid-cols-5 gap-1">
                  {GLOW_COLORS.map((g) => (
                    <button
                      key={g.label}
                      onClick={() => onUpdateElement(selectedElement.id, { glowColor: g.color, glowSize: g.color ? (selectedElement.glowSize || 15) : 0 })}
                      className="h-6 rounded-md transition-all hover:scale-110 flex items-center justify-center text-[8px]"
                      style={{
                        background: g.color || inputBg(),
                        border: selectedElement.glowColor === g.color ? `2px solid ${G.gold}` : `1px solid ${G.goldBorder}`,
                        color: textColorDim(),
                      }}
                      title={g.label}
                    >{!g.color && "ƒo"}</button>
                  ))}
                </div>
              </div>
              {selectedElement.glowColor && (
                <div>
                  <Label>Glow Size</Label>
                  <Slider value={[selectedElement.glowSize ?? 15]} onValueChange={([v]) => onUpdateElement(selectedElement.id, { glowSize: v })} min={1} max={60} step={1} className="mt-1" />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.glowSize ?? 15}px</span>
                </div>
              )}
            </Section>

            {/* ƒ"?ƒ"?ƒ"? FLIP ƒ"?ƒ"?ƒ"? */}
            <Section title="Flip & Mirror" icon={Maximize2} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2">
                <MiniButton active={!!selectedElement.flipX} onClick={() => onUpdateElement(selectedElement.id, { flipX: !selectedElement.flipX })}>ƒ+" Flip H</MiniButton>
                <MiniButton active={!!selectedElement.flipY} onClick={() => onUpdateElement(selectedElement.id, { flipY: !selectedElement.flipY })}>ƒ+ Flip V</MiniButton>
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? WORD SPACING ƒ"?ƒ"?ƒ"? */}
            <Section title="Word Spacing" icon={Ruler} defaultOpen={false}>
              <div>
                <Label>Word Spacing</Label>
                <Slider value={[selectedElement.wordSpacing ?? 0]} onValueChange={([v]) => onUpdateElement(selectedElement.id, { wordSpacing: v })} min={-0.2} max={2} step={0.05} className="mt-1" />
                <span className="text-[9px] text-muted-foreground/50 font-mono">{(selectedElement.wordSpacing ?? 0).toFixed(2)}em</span>
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? BLUR & EFFECTS ƒ"?ƒ"?ƒ"? */}
            <Section title="Blur & Effects" icon={Zap} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Text Blur</Label>
                  <Slider
                    value={[selectedElement.blur ?? 0]}
                    onValueChange={([v]) => onUpdateElement(selectedElement.id, { blur: v })}
                    min={0} max={10} step={0.5} className="mt-1"
                  />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.blur ?? 0}px</span>
                </div>
                <div>
                  <Label>Backdrop Blur</Label>
                  <Slider
                    value={[selectedElement.backdropBlur ?? 0]}
                    onValueChange={([v]) => onUpdateElement(selectedElement.id, { backdropBlur: v })}
                    min={0} max={20} step={1} className="mt-1"
                  />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.backdropBlur ?? 0}px</span>
                </div>
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? TRANSFORM ƒ"?ƒ"?ƒ"? */}
            <Section title="Transform" icon={Move}>
              <div>
                <Label>Opacity</Label>
                <Slider
                  value={[selectedElement.opacity]}
                  onValueChange={([v]) => onUpdateElement(selectedElement.id, { opacity: v })}
                  min={0} max={1} step={0.01} className="mt-1"
                />
                <span className="text-[9px] text-muted-foreground/50 font-mono">{Math.round(selectedElement.opacity * 100)}%</span>
              </div>
              <div>
                <Label>Rotation</Label>
                <div className="flex gap-1.5 items-center">
                  <Slider
                    value={[selectedElement.rotation]}
                    onValueChange={([v]) => onUpdateElement(selectedElement.id, { rotation: v })}
                    min={-180} max={180} step={1} className="flex-1"
                  />
                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { rotation: 0 })}
                    className="h-6 w-6 rounded flex items-center justify-center transition-all"
                    style={{ background: inputBg(), color: textColorDim(), border: `1px solid ${G.goldBorder}` }}
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                  </button>
                </div>
                <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.rotation}Aø</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Skew X</Label>
                  <Slider
                    value={[selectedElement.skewX ?? 0]}
                    onValueChange={([v]) => onUpdateElement(selectedElement.id, { skewX: v })}
                    min={-30} max={30} step={1} className="mt-1"
                  />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.skewX ?? 0}Aø</span>
                </div>
                <div>
                  <Label>Skew Y</Label>
                  <Slider
                    value={[selectedElement.skewY ?? 0]}
                    onValueChange={([v]) => onUpdateElement(selectedElement.id, { skewY: v })}
                    min={-30} max={30} step={1} className="mt-1"
                  />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{selectedElement.skewY ?? 0}Aø</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>X Position</Label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) => onUpdateElement(selectedElement.id, { x: Number(e.target.value) })}
                    className="w-full h-7 px-2 rounded text-[11px] outline-none"
                    style={{ background: inputBg(), border: `1px solid ${G.goldBorder}`, color: textColor() }}
                  />
                </div>
                <div>
                  <Label>Y Position</Label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) => onUpdateElement(selectedElement.id, { y: Number(e.target.value) })}
                    className="w-full h-7 px-2 rounded text-[11px] outline-none"
                    style={{ background: inputBg(), border: `1px solid ${G.goldBorder}`, color: textColor() }}
                  />
                </div>
              </div>
            </Section>

            {/* ƒ"?ƒ"?ƒ"? BLEND MODE ƒ"?ƒ"?ƒ"? */}
            <Section title="Blend Mode" icon={Blend} defaultOpen={false}>
              <div className="grid grid-cols-3 gap-1">
                {BLEND_MODES.map((m) => (
                  <MiniButton
                    key={m}
                    active={(selectedElement.blendMode || "normal") === m}
                    onClick={() => onUpdateElement(selectedElement.id, { blendMode: m })}
                  >
                    {m.split('-').map(w => w[0].toUpperCase()).join('')}
                  </MiniButton>
                ))}
              </div>
            </Section>

            <div className="mx-3 my-2 p-3 rounded-lg space-y-1.5" style={{ background: G.goldFaint, border: `1px solid ${G.goldBorder}` }}>
              {onDuplicateElement && (
                <button onClick={() => onDuplicateElement(selectedElement.id)} className="w-full h-8 rounded text-[10px] flex items-center justify-center gap-1.5 transition-all hover:brightness-110" style={{ background: inputBg(), color: textColor(), border: `1px solid ${G.goldBorder}`, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
                  <Copy className="h-3 w-3" /> DUPLICATE
                </button>
              )}
              <button onClick={() => onDeleteElement(selectedElement.id)} className="w-full h-8 rounded text-[10px] flex items-center justify-center gap-1.5 transition-all hover:brightness-110" style={{ background: "rgba(180,30,30,0.1)", color: "rgba(220,80,80,0.8)", border: "1px solid rgba(180,30,30,0.2)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
                <Trash2 className="h-3 w-3" /> DELETE
              </button>
            </div>
            </>
            )}
          </div>
        )}

        {/* ƒ"?ƒ"?ƒ"? EFFECTS TAB ƒ"?ƒ"?ƒ"? */}
        {activeTab === "effects" && (
          <div>
            <Section title="Film & Texture" icon={Film}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Film Grain</Label>
                  <Slider value={[poster.grain ?? 0]} onValueChange={([v]) => onUpdatePoster({ grain: v })} min={0} max={1} step={0.01} className="mt-1" />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{Math.round((poster.grain ?? 0) * 100)}%</span>
                </div>
                <div>
                  <Label>Vignette</Label>
                  <Slider value={[poster.vignette ?? 0]} onValueChange={([v]) => onUpdatePoster({ vignette: v })} min={0} max={1} step={0.01} className="mt-1" />
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{Math.round((poster.vignette ?? 0) * 100)}%</span>
                </div>
              </div>
            </Section>
            <Section title="Color Filter" icon={Paintbrush} badge={poster.filter !== "none" ? "ON" : undefined}>
              <div className="grid grid-cols-3 gap-1">
                {POSTER_FILTERS.map((f) => (
                  <MiniButton key={f.id} active={poster.filter === f.id} onClick={() => onUpdatePoster({ filter: f.id })}>{f.label}</MiniButton>
                ))}
              </div>
            </Section>
            <Section title="Adjustments" icon={SunMedium}>
              <div>
                <Label>Brightness</Label>
                <Slider value={[poster.brightness ?? 100]} onValueChange={([v]) => onUpdatePoster({ brightness: v })} min={0} max={200} step={1} className="mt-1" />
                <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.brightness ?? 100}%</span>
              </div>
              <div>
                <Label>Contrast</Label>
                <Slider value={[poster.contrast ?? 100]} onValueChange={([v]) => onUpdatePoster({ contrast: v })} min={0} max={200} step={1} className="mt-1" />
                <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.contrast ?? 100}%</span>
              </div>
              <div>
                <Label>Saturation</Label>
                <Slider value={[poster.saturation ?? 100]} onValueChange={([v]) => onUpdatePoster({ saturation: v })} min={0} max={300} step={1} className="mt-1" />
                <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.saturation ?? 100}%</span>
              </div>
              <div>
                <Label>Drop Shadow</Label>
                <Slider value={[poster.shadowIntensity ?? 0]} onValueChange={([v]) => onUpdatePoster({ shadowIntensity: v })} min={0} max={100} step={1} className="mt-1" />
                <span className="text-[9px] text-muted-foreground/50 font-mono">{poster.shadowIntensity ?? 0}</span>
              </div>
              <button onClick={() => onUpdatePoster({ brightness: 100, contrast: 100, saturation: 100, shadowIntensity: 0 })} className="w-full h-6 rounded text-[10px] flex items-center justify-center gap-1 transition-all hover:brightness-110" style={{ background: inputBg(), color: textColorDim(), border: `1px solid ${G.goldBorder}`, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
                <RotateCcw className="h-2.5 w-2.5" /> RESET
              </button>
            </Section>
            <Section title="Gradient Overlay" icon={Droplets} badge={`${OVERLAY_GRADIENTS.length}`}>
              <div className="grid grid-cols-2 gap-1">
                {OVERLAY_GRADIENTS.map((g) => (
                  <MiniButton key={g.label} active={poster.overlayGradient === g.css} onClick={() => onUpdatePoster({ overlayGradient: g.css })}>{g.label}</MiniButton>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InspectorPanel;

