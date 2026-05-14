import { useState, useRef, useCallback, useMemo, useEffect, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowUp, Star, ChevronDown, ChevronUp, ImagePlus, MessageSquareQuote, Moon, Sun, ShoppingCart, Plus, Minus, Trash2, ZoomIn, ZoomOut, Heart, Filter, ArrowUpDown, Settings2, X, Code2, Eye, Pencil, PencilOff, Save, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { WebsiteContent, CustomStyles } from "@/lib/generateContent";
import { fontPairsExport } from "@/lib/generateContent";

import ToolsPanel from "./ToolsPanel";
import CodeViewer from "./CodeViewer";
import { supabase } from "@/integrations/supabase/client";
import { buildFallbackImageUrl, regenerateSingleImage } from "@/lib/aiImages";

interface AIProductDetails {
  tagline: string;
  description: string;
  features: string[];
  materials: string;
  careInstructions: string;
  sustainability: string;
}

interface GeneratedWebsiteProps {
  content: WebsiteContent;
  onBack: () => void;
}

interface CartItem {
  name: string;
  price: string;
  image: string;
  quantity: number;
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeIn = {
  initial: { opacity: 0, y: 40 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease },
};

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 30, scale: 0.95 } as const,
  whileInView: { opacity: 1, y: 0, scale: 1 } as const,
  viewport: { once: true },
  transition: { delay: i * 0.12, duration: 0.7, ease },
});

/* ─── Edit Mode Context ─── */
const EditModeContext = createContext(false);

/* ─── Editable Text ─── */
const EditableText = ({ text, className, tag, style }: { text: string; className?: string; tag?: string; style?: React.CSSProperties }) => {
  const editMode = useContext(EditModeContext);
  const Tag = (tag || "p") as any;
  const [value, setValue] = useState(text);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement>(null);

  return (
    <Tag
      ref={ref as any}
      className={`${className || ""} ${editing && editMode ? "ring-2 ring-blue-400/50 rounded-lg outline-none px-2 -mx-2 bg-white/10" : editMode ? "cursor-pointer hover:bg-white/5 rounded" : ""} transition-all duration-200`}
      style={style}
      contentEditable={editing && editMode}
      suppressContentEditableWarning
      onClick={() => { if (editMode && !editing) { setEditing(true); setTimeout(() => ref.current?.focus(), 10); } }}
      onBlur={() => { setEditing(false); if (ref.current) setValue(ref.current.textContent || text); }}
    >
      {value}
    </Tag>
  );
};

/* ─── Editable Image ─── */
interface EditableImageResult {
  isFallback: boolean;
  isRetrying: boolean;
  handleRetry: (e: React.MouseEvent) => void;
}

const EditableImage = ({ src, alt, className, onClick, retryPrompt, onFallbackChange, onRetryStateChange, onSrcChange }: { src: string; alt: string; className?: string; onClick?: (src: string, alt: string) => void; retryPrompt?: string; onFallbackChange?: (isFallback: boolean) => void; onRetryStateChange?: (state: { isRetrying: boolean; handleRetry: (e: React.MouseEvent) => void }) => void; onSrcChange?: (newSrc: string) => void }) => {
  const editMode = useContext(EditModeContext);
  const [imageSrc, setImageSrc] = useState(src);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [scale, setScale] = useState(1);
  const [isRetrying, setIsRetrying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const retryCount = useRef(0);
  const onSrcChangeRef = useRef(onSrcChange);
  onSrcChangeRef.current = onSrcChange;

  useEffect(() => {
    setImageSrc(src);
    retryCount.current = 0;
    setHasError(false);
  }, [src]);

  const updateSrc = useCallback((newSrc: string) => {
    setImageSrc(newSrc);
    setHasError(false);
    retryCount.current = 0;
    onSrcChangeRef.current?.(newSrc);
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { updateSrc(e.target?.result as string); };
    reader.readAsDataURL(file);
  }, [updateSrc]);

  const handleError = useCallback(() => {
    if (!hasError) setHasError(true);
  }, [hasError]);

  const isFallback = hasError;

  useEffect(() => {
    onFallbackChange?.(isFallback);
  }, [isFallback, onFallbackChange]);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).__setImageSrc = (url: string) => {
        updateSrc(url);
      };
      (containerRef.current as any).__retryPrompt = retryPrompt || `A photograph depicting "${alt}". Commercial photography, cinematic lighting, no text, no words, no watermarks.`;
    }
  }, [retryPrompt, alt, updateSrc]);

  const handleRetry = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      const prompt = retryPrompt || `A photograph depicting "${alt}". Ultra-realistic commercial photography, cinematic lighting, razor-sharp focus. No text, no words, no watermarks.`;
      const newUrl = await regenerateSingleImage(prompt);
      if (newUrl) {
        updateSrc(newUrl);
        toast.success("Image regenerated!", { duration: 2000 });
      } else {
        toast.error("Regenerate failed, try again later", { duration: 2000 });
      }
    } catch {
      toast.error("Regenerate failed", { duration: 2000 });
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryPrompt, alt, updateSrc]);

  useEffect(() => {
    onRetryStateChange?.({ isRetrying, handleRetry });
  }, [isRetrying, handleRetry, onRetryStateChange]);

  return (
    <div
      ref={containerRef}
      className={`relative group overflow-hidden ${onClick ? "cursor-pointer" : ""} ${className || ""}`}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) handleFile(f); }}
      onClick={onClick ? () => onClick(imageSrc, alt) : undefined}
    >
      <img src={imageSrc} alt={alt} onError={handleError}
        className={`w-full h-full object-cover transition-all duration-500 editable-img ${isDragOver ? "opacity-40 scale-95" : ""}`}
        style={{ transform: `scale(${scale})`, border: `2px solid var(--shiny-border-color)`, boxShadow: `var(--shiny-border-glow)` }}
        loading="lazy" />
      {editMode && (
        <div className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${isDragOver ? "bg-blue-500/20 backdrop-blur-sm pointer-events-auto" : "opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none bg-black/30"}`}>
          <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.15, 2.5)); }}
            className="p-2 rounded-full bg-white/90 text-gray-800 shadow-lg hover:scale-110 transition-transform" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="p-3 rounded-full bg-white/90 text-gray-800 shadow-lg hover:scale-110 transition-transform" title="Replace image">
            <ImagePlus className="w-5 h-5" />
          </button>
          <button onClick={handleRetry} disabled={isRetrying}
            className="p-2 rounded-full bg-white/90 text-gray-800 shadow-lg hover:scale-110 transition-transform disabled:opacity-60" title="Regenerate with AI">
            <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 0.15, 0.5)); }}
            className="p-2 rounded-full bg-white/90 text-gray-800 shadow-lg hover:scale-110 transition-transform" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}
      {isDragOver && <div className="absolute inset-0 border-4 border-dashed border-blue-400 rounded-lg pointer-events-none z-30 flex items-center justify-center"><span className="text-white font-bold text-lg bg-blue-500/80 px-6 py-3 rounded-full">Drop image here</span></div>}
    </div>
  );
};

/* ─── Inline Regenerate Button (near text, outside image) ─── */
const InlineRegenerateBtn = ({ isRetrying, onRetry, accentColor }: { isRetrying: boolean; onRetry: (e: React.MouseEvent) => void; accentColor: string }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    onClick={onRetry}
    disabled={isRetrying}
    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-md transition-all hover:scale-105 disabled:opacity-60 ml-1 shrink-0"
    style={{ background: accentColor }}
    title="Regenerate image with AI"
  >
    <RefreshCw className={`w-2.5 h-2.5 ${isRetrying ? "animate-spin" : ""}`} />
    {isRetrying ? "..." : "Regenerate"}
  </motion.button>
);


const ProductCardWithRetry = ({
  product, topic, accentColor, headingStyle, cardBg, cardBorder, cardShadow, radius,
  editMode, isInWishlist, toggleWishlist, addToCart, openLightbox, variant = "default", badgeText, staggerProps, onProductImageChange,
}: {
  product: { name: string; price: string; image: string; description?: string; badge?: string };
  topic: string; accentColor: string; headingStyle: React.CSSProperties;
  cardBg: string; cardBorder: string; cardShadow: string; radius: string;
  editMode: boolean; isInWishlist: (name: string) => boolean;
  toggleWishlist: (item: { name: string; price: string; image: string; description?: string }) => void;
  addToCart: (item: { name: string; price: string; image: string }) => void;
  openLightbox: (src: string, alt: string, meta?: { price?: string; description?: string; badge?: string }) => void;
  variant?: "default" | "horizontal" | "overlay"; badgeText?: string; staggerProps?: any;
  onProductImageChange?: (newSrc: string) => void;
}) => {
  const [isFallback, setIsFallback] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(product.image);
  const [retryState, setRetryState] = useState<{ isRetrying: boolean; handleRetry: (e: React.MouseEvent) => void }>({ isRetrying: false, handleRetry: () => {} });
  const imageRef = useRef<HTMLDivElement>(null);

  const retryPrompt = `Generate a stunning ultra-premium product photography image of "${product.name}" — ${product.description || product.name}. This is a ${topic} product. Award-winning commercial photography, luxury brand aesthetic, cinematic lighting with dramatic highlights and rich shadows, razor-sharp focus, magazine-quality, editorial grade, absolutely no text, no words, no letters, no typography, no watermarks, pure imagery only, studio lighting with soft shadows, product showcase on elegant minimal background, e-commerce ready.`;

  const onFallbackChange = useCallback((fb: boolean) => setIsFallback(fb), []);
  const onRetryStateChange = useCallback((state: { isRetrying: boolean; handleRetry: (e: React.MouseEvent) => void }) => setRetryState(state), []);
  const handleSrcChange = useCallback((newSrc: string) => {
    setCurrentImageSrc(newSrc);
    onProductImageChange?.(newSrc);
  }, [onProductImageChange]);

  if (variant === "overlay") {
    return (
      <motion.div {...(staggerProps || {})} whileHover={{ y: -6 }}
        onClick={() => openLightbox(currentImageSrc, product.name, { price: product.price, description: product.description, badge: product.badge })}
        className="overflow-hidden transition-all duration-300 group cursor-pointer relative"
        style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
        <div ref={imageRef} className="relative overflow-hidden aspect-square">
          <EditableImage src={currentImageSrc} alt={product.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" retryPrompt={retryPrompt} onFallbackChange={onFallbackChange} onRetryStateChange={onRetryStateChange} onSrcChange={handleSrcChange} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {!editMode && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <span className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white backdrop-blur-md flex items-center gap-1" style={{ background: `${accentColor}cc` }}>
                <Eye className="w-3 h-3" /> Quick View
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-1 mb-1">
              <EditableText tag="h3" text={product.name} className="text-sm font-bold text-white truncate" />
              {editMode && <InlineRegenerateBtn isRetrying={retryState.isRetrying} onRetry={retryState.handleRetry} accentColor={accentColor} />}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">{product.price}</span>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); addToCart({ name: product.name, price: product.price, image: currentImageSrc }); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white backdrop-blur-sm" style={{ background: `${accentColor}cc` }}>
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...(staggerProps || {})} whileHover={{ y: -6 }}
      onClick={() => openLightbox(currentImageSrc, product.name, { price: product.price, description: product.description, badge: product.badge })}
      className="overflow-hidden transition-all duration-300 group cursor-pointer" style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
      <div ref={imageRef} className="relative overflow-hidden aspect-square">
        <EditableImage src={currentImageSrc} alt={product.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" retryPrompt={retryPrompt} onFallbackChange={onFallbackChange} onRetryStateChange={onRetryStateChange} onSrcChange={handleSrcChange} />
        {(product.badge || badgeText) && (
          <span className="absolute top-2 left-2 px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase text-white rounded-full" style={{ background: accentColor }}>
            {badgeText || product.badge}
          </span>
        )}
        {!editMode && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 0 }} className="group-hover:!opacity-100 px-4 py-2 rounded-full text-xs font-bold text-white backdrop-blur-md flex items-center gap-1.5 transition-all duration-300" style={{ background: `${accentColor}cc` }}>
              <Eye className="w-3.5 h-3.5" /> Quick View
            </motion.span>
          </div>
        )}
        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); toggleWishlist({ name: product.name, price: product.price, image: currentImageSrc, description: product.description }); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all z-10"
          style={{ background: isInWishlist(product.name) ? accentColor : "rgba(255,255,255,0.9)" }}>
          <Heart className="w-3.5 h-3.5" style={{ color: isInWishlist(product.name) ? "#fff" : "#666", fill: isInWishlist(product.name) ? "#fff" : "none" }} />
        </motion.button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1">
          <EditableText tag="h3" text={product.name} className="text-sm font-bold truncate" style={headingStyle} />
          {editMode && <InlineRegenerateBtn isRetrying={retryState.isRetrying} onRetry={retryState.handleRetry} accentColor={accentColor} />}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold" style={{ color: accentColor }}>{product.price}</span>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); addToCart({ name: product.name, price: product.price, image: currentImageSrc }); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: accentColor }}>
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── New Arrivals Card ─── */
const NewArrivalsCard = ({
  product, topic, accentColor, headingStyle, cardBg, cardBorder, cardShadow, radius,
  editMode, isInWishlist, toggleWishlist, addToCart, openLightbox, index, onProductImageChange,
}: {
  product: { name: string; price: string; image: string; description?: string; badge?: string };
  topic: string; accentColor: string; headingStyle: React.CSSProperties;
  cardBg: string; cardBorder: string; cardShadow: string; radius: string;
  editMode: boolean; isInWishlist: (name: string) => boolean;
  toggleWishlist: (item: { name: string; price: string; image: string; description?: string }) => void;
  addToCart: (item: { name: string; price: string; image: string }) => void;
  openLightbox: (src: string, alt: string, meta?: { price?: string; description?: string; badge?: string }) => void;
  index: number;
  onProductImageChange?: (newSrc: string) => void;
}) => {
  const [isFallback, setIsFallback] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(product.image);
  const [retryState, setRetryState] = useState<{ isRetrying: boolean; handleRetry: (e: React.MouseEvent) => void }>({ isRetrying: false, handleRetry: () => {} });
  const imageRef = useRef<HTMLDivElement>(null);

  const retryPrompt = `Generate a stunning ultra-premium product photography image of "${product.name}" — ${product.description || product.name}. This is a ${topic} product. Award-winning commercial photography, luxury brand aesthetic, cinematic lighting, razor-sharp focus, magazine-quality, editorial grade, absolutely no text, no typography, no watermarks, pure imagery only.`;

  const onFallbackChange = useCallback((fb: boolean) => setIsFallback(fb), []);
  const onRetryStateChange = useCallback((state: { isRetrying: boolean; handleRetry: (e: React.MouseEvent) => void }) => setRetryState(state), []);
  const handleSrcChange = useCallback((newSrc: string) => {
    setCurrentImageSrc(newSrc);
    onProductImageChange?.(newSrc);
  }, [onProductImageChange]);

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.5, ease }}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={() => openLightbox(currentImageSrc, product.name, { price: product.price, description: product.description, badge: product.badge })}
      className="snap-start shrink-0 w-[220px] sm:w-[260px] overflow-hidden transition-all duration-300 group cursor-pointer"
      style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
      <div ref={imageRef} className="relative overflow-hidden aspect-[3/4]">
        <EditableImage src={currentImageSrc} alt={product.name} className="w-full h-full group-hover:scale-110 transition-transform duration-700" retryPrompt={retryPrompt} onFallbackChange={onFallbackChange} onRetryStateChange={onRetryStateChange} onSrcChange={handleSrcChange} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="absolute top-3 left-3 px-3 py-1 text-[9px] font-bold tracking-wider uppercase text-white rounded-full backdrop-blur-sm" style={{ background: `${accentColor}dd` }}>New</span>
        {!editMode && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <span className="px-4 py-2 rounded-full text-xs font-bold text-white backdrop-blur-md flex items-center gap-1.5" style={{ background: `${accentColor}cc` }}>
              <Eye className="w-3.5 h-3.5" /> Quick View
            </span>
          </div>
        )}
        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); toggleWishlist({ name: product.name, price: product.price, image: currentImageSrc, description: product.description }); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all z-10"
          style={{ background: isInWishlist(product.name) ? accentColor : "rgba(255,255,255,0.9)" }}>
          <Heart className="w-3.5 h-3.5" style={{ color: isInWishlist(product.name) ? "#fff" : "#666", fill: isInWishlist(product.name) ? "#fff" : "none" }} />
        </motion.button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1">
          <EditableText tag="h3" text={product.name} className="text-sm font-bold truncate" style={headingStyle} />
          {editMode && <InlineRegenerateBtn isRetrying={retryState.isRetrying} onRetry={retryState.handleRetry} accentColor={accentColor} />}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold" style={{ color: accentColor }}>{product.price}</span>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); addToCart({ name: product.name, price: product.price, image: currentImageSrc }); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: accentColor }}>
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Hero Image with Retry (visible only in edit mode) ─── */
const HeroImageWithRetry = ({ src, alt, className, topic, accentColor, onSrcChange }: { src: string; alt: string; className?: string; topic: string; accentColor: string; onSrcChange?: (newSrc: string) => void }) => {
  const editMode = useContext(EditModeContext);
  const [isFallback, setIsFallback] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const retryPrompt = `Generate a stunning ultra-premium hero banner image for a ${topic} website. Award-winning commercial photography, luxury brand aesthetic, cinematic wide-angle composition, dramatic lighting with rich shadows, razor-sharp focus, magazine-quality, editorial grade, absolutely no text, no words, no letters, no typography, no watermarks, pure imagery only, hero banner ready.`;

  const handleRetry = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      const newUrl = await regenerateSingleImage(retryPrompt);
      if (newUrl) {
        const container = imageRef.current?.querySelector('[class*="relative group overflow-hidden"]') as any;
        if (container?.__setImageSrc) {
          container.__setImageSrc(newUrl);
        }
        onSrcChange?.(newUrl);
        toast.success("Hero image regenerated!", { duration: 2000 });
      } else {
        toast.error("Retry failed, try again later", { duration: 2000 });
      }
    } catch {
      toast.error("Retry failed", { duration: 2000 });
    } finally {
      setIsRetrying(false);
    }
  }, [retryPrompt, isRetrying, onSrcChange]);

  const onFallbackChange = useCallback((fb: boolean) => setIsFallback(fb), []);

  return (
    <div ref={imageRef} className="relative">
      <EditableImage src={src} alt={alt} className={className} retryPrompt={retryPrompt} onFallbackChange={onFallbackChange} onSrcChange={onSrcChange} />
      {editMode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleRetry}
          disabled={isRetrying}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-60 backdrop-blur-sm"
          style={{ background: `${accentColor}dd` }}
          title="Regenerate hero image with AI"
        >
          {isRetrying ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
          )}
          {isRetrying ? "Generating..." : "Regenerate"}
        </motion.button>
      )}
    </div>
  );
};


const ScrollToTopButton = ({ accentColor }: { accentColor: string }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return createPortal(
    <motion.button
      initial={{ opacity: 0, scale: 0.6, x: 20 }}
      animate={show ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.6, x: 20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed",
        bottom: "32px",
        right: "24px",
        zIndex: 99999,
        background: accentColor,
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        width: "48px",
        height: "48px",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 8px 30px ${accentColor}60`,
        pointerEvents: show ? "all" : "none",
      }}
      title="Back to top"
    >
      <ArrowUp style={{ width: 20, height: 20 }} />
    </motion.button>,
    document.body
  );
};

/* ─── CountUp ─── */
const CountUp = ({ value, style }: { value: string; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const numericPart = value.replace(/[^0-9.]/g, '');
  const prefix = value.match(/^[^0-9]*/)?.[0] || '';
  const suffix = value.match(/[^0-9]*$/)?.[0] || '';
  const target = parseFloat(numericPart) || 0;
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target]);
  return <div ref={ref} className="text-3xl md:text-4xl font-bold mb-2" style={style}>{prefix}{current}{suffix}</div>;
};


/* ─── Main Component ─── */
const GeneratedWebsite = ({ content: initialContent, onBack }: GeneratedWebsiteProps) => {
  // Load saved content from localStorage if available
  const [content, setContent] = useState<WebsiteContent>(() => {
    try {
      const saved = localStorage.getItem(`website-save-${initialContent.topic}`);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<WebsiteContent>;
        return { ...initialContent, ...parsed } as WebsiteContent;
      }
    } catch {}
    return initialContent;
  });
  const [showTools, setShowTools] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);


  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [wishlist, setWishlist] = useState<Array<{ name: string; price: string; image: string; description?: string }>>([]);
  const [showWishlist, setShowWishlist] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; price?: string; description?: string; badge?: string } | null>(null);
  const [aiDetails, setAiDetails] = useState<AIProductDetails | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [productQty, setProductQty] = useState(1);
  const [shopFilter, setShopFilter] = useState("All");
  const [shopSort, setShopSort] = useState<"default" | "price-asc" | "price-desc">("default");
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [regenAllProgress, setRegenAllProgress] = useState({ done: 0, total: 0 });

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const setRef = useCallback((id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el; }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const defaultStyles: CustomStyles = {
    fontDisplay: fontPairsExport[content.fontPairIndex % fontPairsExport.length]?.[0] || "'Playfair Display', serif",
    fontBody: fontPairsExport[content.fontPairIndex % fontPairsExport.length]?.[1] || "'Inter', sans-serif",
    bgColor: content.colorScheme.bg,
    textColor: content.colorScheme.dark,
    accentColor: content.colorScheme.accent,
    textScale: 1,
    borderRadius: 16,
    sectionSpacing: 100,
    buttonStyle: "rounded",
    navStyle: "glass",
    letterSpacing: 0,
    shadowStyle: "soft",
    animationEnabled: true,
    maxWidth: "1200px",
    heroHeight: "100vh",
    cardStyle: "elevated",
    imageFilter: "none",
    headingWeight: "700",
    lineHeight: 1.7,
    bgOverlayOpacity: 0.5,
  };

  const [customStyles, setCustomStyles] = useState<CustomStyles>(() => {
    try {
      const savedStyles = localStorage.getItem(`website-styles-${initialContent.topic}`);
      if (savedStyles) return { ...defaultStyles, ...JSON.parse(savedStyles) } as CustomStyles;
    } catch {}
    return defaultStyles;
  });

  const handleSave = useCallback(() => {
    try {
      // Strip large base64 images to avoid localStorage quota exceeded
      const saveContent = { ...content };
      const stripBase64 = (val: any): any => {
        if (typeof val === "string" && val.startsWith("data:image") && val.length > 500) return "__b64_stripped__";
        if (Array.isArray(val)) return val.map(stripBase64);
        if (val && typeof val === "object") {
          const out: any = {};
          for (const k of Object.keys(val)) out[k] = stripBase64(val[k]);
          return out;
        }
        return val;
      };
      const lite = stripBase64(saveContent);
      localStorage.setItem(`website-save-${content.topic}`, JSON.stringify(lite));
      localStorage.setItem(`website-styles-${content.topic}`, JSON.stringify(customStyles));
      toast.success("Changes saved! Styles and text edits are preserved.");
    } catch (err) {
      // If still too large, try saving only styles
      try {
        localStorage.setItem(`website-styles-${content.topic}`, JSON.stringify(customStyles));
        toast.success("Styles saved! (Content too large for full save)");
      } catch {
        toast.error("Failed to save — storage is full. Try clearing browser data.");
      }
    }
  }, [content, customStyles]);

  const handleRegenerateAll = useCallback(async () => {
    if (isRegeneratingAll) return;
    setIsRegeneratingAll(true);
    toast.info("Retrying all images... This may take a few minutes.", { duration: 8000 });

    // Find all EditableImage containers in the DOM
    const containers = document.querySelectorAll('[class*="relative group overflow-hidden"]');
    const targets: Array<{ el: any; prompt: string }> = [];
    containers.forEach((el: any) => {
      if (el.__setImageSrc && el.__retryPrompt) {
        targets.push({ el, prompt: el.__retryPrompt });
      }
    });

    const total = targets.length;
    setRegenAllProgress({ done: 0, total });
    let done = 0;
    let succeeded = 0;

    // Process ONE at a time to avoid rate limits
    for (const { el, prompt } of targets) {
      try {
        const newUrl = await regenerateSingleImage(prompt);
        if (newUrl) {
          el.__setImageSrc(newUrl);
          succeeded++;
        }
      } catch {}
      done++;
      setRegenAllProgress({ done, total });
      // Small delay between each to avoid rate limits
      if (done < total) {
        await new Promise(r => setTimeout(r, 800));
      }
    }

    setIsRegeneratingAll(false);
    setRegenAllProgress({ done: 0, total: 0 });
    toast.success(`Retried ${total} images — ${succeeded} succeeded!`, { duration: 3000 });
  }, [isRegeneratingAll]);

  /* ── Content image update helpers (keeps code viewer & save in sync) ── */
  const updateContentImage = useCallback((path: string, newSrc: string) => {
    setContent(prev => {
      const updated = { ...prev };
      if (path === "heroImage") { updated.heroImage = newSrc; }
      else if (path === "aboutImage") { updated.aboutImage = newSrc; }
      else if (path === "promoBanner") { updated.promoBanner = newSrc; }
      else if (path.startsWith("product-")) {
        const idx = parseInt(path.split("-")[1]);
        if (updated.products && updated.products[idx]) {
          updated.products = [...updated.products];
          updated.products[idx] = { ...updated.products[idx], image: newSrc };
        }
      } else if (path.startsWith("gallery-")) {
        const idx = parseInt(path.split("-")[1]);
        if (updated.galleryImages[idx]) {
          updated.galleryImages = [...updated.galleryImages];
          updated.galleryImages[idx] = { ...updated.galleryImages[idx], src: newSrc };
        }
      } else if (path.startsWith("service-")) {
        const idx = parseInt(path.split("-")[1]);
        if (updated.services[idx]) {
          updated.services = [...updated.services];
          updated.services[idx] = { ...updated.services[idx], image: newSrc };
        }
      } else if (path.startsWith("bgSection")) {
        (updated as any)[path] = newSrc;
      } else if (path.startsWith("categoryImage-")) {
        const idx = parseInt(path.split("-")[1]);
        if (updated.categoryImages && updated.categoryImages[idx] !== undefined) {
          updated.categoryImages = [...updated.categoryImages];
          updated.categoryImages[idx] = newSrc;
        }
      } else if (path.startsWith("blogPost-")) {
        const idx = parseInt(path.split("-")[1]);
        if (updated.blogPosts[idx]) {
          updated.blogPosts = [...updated.blogPosts];
          updated.blogPosts[idx] = { ...updated.blogPosts[idx], image: newSrc };
        }
      }
      return updated;
    });
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addToCart = useCallback((product: { name: string; price: string; image: string }) => {
    setCart(prev => {
      const existing = prev.find(item => item.name === product.name);
      if (existing) {
        return prev.map(item => item.name === product.name ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { name: product.name, price: product.price, image: product.image, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart!`, { duration: 2000 });
  }, []);

  const updateQuantity = useCallback((name: string, delta: number) => {
    setCart(prev => prev.map(item => item.name === name ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  }, []);

  const removeFromCart = useCallback((name: string) => {
    setCart(prev => prev.filter(item => item.name !== name));
  }, []);

  const cartTotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleWishlist = useCallback((product: { name: string; price: string; image: string; description?: string }) => {
    setWishlist(prev => {
      const exists = prev.find(i => i.name === product.name);
      if (exists) return prev.filter(i => i.name !== product.name);
      toast.success(`${product.name} added to wishlist!`, { duration: 2000 });
      return [...prev, product];
    });
  }, []);

  const isInWishlist = useCallback((name: string) => wishlist.some(i => i.name === name), [wishlist]);

  const generateLocalDetails = useCallback((productName: string, description?: string): AIProductDetails => {
    const t = content.topic.toLowerCase();
    return {
      tagline: `Premium ${t} crafted with excellence`,
      description: description || `Discover the exceptional quality and design of ${productName}. A standout piece from our ${t} collection, crafted to deliver both style and substance.`,
      features: [
        `Premium ${t} quality materials`,
        "Expertly crafted with attention to detail",
        "Designed for comfort and durability",
        `Part of our exclusive ${content.siteName} collection`,
      ],
      materials: `Premium ${t} materials`,
      careInstructions: "Handle with care. Follow product-specific care instructions.",
      sustainability: "Responsibly sourced and sustainably produced.",
    };
  }, [content.topic, content.siteName]);

  const aiDetailsCache = useRef<Map<string, AIProductDetails>>(new Map());

  const openLightbox = useCallback((src: string, alt: string, extra?: { price?: string; description?: string; badge?: string }) => {
    setLightboxImage({ src, alt, ...extra });
    setSelectedSize("M");
    setSelectedColor("");
    setSelectedVariant(0);
    setAiLoading(false);

    if (aiDetailsCache.current.has(alt)) {
      setAiDetails(aiDetailsCache.current.get(alt)!);
    } else {
      const details = generateLocalDetails(alt, extra?.description);
      aiDetailsCache.current.set(alt, details);
      setAiDetails(details);
    }
  }, [generateLocalDetails]);

  // Derived style values
  const effectiveBg = isDarkMode ? "#0a0a0a" : customStyles.bgColor;
  const effectiveText = isDarkMode ? "#f5f0eb" : customStyles.textColor;
  const radius = `${customStyles.borderRadius}px`;

  // Helper: convert hex + opacity (0-1) to rgba overlay
  const bgOverlay = (baseColor: string, opacityOverride?: number) => {
    const op = opacityOverride ?? customStyles.bgOverlayOpacity;
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${op})`;
  };
  const containerMaxW = customStyles.maxWidth;
  const cardBg = isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)";
  const shinyBorderColor = isDarkMode ? "rgba(183,110,121,0.4)" : "rgba(139,90,43,0.3)";
  const shinyGlow = isDarkMode
    ? "0 0 12px 0 rgba(183,110,121,0.15), inset 0 0 8px 0 rgba(183,110,121,0.08)"
    : "0 0 8px 0 rgba(139,90,43,0.12), inset 0 0 8px 0 rgba(139,90,43,0.06)";
  const cardBorder = shinyBorderColor;
  const cardShadow = customStyles.shadowStyle === "none" ? "none" : customStyles.shadowStyle === "dramatic" ? `0 25px 60px rgba(0,0,0,0.15), ${shinyGlow}` : `0 4px 20px rgba(0,0,0,0.06), ${shinyGlow}`;
  const headingStyle: React.CSSProperties = { fontFamily: customStyles.fontDisplay, color: effectiveText, fontWeight: customStyles.headingWeight, letterSpacing: `${customStyles.letterSpacing}em` };
  const mutedStyle: React.CSSProperties = { color: isDarkMode ? "rgba(245,240,235,0.5)" : `${customStyles.textColor}88`, lineHeight: customStyles.lineHeight };
  const pyStyle: React.CSSProperties = { paddingTop: `${customStyles.sectionSpacing}px`, paddingBottom: `${customStyles.sectionSpacing}px` };
  const btnClass = customStyles.buttonStyle === "pill" ? "rounded-full" : customStyles.buttonStyle === "square" ? "rounded-none" : `rounded-[${radius}]`;
  const btnStyle = (outline = false) => outline ? { borderRadius: radius, borderColor: customStyles.accentColor, color: customStyles.accentColor } as React.CSSProperties : { borderRadius: radius, background: customStyles.accentColor, color: "#fff" } as React.CSSProperties;
  const altSectionBg = isDarkMode ? "rgba(255,255,255,0.015)" : `${customStyles.accentColor}06`;
  const isAltBg = (idx: number) => idx % 2 === 1;
  const inputBg = isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)";
  const inputBorder = isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const heroOverlays = [
    "bg-gradient-to-b from-black/60 via-black/30 to-black/70",
    "bg-gradient-to-r from-black/80 via-black/40 to-transparent",
    "bg-gradient-to-t from-black/80 via-transparent to-black/30",
    "bg-gradient-to-br from-black/70 via-black/20 to-black/60",
    "bg-gradient-to-b from-transparent via-black/50 to-black/80",
  ];

  // Hero always uses full background image now, so nav text is always white
  const navUnscrolledColor = "#fff";
  const navUnscrolledBtnBg = "rgba(0,0,0,0.25)";

  const motionProps = customStyles.animationEnabled ? fadeIn : {};
  const staggerProps = (i: number) => customStyles.animationEnabled ? stagger(i) : {};

  // Nav links & section ordering
  const sectionOrder = useMemo(() => {
    const base = content.businessType === "ecommerce"
      ? ["about", "features", "shop", "gallery", "reviews", "blog", "faq", "partners"]
      : ["about", "services", "features", "process", "whyus", "gallery", "team", "reviews", "pricing", "blog", "faq", "partners"];
    // Shuffle slightly based on seed
    const seed = content.uniqueSeed;
    if (seed % 3 === 0) {
      const idx = base.indexOf("reviews");
      if (idx > 1) { base.splice(idx, 1); base.splice(Math.max(1, idx - 2), 0, "reviews"); }
    }
    return base;
  }, [content.businessType, content.uniqueSeed]);

  const heroCta = useMemo(() => {
    const isEcom = content.businessType === "ecommerce";
    return {
      primary: isEcom ? "Shop Now" : "Get Started",
      secondary: isEcom ? "View Collection" : "Learn More",
      scrollTarget: isEcom ? "shop" : "services",
      secondaryTarget: isEcom ? "gallery" : "about",
    };
  }, [content.businessType]);

  const navLinks = useMemo(() => {
    const links = content.navLinks || ["Home", "About", "Services", "Gallery", "Contact"];
    return links;
  }, [content.navLinks]);

  return (
    <EditModeContext.Provider value={editMode}>
    <div className={isDarkMode ? "dark" : ""} style={{ fontFamily: customStyles.fontBody, background: effectiveBg, color: effectiveText, fontSize: `${customStyles.textScale}rem` }}>

      {/* ══════════ NAV (outside overflow container so position:fixed works) ══════════ */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? (isDarkMode ? "rgba(10,10,10,0.88)" : "rgba(255,255,255,0.85)")
            : "rgba(0,0,0,0.45)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: `1px solid ${scrolled
            ? (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")
            : "rgba(255,255,255,0.10)"}`,
        }}>
        <div className="mx-auto flex items-center justify-between px-6 py-3" style={{ maxWidth: containerMaxW }}>
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md" style={{ background: `linear-gradient(135deg, ${customStyles.accentColor}, ${customStyles.accentColor}dd)` }}>
              {content.siteName.charAt(0)}
            </div>
            <span className="text-base font-bold tracking-tight" style={{ fontFamily: customStyles.fontDisplay, color: scrolled ? effectiveText : "#fff", textShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.5)" }}>{content.siteName}</span>
          </motion.div>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-1 px-1.5 py-1.5 rounded-full transition-all duration-500"
            style={{
              background: scrolled
                ? (isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.75)")
                : "rgba(0,0,0,0.25)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: `1px solid ${scrolled
                ? (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)")
                : "rgba(255,255,255,0.15)"}`,
              boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.06)" : "0 4px 20px rgba(0,0,0,0.2)",
            }}>
            {navLinks.map(link => (
              <button key={link} onClick={() => scrollTo(link.toLowerCase())}
                className="px-4 py-1.5 rounded-full text-[12px] font-medium tracking-wide uppercase transition-all duration-300"
                style={{
                  color: scrolled ? (isDarkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)") : "rgba(255,255,255,0.9)",
                  background: "transparent",
                  letterSpacing: "0.05em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = scrolled
                    ? (isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)")
                    : "rgba(255,255,255,0.15)";
                  e.currentTarget.style.color = scrolled
                    ? (isDarkMode ? "#fff" : "#000")
                    : "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = scrolled ? (isDarkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)") : "rgba(255,255,255,0.9)";
                }}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Right action buttons */}
          <div className="hidden md:flex items-center gap-1">
            {content.businessType === "ecommerce" && (
              <>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowWishlist(true)}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    color: scrolled ? (isDarkMode ? "#fff" : "#333") : "#fff",
                    background: scrolled ? (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") : "rgba(255,255,255,0.1)",
                  }}>
                  <Heart className="w-4 h-4" />
                  {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center" style={{ background: customStyles.accentColor }}>{wishlist.length}</span>}
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCart(true)}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    color: scrolled ? (isDarkMode ? "#fff" : "#333") : "#fff",
                    background: scrolled ? (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") : "rgba(255,255,255,0.1)",
                  }}>
                  <ShoppingCart className="w-4 h-4" />
                  {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center" style={{ background: customStyles.accentColor }}>{cartCount}</span>}
                </motion.button>
              </>
            )}
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                color: scrolled ? (isDarkMode ? "#fff" : "#333") : "#fff",
                background: scrolled ? (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") : "rgba(255,255,255,0.1)",
              }}>
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                color: scrolled ? (isDarkMode ? "#fff" : "#333") : "#fff",
                background: scrolled ? (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") : "rgba(255,255,255,0.1)",
              }}>
              <ArrowLeft className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ══════════ Floating Tools Sidebar ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="fixed right-4 top-20 z-50 flex flex-col gap-1.5 p-1.5 rounded-2xl"
        style={{
          background: isDarkMode ? "rgba(20,20,30,0.35)" : "rgba(255,255,255,0.35)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.20)",
        }}>
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
          onClick={() => setEditMode(!editMode)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: editMode ? customStyles.accentColor : (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"), color: editMode ? "#fff" : (isDarkMode ? "#fff" : "#111") }}
          title={editMode ? "Exit Edit Mode" : "Edit Mode"}>
          {editMode ? <PencilOff className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
        </motion.button>
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
          onClick={() => setShowCode(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: isDarkMode ? "#fff" : "#111" }}
          title="View Code">
          <Code2 className="w-4 h-4" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: isDarkMode ? "#fff" : "#111" }}
          title="Save Changes">
          <Save className="w-4 h-4" />
        </motion.button>
        {editMode && (
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            onClick={handleRegenerateAll}
            disabled={isRegeneratingAll}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all relative"
            style={{ background: isRegeneratingAll ? customStyles.accentColor : (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"), color: isRegeneratingAll ? "#fff" : (isDarkMode ? "#fff" : "#111") }}
            title="Regenerate All Images">
            <RotateCcw className={`w-4 h-4 ${isRegeneratingAll ? "animate-spin" : ""}`} />
            {isRegeneratingAll && regenAllProgress.total > 0 && (
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap" style={{ color: effectiveText }}>
                {regenAllProgress.done}/{regenAllProgress.total}
              </span>
            )}
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
          onClick={() => setShowTools(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: showTools ? customStyles.accentColor : (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"), color: showTools ? "#fff" : (isDarkMode ? "#fff" : "#111") }}
          title="Customize">
          <Settings2 className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Nav spacer — pushes content below the fixed transparent navbar */}
      <div style={{ height: "68px" }} />

    <div className="relative" style={{ overflowX: "clip" }}>
      {/* ══════════ HERO — Cinematic Premium with varied layouts ══════════ */}
      {/* ══════════ HERO — 5 Random Layouts ══════════ */}
{(() => {
  const luxuryEase: [number, number, number, number] = [0.19, 1, 0.22, 1];
  const smoothEase: [number, number, number, number] = [0.25, 1, 0.5, 1];

  // Pick layout once per site, stable across re-renders
  const layoutIndex = content.uniqueSeed % 5;

  const pageBg = isDarkMode ? "#0d0d0d" : "#fcfaf7";
  const textCol = isDarkMode ? "#ffffff" : "#1a1a1a";
  const acc = customStyles.accentColor;
  const fontD = customStyles.fontDisplay;
  const fontB = customStyles.fontBody;

  // ── Shared button components ──────────────────────────────────────────
  const PrimaryBtn = ({
    className = "",
    style = {},
  }: {
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <button
      onClick={() => scrollTo(heroCta.scrollTarget)}
      className={`font-bold text-[11px] tracking-[0.4em] uppercase transition-all shadow-xl hover:brightness-110 active:scale-95 ${className}`}
      style={{
        backgroundColor: acc,
        color: "#fff",
        borderRadius: radius,
        fontFamily: fontD,
        padding: "1rem 3rem",
        ...style,
      }}
    >
      {heroCta.primary}
    </button>
  );

  const SecondaryBtn = ({
    className = "",
    style = {},
  }: {
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <button
      onClick={() => scrollTo(heroCta.secondaryTarget)}
      className={`font-bold text-[11px] tracking-[0.4em] uppercase transition-all border active:scale-95 ${className}`}
      style={{
        backgroundColor: "transparent",
        color: textCol,
        borderColor: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
        borderRadius: radius,
        fontFamily: fontD,
        padding: "1rem 3rem",
        ...style,
      }}
    >
      {heroCta.secondary}
    </button>
  );

  // ════════════════════════════════════════════════════════════════════════
  // LAYOUT 0 — Editorial Split
  // Image anchored right, text floats left with gradient fade protection
  // ════════════════════════════════════════════════════════════════════════
  if (layoutIndex === 0) return (
    <section
      ref={setRef("home")}
      className="relative w-full h-screen overflow-hidden flex items-center"
      style={{ background: pageBg }}
    >
      {/* Image layer — right 70% */}
      <div className="absolute inset-0 z-0 flex justify-end">
        <div className="w-full md:w-[70%] h-full relative">
          <HeroImageWithRetry
            src={content.heroImage}
            alt={content.topic}
            className="w-full h-full object-cover object-right"
            topic={content.topic}
            accentColor={acc}
            onSrcChange={(src) => updateContentImage("heroImage", src)}
          />
          {/* Gradient fade protecting left text */}
          <div
            className="absolute inset-0 z-10"
            style={{
              background: `linear-gradient(90deg,
                ${pageBg} 0%,
                ${pageBg} 20%,
                ${isDarkMode ? "rgba(13,13,13,0.4)" : "rgba(252,250,247,0.4)"} 50%,
                transparent 100%)`,
            }}
          />
        </div>
      </div>

      {/* Content — left aligned */}
      <div className="relative z-20 w-full px-8 md:px-16 lg:px-24">
        <div className="max-w-3xl">

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 flex items-center gap-3"
          >
            <div className="w-6 h-[1px] opacity-30" style={{ background: textCol }} />
            <span
              className="text-[10px] tracking-[0.5em] uppercase font-bold opacity-50"
              style={{ fontFamily: fontB, color: textCol }}
            >
              {content.topic}
            </span>
          </motion.div>

          <div className="mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: luxuryEase }}
              className="leading-[1.1] m-0"
              style={{
                fontFamily: fontD,
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                color: textCol,
                letterSpacing: "-0.02em",
              }}
            >
              <EditableText text={content.tagline} />
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="max-w-md mb-14"
          >
            <EditableText
              text={content.heroQuote}
              className="text-lg font-light leading-relaxed opacity-60 italic"
              style={{ fontFamily: fontB, color: textCol }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center gap-6"
          >
            <PrimaryBtn />
            <SecondaryBtn />
          </motion.div>
        </div>
      </div>
    </section>
  );

  // ════════════════════════════════════════════════════════════════════════
  // LAYOUT 1 — Full Bleed Cinematic
  // Single BG image + centred frosted glass card
  // ════════════════════════════════════════════════════════════════════════
  if (layoutIndex === 1) return (
    <section
      ref={setRef("home")}
      className="relative w-full h-screen min-h-[600px] overflow-hidden flex items-center justify-center p-6 md:p-12"
      style={{ backgroundColor: isDarkMode ? "#0a0a0a" : customStyles.bgColor }}
    >
      {/* Full background image */}
      <div className="absolute inset-0 z-0">
        <HeroImageWithRetry
          src={content.heroImage}
          alt={content.topic}
          className="w-full h-full object-cover brightness-[0.85]"
          topic={content.topic}
          accentColor={acc}
          onSrcChange={(src) => updateContentImage("heroImage", src)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      </div>

      {/* Frosted glass card */}
      <div className="relative z-10 w-full max-w-[min(90vw,800px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: smoothEase }}
          className="backdrop-blur-xl p-8 md:p-12 text-center border border-white/10 shadow-2xl w-full"
          style={{
            backgroundColor: isDarkMode ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.28)",
            borderRadius: radius,
          }}
        >
          <span
            className="text-[10px] tracking-[0.5em] font-black uppercase mb-4 block opacity-70"
            style={{ color: isDarkMode ? "#fff" : textCol }}
          >
            {content.siteName}
          </span>

          <h1
            className="mb-6 leading-[1.2] tracking-tight"
            style={{
              fontFamily: fontD,
              fontSize: "calc(1.2rem + 2.5vh)",
              color: isDarkMode ? "#fff" : textCol,
              fontWeight: 900,
            }}
          >
            <EditableText text={content.tagline} />
          </h1>

          <p
            className="max-w-[45ch] mx-auto font-light leading-relaxed opacity-80 mb-10"
            style={{ color: isDarkMode ? "#fff" : textCol, fontSize: "min(1.1rem, calc(0.8rem + 0.5vh))" }}
          >
            <EditableText text={content.heroQuote} />
          </p>

          <div className="flex flex-wrap justify-center items-center gap-6">
            <motion.button
              whileHover={{ y: -3 }}
              onClick={() => scrollTo(heroCta.scrollTarget)}
              className="px-8 py-3.5 font-black tracking-widest uppercase transition-all shadow-xl"
              style={{ backgroundColor: acc, color: "#fff", borderRadius: radius, fontSize: "min(11px, 2vw)" }}
            >
              {heroCta.primary}
            </motion.button>

            <button
              onClick={() => scrollTo(heroCta.secondaryTarget)}
              className="font-bold tracking-widest uppercase opacity-40 hover:opacity-100 border-b pb-1 transition-opacity"
              style={{ color: isDarkMode ? "#fff" : textCol, borderColor: acc, fontSize: "min(11px, 2vw)" }}
            >
              {heroCta.secondary}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Scroll line indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-30">
        <div className="w-[1px] h-[5vh] min-h-[20px] bg-white" />
      </div>
    </section>
  );

  // ════════════════════════════════════════════════════════════════════════
  // LAYOUT 2 — 50/50 Horizontal Split
  // Image left half, text right half with subtle overlay
  // ════════════════════════════════════════════════════════════════════════
  if (layoutIndex === 2) return (
    <section
      ref={setRef("home")}
      className="relative w-full h-screen overflow-hidden flex items-center"
      style={{ background: isDarkMode ? "#0d0d0d" : "#ffffff" }}
    >
      {/* Image — left 50% */}
      <div className="absolute inset-0 z-0 flex justify-start">
        <div className="w-full md:w-1/2 h-full">
          <HeroImageWithRetry
            src={content.heroImage}
            alt={content.topic}
            className="w-full h-full object-cover"
            topic={content.topic}
            accentColor={acc}
            onSrcChange={(src) => updateContentImage("heroImage", src)}
          />
        </div>
      </div>

      {/* Subtle full overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundColor: isDarkMode ? "rgba(13,13,13,0.25)" : "rgba(252,250,247,0.35)",
        }}
      />

      {/* Content — right half */}
      <div className="relative z-20 w-full grid grid-cols-1 md:grid-cols-2 h-full">
        <div className="hidden md:block" />
        <div className="flex flex-col justify-center px-8 md:px-16 lg:px-20">
          <div className="max-w-xl">

            <div className="mb-6">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: luxuryEase }}
                className="leading-[1.2] m-0 uppercase"
                style={{
                  fontFamily: fontD,
                  fontSize: "clamp(2rem, 4vw, 3.5rem)",
                  color: textCol,
                  letterSpacing: "0.02em",
                }}
              >
                <EditableText text={content.tagline} />
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-10"
            >
              <EditableText
                text={content.heroQuote}
                className="text-base font-light leading-relaxed opacity-70"
                style={{ fontFamily: fontB, color: textCol, maxWidth: "420px" }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-6"
            >
              <PrimaryBtn />
              <SecondaryBtn />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );

  // ════════════════════════════════════════════════════════════════════════
  // LAYOUT 3 — Glass Panel Slide-in
  // Dark cinematic, animated glass half-panel, wide tracking headline
  // ════════════════════════════════════════════════════════════════════════
  if (layoutIndex === 3) return (
    <section
      ref={setRef("home")}
      className="relative h-screen min-h-[600px] flex items-center bg-black overflow-hidden"
      style={{ width: "100vw", marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}
    >
      {/* Full background image */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        <HeroImageWithRetry
          src={content.heroImage}
          alt={content.topic}
          className="w-full h-full object-cover object-center absolute inset-0 block"
          topic={content.topic}
          accentColor={acc}
          onSrcChange={(src) => updateContentImage("heroImage", src)}
        />
        <div className="absolute inset-0 bg-black/40 z-10" />
      </div>

      {/* Animated glass panel — slides in from left */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 w-full md:w-[50%] h-full z-20 backdrop-blur-[35px] border-r border-white/10"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
      />

      {/* Text content */}
      <div className="relative z-30 container mx-auto px-8 md:px-24">
        <div className="max-w-xl">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 1.2, ease: luxuryEase }}
            className="flex items-center gap-6 mb-10"
          >
            <div className="w-10 h-[1px] bg-white/40" />
            <span className="text-[9px] tracking-[0.8em] uppercase font-bold text-white/50">
              {content.topic}
            </span>
          </motion.div>

          <div className="mb-8 overflow-hidden">
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: luxuryEase, delay: 0.3 }}
              className="m-0 leading-tight uppercase font-light text-white"
              style={{
                fontFamily: fontD,
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                letterSpacing: "0.45em",
                textShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              <EditableText text={content.tagline} />
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.2 }}
            className="mb-14 border-l border-white/30 pl-8"
          >
            <EditableText
              text={content.introSubtitle}
              className="text-[11px] leading-[2.8] text-white/60 tracking-[0.5em] uppercase font-light max-w-sm"
              style={{ fontFamily: fontB }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-14"
          >
            {/* Animated underline button */}
            <button
              onClick={() => scrollTo(heroCta.scrollTarget)}
              className="group relative pb-2"
            >
              <span className="text-[10px] tracking-[0.7em] uppercase font-bold text-white transition-opacity group-hover:opacity-70">
                {heroCta.primary}
              </span>
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/20" />
              <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover:w-full transition-all duration-700 ease-out" />
            </button>

            <button
              onClick={() => scrollTo(heroCta.secondaryTarget)}
              className="text-[10px] tracking-[0.7em] uppercase text-white/40 hover:text-white transition-colors"
            >
              {heroCta.secondary}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );

  // ════════════════════════════════════════════════════════════════════════
  // LAYOUT 4 — Mask Fade + Frosted Card
  // Image fades out at bottom via CSS mask, pill-tag buttons in card
  // ════════════════════════════════════════════════════════════════════════
  return (
    <section
      ref={setRef("home")}
      className="relative w-full h-screen min-h-[700px] overflow-hidden"
      style={{ background: isDarkMode ? "#0d0d0d" : "#ffffff" }}
    >
      {/* Image with CSS mask bottom fade */}
      <div
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)",
        }}
      >
        <HeroImageWithRetry
          src={content.heroImage}
          alt={content.topic}
          className="w-full h-full object-cover object-center absolute inset-0 block"
          topic={content.topic}
          accentColor={acc}
          onSrcChange={(src) => updateContentImage("heroImage", src)}
        />
      </div>

      {/* Frosted card — bottom left */}
      <div className="relative z-20 w-full h-full container mx-auto px-8 md:px-24 flex flex-col justify-end pb-32 md:pb-48 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: smoothEase }}
          className="max-w-[400px] p-6 md:p-8 rounded-[1.5rem] backdrop-blur-[20px] bg-white/30 border border-white/40 shadow-xl pointer-events-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-2"
          >
            <span className="text-[11px] font-bold text-black tracking-[0.1em] uppercase">
              {content.topic}
            </span>
          </motion.div>

          <div className="overflow-hidden mb-4">
            <motion.h1
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: smoothEase, delay: 0.1 }}
              className="m-0 text-black leading-[1.2] tracking-tight uppercase"
              style={{ fontFamily: fontB, fontSize: "1.5rem", fontWeight: 600 }}
            >
              <EditableText text={content.tagline} />
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="mb-6"
          >
            <EditableText
              text={content.heroQuote}
              className="text-[13px] md:text-[14px] text-gray-800 font-normal leading-relaxed opacity-90"
              style={{ fontFamily: fontB }}
            />
          </motion.div>

          {/* Pill tag buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center flex-wrap gap-3"
          >
            <button
              onClick={() => scrollTo(heroCta.scrollTarget)}
              className="px-4 py-1.5 rounded-full border border-black/20 text-black text-[12px] font-semibold hover:bg-black hover:text-white transition-colors"
            >
              {heroCta.primary}
            </button>
            <button
              onClick={() => scrollTo(heroCta.secondaryTarget)}
              className="px-4 py-1.5 rounded-full border border-black/20 text-black text-[12px] font-semibold hover:bg-black hover:text-white transition-colors"
            >
              {heroCta.secondary}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
})()}
      {/* ══════════ STATS ══════════ */}
      <section className="relative z-20 px-6 -mt-10">
        <div className="mx-auto grid grid-cols-2 md:grid-cols-4 gap-4" style={{ maxWidth: containerMaxW }}>
          {content.stats.map((stat, i) => (
            <motion.div key={i} {...staggerProps(i)} whileHover={{ y: -4 }}
              className="p-6 text-center transition-all duration-300" style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
              <CountUp value={stat.value} style={{ fontFamily: customStyles.fontDisplay, color: customStyles.accentColor }} />
              <span className="text-sm" style={mutedStyle}>{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ DYNAMIC SECTIONS (order varies per website) ══════════ */}
      {sectionOrder.map((sectionId, idx) => {
        const altBg = isAltBg(idx);
        const sectionStyle = altBg ? { ...pyStyle, background: altSectionBg } : pyStyle;

        switch (sectionId) {
          case "about":
            return (
              <section key="about" ref={setRef("about")} className="px-6 relative overflow-hidden" style={sectionStyle}>
                {content.bgSection5 && (
                  <>
                    <img src={content.bgSection5} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className="mx-auto relative z-10" style={{ maxWidth: containerMaxW }}>
                  <motion.div {...motionProps}>
                    <EditableText tag="h2" text={content.aboutTitle} className="text-3xl md:text-5xl font-bold text-center mb-14" style={headingStyle} />
                  </motion.div>
                  {/* Unique layout: wide image on top, text columns below */}
                  <motion.div {...motionProps} className="mb-10 overflow-hidden" style={{ borderRadius: radius, boxShadow: cardShadow }}>
                    <div className="aspect-[21/9] overflow-hidden">
                      <EditableImage src={content.aboutImage} alt="About" className="w-full h-full" onClick={openLightbox} onSrcChange={(src) => updateContentImage("aboutImage", src)} retryPrompt={`Generate a warm lifestyle photograph about "${content.topic}". Show ${content.topic} being actively used or displayed in a real-world scenario. Ultra-realistic commercial photography, cinematic lighting, razor-sharp focus. No text, no words, no watermarks.`} />
                    </div>
                  </motion.div>
                  <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    <motion.div {...motionProps} className="space-y-5">
                      {content.aboutText.slice(0, Math.ceil(content.aboutText.length / 2)).map((p, i) => (
                        <EditableText key={i} text={p} className="leading-relaxed text-base" style={mutedStyle} />
                      ))}
                    </motion.div>
                    <motion.div {...motionProps} className="space-y-5">
                      {content.aboutText.slice(Math.ceil(content.aboutText.length / 2)).map((p, i) => (
                        <EditableText key={i} text={p} className="leading-relaxed text-base" style={mutedStyle} />
                      ))}
                      <motion.button whileHover={{ scale: 1.03 }}
                        className={`mt-4 px-8 py-3 font-semibold text-sm transition-all ${btnClass}`} style={btnStyle()}>
                        Learn More
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </section>
            );

          case "services":
            return (
              <section key="services" ref={setRef("services")} className="px-6 relative overflow-hidden" style={sectionStyle}>
                {content.bgSection6 && (
                  <>
                    <img src={content.bgSection6} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className="mx-auto relative z-10" style={{ maxWidth: containerMaxW }}>
                  <motion.div {...motionProps} className="text-center mb-14">
                    <EditableText tag="h2" text="Our Services" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
                    <EditableText text={`Comprehensive ${content.topic.toLowerCase()} solutions tailored to your needs`} className="max-w-lg mx-auto" style={mutedStyle} />
                  </motion.div>
                  <div className="grid md:grid-cols-3 gap-8">
                    {content.services.map((service, i) => (
                      <motion.div key={i} {...staggerProps(i)} whileHover={{ y: -8 }}
                        className="overflow-hidden transition-all duration-300 group" style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
                        <div className="overflow-hidden h-52">
                          <EditableImage src={service.image} alt={service.title} className="h-52 w-full group-hover:scale-105 transition-transform duration-500" onClick={openLightbox} retryPrompt={`Generate a photograph of the "${service.title}" service for a ${content.topic} business. ${service.description}. Ultra-realistic commercial photography, cinematic lighting. No text, no words, no watermarks.`} onSrcChange={(src) => updateContentImage(`service-${i}`, src)} />
                        </div>
                        <div className="p-6">
                          <EditableText tag="h3" text={service.title} className="text-lg font-bold mb-3" style={headingStyle} />
                          <EditableText text={service.description} className="text-sm leading-relaxed" style={mutedStyle} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "features": {
            const featuresBgUrl = content.bgSection3 || `https://source.unsplash.com/1600x900/?${encodeURIComponent(content.topic)},background&sig=${content.uniqueSeed + 3}`;
            return (
              <section key="features" ref={setRef("features")} className="px-6 relative overflow-hidden" style={{ ...sectionStyle, background: "transparent" }}>
                <img src={featuresBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0" style={{ background: isDarkMode ? "rgba(0,0,0,0.82)" : `linear-gradient(135deg, ${bgOverlay(effectiveBg, 0.88)} 0%, ${bgOverlay(customStyles.accentColor, 0.55)} 100%)` }} />
                <div className="mx-auto relative z-10" style={{ maxWidth: containerMaxW }}>
                  <motion.div {...motionProps} className="text-center mb-14">
                    <EditableText tag="h2" text="Why Choose Us" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
                    <EditableText text={`What makes our ${content.topic.toLowerCase()} services stand out`} className="max-w-lg mx-auto" style={mutedStyle} />
                  </motion.div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {content.features.map((feature, i) => (
                      <motion.div key={i} {...staggerProps(i)} whileHover={{ y: -8, scale: 1.02 }}
                        className="p-8 transition-all duration-300" style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
                        <span className="text-4xl mb-5 block">{feature.icon}</span>
                        <EditableText tag="h3" text={feature.title} className="text-xl font-bold mb-3" style={headingStyle} />
                        <EditableText text={feature.description} className="text-sm leading-relaxed" style={mutedStyle} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "process": {
            const useTimeline = content.layoutVariant % 2 === 0;
            return (
              <section key="process" ref={setRef("process")} className="px-6 relative overflow-hidden" style={sectionStyle}>
                {content.bgSection7 && (
                  <>
                    <img src={content.bgSection7} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className="mx-auto relative z-10" style={{ maxWidth: containerMaxW }}>
                  <motion.div {...motionProps} className="text-center mb-14">
                    <EditableText tag="h2" text="How It Works" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
                    <EditableText text="Our proven process delivers exceptional results every time" className="max-w-lg mx-auto" style={mutedStyle} />
                  </motion.div>
                  {useTimeline ? (
                    /* ── Timeline Layout ── */
                    <div className="relative max-w-3xl mx-auto">
                      {/* Vertical line */}
                      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px" style={{ background: `${customStyles.accentColor}20` }} />
                      {content.process.map((step, i) => {
                        const isLeft = i % 2 === 0;
                        return (
                          <motion.div key={i} {...staggerProps(i)}
                            className={`relative flex items-start mb-12 last:mb-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}>
                            {/* Dot */}
                            <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10 border-4 shrink-0"
                              style={{ background: cardBg, borderColor: customStyles.accentColor, top: "4px" }} />
                            {/* Content */}
                            <div className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${isLeft ? "md:pr-8 md:text-right" : "md:pl-8 md:text-left"} ${isLeft ? "" : "md:ml-auto"}`}>
                              <motion.div whileHover={{ y: -4 }} className="p-6 transition-all duration-300"
                                style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
                                <span className="text-xs font-bold tracking-[0.2em] uppercase mb-2 block" style={{ color: customStyles.accentColor }}>Step {step.step}</span>
                                <EditableText tag="h3" text={step.title} className="text-lg font-bold mb-2" style={headingStyle} />
                                <EditableText text={step.description} className="text-sm leading-relaxed" style={mutedStyle} />
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── Classic Grid Layout ── */
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
                      {content.process.map((step, i) => (
                        <motion.div key={i} {...staggerProps(i)} className="text-center relative">
                          {i < 3 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[1px]" style={{ background: `${customStyles.accentColor}20` }} />}
                          <motion.div whileHover={{ rotate: 5, scale: 1.1 }}
                            className="w-16 h-16 flex items-center justify-center mx-auto mb-5" style={{ background: customStyles.accentColor + "14", borderRadius: radius }}>
                            <span className="text-xl font-bold" style={{ fontFamily: customStyles.fontDisplay, color: customStyles.accentColor }}>{step.step}</span>
                          </motion.div>
                          <EditableText tag="h3" text={step.title} className="text-lg font-bold mb-3" style={headingStyle} />
                          <EditableText text={step.description} className="text-sm leading-relaxed" style={mutedStyle} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case "whyus":
            return (
              <section key="whyus" ref={setRef("whyus")} className="px-6 relative overflow-hidden" style={sectionStyle}>
                {content.bgSection6 && (
                  <>
                    <img src={content.bgSection6} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className="mx-auto relative z-10" style={{ maxWidth: containerMaxW }}>
                  <motion.div {...motionProps}>
                    <EditableText tag="h2" text={`Why ${content.siteName}?`} className="text-3xl md:text-5xl font-bold text-center mb-14" style={headingStyle} />
                  </motion.div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {content.whyUs.map((item, i) => (
                      <motion.div key={i} {...staggerProps(i)} whileHover={{ y: -6, scale: 1.03 }}
                        className="p-6 text-center hover:shadow-lg transition-all duration-300" style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
                        <span className="text-3xl mb-4 block">{item.icon}</span>
                        <EditableText tag="h3" text={item.title} className="text-lg font-bold mb-2" style={headingStyle} />
                        <EditableText text={item.description} className="text-sm leading-relaxed" style={mutedStyle} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "gallery": {
            const useMasonry = content.layoutVariant % 3 !== 0;
            const galleryClickHandler = (img: { src: string; caption: string }, _i: number) => {
              openLightbox(img.src, img.caption);
            };
            return (
              <section key="gallery" ref={setRef("gallery")} className="px-6 relative overflow-hidden" style={sectionStyle}>
                {content.bgSection4 && (
                  <>
                    <img src={content.bgSection4} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className="mx-auto relative z-10" style={{ maxWidth: containerMaxW }}>
                  <motion.div {...motionProps}>
                    <EditableText tag="h2" text={content.businessType === "ecommerce" ? `${content.topic} Collection` : "Our Gallery"} className="text-3xl md:text-5xl font-bold text-center mb-4" style={headingStyle} />
                    <EditableText text={`A visual showcase of our finest ${content.topic.toLowerCase()} collection`} className="text-center max-w-lg mx-auto mb-14" style={mutedStyle} />
                  </motion.div>
                  {useMasonry ? (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                      {content.galleryImages.map((img, i) => {
                        const heights = ["h-48", "h-64", "h-56", "h-72", "h-52", "h-60", "h-44", "h-68"];
                        return (
                          <motion.div key={i} {...staggerProps(i)} whileHover={{ scale: 1.02 }}
                            className="break-inside-avoid overflow-hidden group cursor-pointer" style={{ borderRadius: radius }}>
                            <div className="relative" onClick={() => galleryClickHandler(img, i)}>
                              <EditableImage src={img.src} alt={`${content.topic} ${img.caption}`} className={`w-full ${heights[i % heights.length]}`} onClick={() => galleryClickHandler(img, i)} onSrcChange={(src) => updateContentImage(`gallery-${i}`, src)} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 pointer-events-none">
                                <span className="text-white text-sm font-medium">{img.caption}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {content.galleryImages.map((img, i) => (
                        <motion.div key={i} {...staggerProps(i)} whileHover={{ scale: 1.03 }}
                          className={`overflow-hidden cursor-pointer group relative ${i === 0 || i === 5 ? "md:col-span-2 md:row-span-2" : ""}`} style={{ borderRadius: radius }}>
                          <EditableImage src={img.src} alt={`${content.topic} ${img.caption}`} className={`w-full ${i === 0 || i === 5 ? "h-56 md:h-full min-h-[280px]" : "h-48 md:h-52"}`} onClick={() => galleryClickHandler(img, i)} onSrcChange={(src) => updateContentImage(`gallery-${i}`, src)} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case "team":
            return (
              <section key="team" ref={setRef("team")} className="px-6" style={sectionStyle}>
                <div className="mx-auto" style={{ maxWidth: containerMaxW }}>
                  <motion.div {...motionProps} className="text-center mb-14">
                    <EditableText tag="h2" text="Meet Our Team" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
                    <EditableText text="The passionate people behind our success" className="max-w-lg mx-auto" style={mutedStyle} />
                  </motion.div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {content.team.map((member, i) => (
                      <motion.div key={i} {...staggerProps(i)} whileHover={{ y: -8 }} className="text-center group">
                        <div className="w-36 h-36 mx-auto mb-5 rounded-full overflow-hidden group-hover:shadow-xl transition-shadow border-4 border-white" style={{ boxShadow: cardShadow }}>
                          <EditableImage src={member.image} alt={member.name} className="w-full h-full" />
                        </div>
                        <EditableText tag="h3" text={member.name} className="font-bold text-lg mb-1" style={headingStyle} />
                        <EditableText text={member.role} className="text-sm font-medium" style={{ color: customStyles.accentColor }} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "reviews": {
            const useHorizontalScroll = content.layoutVariant % 2 === 1;
            return (
              <section key="reviews" ref={setRef("reviews")} className="relative overflow-hidden" style={sectionStyle}>
                {content.bgSection4 && (
                  <>
                    <img src={content.bgSection4} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className={`relative z-10 ${useHorizontalScroll ? "" : "px-6"}`}>
                  <div className="mx-auto px-6" style={{ maxWidth: containerMaxW }}>
                    <motion.div {...motionProps} className="text-center mb-14">
                      <EditableText tag="h2" text="What People Say" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
                      <EditableText text="Real stories from real clients who trust us" className="max-w-lg mx-auto" style={mutedStyle} />
                    </motion.div>
                  </div>
                  {useHorizontalScroll ? (
                    /* ── Horizontal Scrolling Testimonials ── */
                    <div className="overflow-x-auto pb-6" style={{ scrollbarWidth: "thin", scrollbarColor: `${customStyles.accentColor} ${customStyles.accentColor}20` }}>
                      <div className="flex gap-6 px-6" style={{ width: "max-content" }}>
                        {content.testimonials.map((t, i) => (
                          <motion.div key={i} {...staggerProps(i)} whileHover={{ y: -4 }}
                            className="p-8 transition-all duration-300 shrink-0" style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}`, width: "380px", maxWidth: "85vw" }}>
                            <div className="flex items-center gap-4 mb-5">
                              <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full object-cover shrink-0 border-2" style={{ borderColor: customStyles.accentColor + "30" }} loading="lazy" />
                              <div className="min-w-0">
                                <p className="font-bold text-base" style={{ color: effectiveText }}>{t.name}</p>
                                <p className="text-xs" style={mutedStyle}>{t.role}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 mb-4">
                              {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4" style={{ fill: customStyles.accentColor, color: customStyles.accentColor }} />)}
                            </div>
                            <EditableText text={`"${t.text}"`} className="italic text-sm leading-relaxed" style={mutedStyle} />
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex justify-center mt-4 gap-1.5">
                        {content.testimonials.map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full" style={{ background: i === 0 ? customStyles.accentColor : `${customStyles.accentColor}30` }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* ── Classic Grid ── */
                    <div className="px-6">
                      <div className="mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ maxWidth: containerMaxW }}>
                        {content.testimonials.map((t, i) => (
                          <motion.div key={i} {...staggerProps(i)} whileHover={{ y: -4 }}
                            className="p-8 transition-all duration-300" style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
                            <MessageSquareQuote className="w-7 h-7 mb-4" style={{ color: customStyles.accentColor + "40" }} />
                            <div className="flex gap-1 mb-4">
                              {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4" style={{ fill: customStyles.accentColor, color: customStyles.accentColor }} />)}
                            </div>
                            <EditableText text={`"${t.text}"`} className="italic mb-6 text-sm leading-relaxed" style={mutedStyle} />
                            <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
                              <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" loading="lazy" />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate" style={{ color: effectiveText }}>{t.name}</p>
                                <p className="text-xs truncate" style={mutedStyle}>{t.role}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case "pricing":
            return (
              <section key="pricing" ref={setRef("pricing")} className="px-6 relative overflow-hidden" style={sectionStyle}>
                {content.bgSection8 && (
                  <>
                    <img src={content.bgSection8} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className="mx-auto relative z-10" style={{ maxWidth: "960px" }}>
                  <motion.div {...motionProps} className="text-center mb-14">
                    <EditableText tag="h2" text="Pricing Plans" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
                    <EditableText text="Choose the perfect plan that fits your needs" className="max-w-lg mx-auto" style={mutedStyle} />
                  </motion.div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {content.pricing.map((plan, i) => (
                      <motion.div key={i} {...staggerProps(i)} whileHover={{ y: -6 }}
                        className={`p-8 text-center transition-all duration-300 ${plan.highlighted ? "relative" : ""}`}
                        style={{ borderRadius: radius, boxShadow: plan.highlighted ? `0 20px 50px ${customStyles.accentColor}20` : cardShadow, background: cardBg, border: `2px solid ${plan.highlighted ? customStyles.accentColor : cardBorder}` }}>
                        {plan.highlighted && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white rounded-full" style={{ background: customStyles.accentColor }}>
                            Most Popular
                          </div>
                        )}
                        <EditableText tag="h3" text={plan.name} className="text-xl font-bold mb-2" style={headingStyle} />
                        <p className="text-4xl font-bold mb-6" style={{ fontFamily: customStyles.fontDisplay, color: plan.highlighted ? customStyles.accentColor : customStyles.textColor }}>
                          {plan.price}
                        </p>
                        <ul className="space-y-3 mb-8 text-left">
                          {plan.features.map((f, j) => (
                            <li key={j} className="flex items-center gap-2 text-sm" style={mutedStyle}>
                              <span style={{ color: customStyles.accentColor }}>✓</span> {f}
                            </li>
                          ))}
                        </ul>
                        <motion.button whileHover={{ scale: 1.03 }}
                          className={`w-full py-3 font-semibold transition-all ${btnClass}`}
                          style={plan.highlighted ? btnStyle() : { background: effectiveText + "10", color: effectiveText, borderRadius: radius }}>
                          Get Started
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "blog":
            return (
              <section key="blog" ref={setRef("blog")} className="px-6 relative overflow-hidden" style={sectionStyle}>
                {content.bgSection5 && (
                  <>
                    <img src={content.bgSection5} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className="mx-auto relative z-10" style={{ maxWidth: containerMaxW }}>
                  <motion.div {...motionProps} className="text-center mb-14">
                    <EditableText tag="h2" text="Latest Insights" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
                    <EditableText text={`Stay informed with our latest ${content.topic.toLowerCase()} articles and guides`} className="max-w-lg mx-auto" style={mutedStyle} />
                  </motion.div>
                  <div className="grid md:grid-cols-3 gap-8">
                    {content.blogPosts.map((post, i) => (
                      <motion.div key={i} {...staggerProps(i)} whileHover={{ y: -8 }}
                        className="overflow-hidden transition-all duration-300 group cursor-pointer" style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
                        <div className="overflow-hidden h-48">
                          <EditableImage src={post.image} alt={post.title} className="h-48 w-full group-hover:scale-105 transition-transform duration-500" onClick={openLightbox} retryPrompt={`Generate a blog header photograph about "${post.title}" for a ${content.topic} website. Editorial photography, magazine quality, cinematic lighting. No text, no words, no watermarks.`} onSrcChange={(src) => updateContentImage(`blogPost-${i}`, src)} />
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: customStyles.accentColor }}>{post.category}</span>
                            <span className="text-[10px]" style={mutedStyle}>·</span>
                            <span className="text-[10px]" style={mutedStyle}>{post.date}</span>
                          </div>
                          <EditableText tag="h3" text={post.title} className="text-lg font-bold mb-3 leading-snug" style={headingStyle} />
                          <EditableText text={post.excerpt} className="text-sm leading-relaxed" style={mutedStyle} />
                          <p className="mt-4 text-sm font-semibold" style={{ color: customStyles.accentColor }}>Read More →</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "faq":
            return (
              <section key="faq" ref={setRef("faq")} className="px-6 relative overflow-hidden" style={sectionStyle}>
                {content.bgSection7 && (
                  <>
                    <img src={content.bgSection7} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className="mx-auto relative z-10" style={{ maxWidth: "800px" }}>
                  <motion.div {...motionProps}>
                    <EditableText tag="h2" text="Frequently Asked Questions" className="text-3xl md:text-5xl font-bold text-center mb-14" style={headingStyle} />
                  </motion.div>
                  <div className="space-y-3">
                    {content.faq.map((item, i) => (
                      <motion.div key={i} {...staggerProps(i)} className="overflow-hidden" style={{ borderRadius: radius, boxShadow: cardShadow, background: cardBg, border: `1px solid ${cardBorder}` }}>
                        <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="w-full flex items-center justify-between p-5 sm:p-6 text-left gap-4">
                          <span className="font-semibold text-sm sm:text-base" style={{ color: effectiveText }}>{item.question}</span>
                          {openFaq === i ? <ChevronUp className="w-5 h-5 shrink-0" style={mutedStyle} /> : <ChevronDown className="w-5 h-5 shrink-0" style={mutedStyle} />}
                        </button>
                        <AnimatePresence>
                          {openFaq === i && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                                <p className="leading-relaxed text-sm" style={mutedStyle}>{item.answer}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "partners":
            return (
              <section key="partners" ref={setRef("partners")} className="px-6 relative overflow-hidden" style={sectionStyle}>
                {content.bgSection8 && (
                  <>
                    <img src={content.bgSection8} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
                  </>
                )}
                <div className="mx-auto text-center relative z-10" style={{ maxWidth: containerMaxW }}>
                  <motion.div {...motionProps}>
                    <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-8" style={mutedStyle}>Trusted by industry leaders</p>
                  </motion.div>
                  <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
                    {content.partners.map((partner, i) => (
                      <motion.span key={i} {...staggerProps(i)}
                        className="text-xl md:text-2xl font-bold opacity-20 hover:opacity-50 transition-opacity cursor-default"
                        style={{ fontFamily: customStyles.fontDisplay, color: customStyles.textColor }}>
                        {partner}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "shop":
            return content.products ? (() => {
              const badges = ["All", ...Array.from(new Set(content.products!.map(p => p.badge).filter(Boolean)))];
              const filtered = content.products!.filter(p => shopFilter === "All" || p.badge === shopFilter);
              const sorted = [...filtered].sort((a, b) => {
                if (shopSort === "price-asc") return parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, ''));
                if (shopSort === "price-desc") return parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, ''));
                return 0;
              });
              const featured = content.featuredProducts?.map(i => content.products![i]).filter(Boolean) || content.products!.slice(0, 4);
              return (
              <section key="shop" ref={setRef("shop")} className="px-6" style={sectionStyle}>
                <div className="mx-auto" style={{ maxWidth: containerMaxW }}>

                  {/* ── Featured Products Row ── */}
                  <motion.div {...motionProps} className="mb-14">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <EditableText tag="h2" text="Featured Products" className="text-2xl md:text-4xl font-bold mb-1" style={headingStyle} />
                        <EditableText text="Handpicked bestsellers our customers love" className="text-sm" style={mutedStyle} />
                      </div>
                      <button onClick={() => scrollTo("shop")} className="text-sm font-semibold hidden md:block" style={{ color: customStyles.accentColor }}>View All →</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {featured.map((product, i) => (
                        <ProductCardWithRetry
                          key={`feat-${product.name}`}
                          product={product}
                          topic={content.topic}
                          accentColor={customStyles.accentColor}
                          headingStyle={headingStyle}
                          cardBg={cardBg}
                          cardBorder={cardBorder}
                          cardShadow={cardShadow}
                          radius={radius}
                          editMode={editMode}
                          isInWishlist={isInWishlist}
                          toggleWishlist={toggleWishlist}
                          addToCart={addToCart}
                          openLightbox={openLightbox}
                          staggerProps={staggerProps(i)}
                          onProductImageChange={(src) => { const pi = content.products!.indexOf(product); if (pi >= 0) updateContentImage(`product-${pi}`, src); }}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* ── New Arrivals Carousel ── */}
                  <motion.div {...motionProps} className="mb-14">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase mb-3" style={{ background: `${customStyles.accentColor}12`, color: customStyles.accentColor, border: `1px solid ${customStyles.accentColor}20` }}>✦ Just Dropped</div>
                        <EditableText tag="h2" text="New Arrivals" className="text-2xl md:text-4xl font-bold" style={headingStyle} />
                      </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-2 px-2" style={{ scrollbarWidth: "thin", scrollbarColor: `${customStyles.accentColor} ${customStyles.accentColor}20` }}>
                      {content.products!.slice(0, 8).map((product, i) => (
                        <NewArrivalsCard
                          key={`new-${product.name}`}
                          product={product}
                          topic={content.topic}
                          accentColor={customStyles.accentColor}
                          headingStyle={headingStyle}
                          cardBg={cardBg}
                          cardBorder={cardBorder}
                          cardShadow={cardShadow}
                          radius={radius}
                          editMode={editMode}
                          isInWishlist={isInWishlist}
                          toggleWishlist={toggleWishlist}
                          addToCart={addToCart}
                          openLightbox={openLightbox}
                          index={i}
                          onProductImageChange={(src) => { const pi = content.products!.indexOf(product); if (pi >= 0) updateContentImage(`product-${pi}`, src); }}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* ── Trending Now Grid ── */}
                  <motion.div {...motionProps} className="mb-14">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase mb-3" style={{ background: `linear-gradient(135deg, #ef4444, #f97316)`, color: "#fff" }}>🔥 Hot</div>
                        <EditableText tag="h2" text="Trending Now" className="text-2xl md:text-4xl font-bold" style={headingStyle} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {content.products!.slice(4, 10).map((product, i) => (
                        <ProductCardWithRetry
                          key={`trend-${product.name}`}
                          product={product}
                          topic={content.topic}
                          accentColor={customStyles.accentColor}
                          headingStyle={headingStyle}
                          cardBg={cardBg}
                          cardBorder={cardBorder}
                          cardShadow={cardShadow}
                          radius={radius}
                          editMode={editMode}
                          isInWishlist={isInWishlist}
                          toggleWishlist={toggleWishlist}
                          addToCart={addToCart}
                          openLightbox={openLightbox}
                          variant="overlay"
                          staggerProps={staggerProps(i)}
                          onProductImageChange={(src) => { const pi = content.products!.indexOf(product); if (pi >= 0) updateContentImage(`product-${pi}`, src); }}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* ── Promotional Banner ── */}
                  {content.promoBanner && (
                    <motion.div {...motionProps} className="mb-14 relative overflow-hidden" style={{ borderRadius: radius }}>
                      <EditableImage src={content.promoBanner} alt={`${content.topic} sale`} className="w-full h-48 md:h-64" onSrcChange={(src) => updateContentImage("promoBanner", src)} />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
                        <div className="px-8 md:px-12">
                          <p className="text-xs tracking-[0.2em] uppercase font-semibold mb-2" style={{ color: customStyles.accentColor }}>Limited Time</p>
                          <EditableText tag="h3" text={`${content.topic} Season Sale`} className="text-2xl md:text-4xl font-bold mb-2 text-white" style={{ fontFamily: customStyles.fontDisplay }} />
                          <p className="text-white/70 text-sm mb-4 max-w-md">Up to 40% off on selected items. Use code SAVE40 at checkout.</p>
                          <motion.button whileHover={{ scale: 1.05 }}
                            className={`px-6 py-2.5 text-sm font-semibold ${btnClass}`} style={btnStyle()}>
                            Shop the Sale
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Category Images Row ── */}
                  {content.categoryImages && content.categoryImages.length >= 2 && (
                    <motion.div {...motionProps} className="mb-14 grid grid-cols-2 gap-4">
                      <div className="relative overflow-hidden group cursor-pointer" style={{ borderRadius: radius }}>
                        <EditableImage src={content.categoryImages[0]} alt={`${content.topic} lifestyle`} className="w-full h-48 md:h-64 group-hover:scale-105 transition-transform duration-500" onClick={openLightbox} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                          <div>
                            <p className="text-white font-bold text-lg" style={{ fontFamily: customStyles.fontDisplay }}>New Arrivals</p>
                            <p className="text-white/70 text-sm">Explore the latest collection →</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative overflow-hidden group cursor-pointer" style={{ borderRadius: radius }}>
                        <EditableImage src={content.categoryImages[1]} alt={`${content.topic} detail`} className="w-full h-48 md:h-64 group-hover:scale-105 transition-transform duration-500" onClick={openLightbox} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                          <div>
                            <p className="text-white font-bold text-lg" style={{ fontFamily: customStyles.fontDisplay }}>Best Sellers</p>
                            <p className="text-white/70 text-sm">Shop customer favorites →</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Full Product Grid ── */}
                  <motion.div {...motionProps} className="text-center mb-10">
                    <EditableText tag="h2" text="Shop All Products" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
                    <EditableText text={`Browse our complete ${content.topic.toLowerCase()} collection`} className="max-w-lg mx-auto" style={mutedStyle} />
                  </motion.div>

                  {/* Filter & Sort Bar */}
                  <motion.div {...motionProps} className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <Filter className="w-4 h-4 mr-1" style={mutedStyle} />
                      {badges.map(badge => (
                        <button key={badge} onClick={() => setShopFilter(badge)}
                          className="px-4 py-1.5 text-xs font-semibold rounded-full transition-all"
                          style={{
                            background: shopFilter === badge ? customStyles.accentColor : `${effectiveText}08`,
                            color: shopFilter === badge ? "#fff" : effectiveText,
                            border: `1px solid ${shopFilter === badge ? customStyles.accentColor : cardBorder}`,
                          }}>
                          {badge}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" style={mutedStyle} />
                      <select value={shopSort} onChange={e => setShopSort(e.target.value as any)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg appearance-none cursor-pointer outline-none"
                        style={{ background: `${effectiveText}08`, color: effectiveText, border: `1px solid ${cardBorder}` }}>
                        <option value="default">Default</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                      </select>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                    {sorted.map((product, i) => (
                      <ProductCardWithRetry
                        key={product.name}
                        product={product}
                        topic={content.topic}
                        accentColor={customStyles.accentColor}
                        headingStyle={headingStyle}
                        cardBg={cardBg}
                        cardBorder={cardBorder}
                        cardShadow={cardShadow}
                        radius={radius}
                        editMode={editMode}
                        isInWishlist={isInWishlist}
                        toggleWishlist={toggleWishlist}
                        addToCart={addToCart}
                        openLightbox={openLightbox}
                        staggerProps={{ ...staggerProps(i), layout: true }}
                        onProductImageChange={(src) => { const pi = content.products!.indexOf(product); if (pi >= 0) updateContentImage(`product-${pi}`, src); }}
                      />
                    ))}

                  </div>

                  {sorted.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-lg font-semibold" style={mutedStyle}>No products match your filter</p>
                      <button onClick={() => setShopFilter("All")} className="mt-3 text-sm underline" style={{ color: customStyles.accentColor }}>Clear filter</button>
                    </div>
                  )}

                  {/* ── Trust Badges ── */}
                  <motion.div {...motionProps} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: "🚚", title: "Free Shipping", desc: "On orders over $50" },
                      { icon: "↩️", title: "Easy Returns", desc: "30-day guarantee" },
                      { icon: "🔒", title: "Secure Payment", desc: "SSL encrypted" },
                      { icon: "💬", title: "24/7 Support", desc: "Always here to help" },
                    ].map((badge, i) => (
                      <div key={i} className="flex items-center gap-3 p-4" style={{ borderRadius: radius, background: `${effectiveText}04`, border: `1px solid ${cardBorder}` }}>
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: effectiveText }}>{badge.title}</p>
                          <p className="text-[10px]" style={mutedStyle}>{badge.desc}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </section>
              );
            })() : null;

          case "menu":
            return content.menuItems ? (
              <section key="menu" ref={setRef("menu")} className="px-6" style={sectionStyle}>
                <div className="mx-auto" style={{ maxWidth: "800px" }}>
                  <motion.div {...motionProps} className="text-center mb-14">
                    <EditableText tag="h2" text="Our Menu" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
                    <EditableText text="Carefully crafted dishes and drinks for every palate" className="max-w-lg mx-auto" style={mutedStyle} />
                  </motion.div>
                  {Object.entries(content.menuItems.reduce((acc, item) => {
                    (acc[item.category] = acc[item.category] || []).push(item);
                    return acc;
                  }, {} as Record<string, typeof content.menuItems>)).map(([category, items], ci) => (
                    <motion.div key={category} {...staggerProps(ci)} className="mb-10 last:mb-0">
                      <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-5 pb-2 border-b" style={{ color: customStyles.accentColor, borderColor: cardBorder }}>{category}</h3>
                      <div className="space-y-4">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-base" style={{ color: effectiveText }}>{item.name}</p>
                              <p className="text-sm" style={mutedStyle}>{item.description}</p>
                            </div>
                            <span className="text-base font-bold shrink-0" style={{ color: customStyles.accentColor }}>{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ) : null;

          default:
            return null;
        }
      })}

      {/* ══════════ NEWSLETTER ══════════ */}
      <section className="px-6 relative overflow-hidden" style={pyStyle}>
        {content.bgSection1 && (
          <>
            <img src={content.bgSection1} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
          </>
        )}
        <div className="mx-auto text-center relative z-10" style={{ maxWidth: "640px" }}>
          <motion.div {...motionProps}>
            <EditableText tag="h2" text={content.newsletter.title} className="text-3xl md:text-4xl font-bold mb-4" style={headingStyle} />
            <EditableText text={content.newsletter.description} className="mb-8" style={mutedStyle} />
          </motion.div>
          <motion.form {...motionProps} onSubmit={e => { e.preventDefault(); alert("Subscribed! Thank you."); }}
            className="flex flex-col sm:flex-row gap-3">
            <input type="email" placeholder="Enter your email" required
              className="flex-1 px-5 py-4 outline-none transition-colors"
              style={{ borderRadius: radius, color: effectiveText, background: inputBg, border: `1px solid ${inputBorder}` }} />
            <motion.button type="submit" whileHover={{ scale: 1.03 }}
              className={`px-8 py-4 font-semibold transition-all shrink-0 ${btnClass}`} style={btnStyle()}>
              Subscribe
            </motion.button>
          </motion.form>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="px-6 relative overflow-hidden" style={{ ...pyStyle, background: customStyles.accentColor }}>
        {content.bgSection2 ? (
          <>
            <img src={content.bgSection2} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0" style={{ background: bgOverlay(customStyles.accentColor, 0.8) }} />
          </>
        ) : (
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        )}
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div {...motionProps}>
            <EditableText tag="h2" text={content.ctaTitle} className="text-3xl md:text-5xl font-bold mb-6" style={{ fontFamily: customStyles.fontDisplay, color: "#fff" }} />
          </motion.div>
          <motion.div {...motionProps}>
            <EditableText text={content.ctaText} className="mb-10 text-lg leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }} />
          </motion.div>
          <motion.button {...motionProps} whileHover={{ scale: 1.05, y: -2 }}
            onClick={() => scrollTo("contact")}
            className={`px-10 py-4 font-bold text-lg shadow-xl hover:shadow-2xl transition-all ${btnClass}`}
            style={{ borderRadius: radius, background: "#fff", color: customStyles.accentColor, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
            Get Started Today
          </motion.button>
        </div>
      </section>

      {/* ══════════ CONTACT ══════════ */}
      <section ref={setRef("contact")} className="px-6 relative overflow-hidden" style={pyStyle}>
        {content.bgSection3 && (
          <>
            <img src={content.bgSection3} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0" style={{ background: bgOverlay(effectiveBg) }} />
          </>
        )}
        <div className="mx-auto relative z-10" style={{ maxWidth: "640px" }}>
          <motion.div {...motionProps} className="text-center">
            <EditableText tag="h2" text="Get In Touch" className="text-3xl md:text-5xl font-bold mb-4" style={headingStyle} />
            <EditableText text="We'd love to hear from you. Send us a message and we'll respond promptly." className="mb-12" style={mutedStyle} />
          </motion.div>
          <motion.form {...motionProps}
            onSubmit={e => { e.preventDefault(); alert("Thank you! We'll get back to you soon."); }}
            className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="First Name" required className="px-5 py-4 outline-none transition-all" style={{ borderRadius: radius, color: effectiveText, background: inputBg, border: `1px solid ${inputBorder}` }} />
              <input type="text" placeholder="Last Name" required className="px-5 py-4 outline-none transition-all" style={{ borderRadius: radius, color: effectiveText, background: inputBg, border: `1px solid ${inputBorder}` }} />
            </div>
            <input type="email" placeholder="Your Email" required className="px-5 py-4 outline-none transition-all" style={{ borderRadius: radius, color: effectiveText, background: inputBg, border: `1px solid ${inputBorder}` }} />
            <input type="text" placeholder="Subject" className="px-5 py-4 outline-none transition-all" style={{ borderRadius: radius, color: effectiveText, background: inputBg, border: `1px solid ${inputBorder}` }} />
            <textarea placeholder="Your Message" rows={5} required className="px-5 py-4 outline-none transition-all resize-none" style={{ borderRadius: radius, color: effectiveText, background: inputBg, border: `1px solid ${inputBorder}` }} />
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`px-8 py-4 font-semibold text-base transition-all ${btnClass}`} style={{ ...btnStyle(), boxShadow: cardShadow }}>
              Send Message
            </motion.button>
          </motion.form>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="py-12 px-6" style={{ background: content.colorScheme.dark }}>
        <div className="mx-auto" style={{ maxWidth: containerMaxW }}>
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <span className="text-xl font-bold block mb-3" style={{ fontFamily: customStyles.fontDisplay, color: "#f5f0eb" }}>{content.siteName}</span>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(245,240,235,0.4)" }}>
                Your trusted partner for exceptional {content.topic.toLowerCase()} experiences. Quality, innovation, and dedication.
              </p>
            </div>
            <div>
              <p className="text-xs tracking-widest uppercase font-semibold mb-4" style={{ color: "rgba(245,240,235,0.5)" }}>Quick Links</p>
              <div className="flex flex-col gap-2">
                {content.navLinks.slice(0, 5).map(link => (
                  <button key={link} onClick={() => scrollTo(link.toLowerCase())}
                    className="text-sm text-left hover:opacity-100 transition-opacity" style={{ color: "rgba(245,240,235,0.4)" }}>
                    {link}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs tracking-widest uppercase font-semibold mb-4" style={{ color: "rgba(245,240,235,0.5)" }}>Contact</p>
              <div className="space-y-2 text-sm" style={{ color: "rgba(245,240,235,0.4)" }}>
                <p>hello@{content.topic.toLowerCase().replace(/\s/g, '')}.com</p>
                <p>+1 (555) 123-4567</p>
                <p>123 Innovation Street</p>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 text-center" style={{ borderColor: "rgba(245,240,235,0.08)" }}>
            <p className="text-sm" style={{ color: "rgba(245,240,235,0.3)" }}>© 2026 {content.siteName}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── Scroll to Top Button ── */}

    </div>
    {/* ══ All overlays rendered OUTSIDE overflowX:clip div to prevent clipping ══ */}

      {/* ── Scroll to Top Button ── */}
      <ScrollToTopButton accentColor={customStyles.accentColor} />

      {/* ── Tools Panel (Customize) ── */}
      <ToolsPanel isOpen={showTools} onClose={() => setShowTools(false)} content={content} customStyles={customStyles} setCustomStyles={setCustomStyles} defaultStyles={defaultStyles} onUpdateContent={setContent} onViewCode={() => setShowCode(true)} />

      {/* ── Code Viewer (Full-screen) ── */}
      <CodeViewer isOpen={showCode} onClose={() => setShowCode(false)} content={content} customStyles={customStyles} />

      {/* ── Image Lightbox / Quick View Modal ── */}
      {createPortal(
      <AnimatePresence>
        {lightboxImage && (
          <>
            <motion.div key="lightbox-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md" />
            <motion.div
              key="lightbox-content"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.35, ease }}
              className="fixed inset-4 sm:inset-8 z-[201] flex flex-col items-center justify-center"
              onClick={() => setLightboxImage(null)}>
              <div className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ borderRadius: radius, background: cardBg, scrollbarWidth: "thin", scrollbarColor: `${customStyles.accentColor}40 transparent` }}>
                {content.businessType === "ecommerce" ? (
                  /* ── E-commerce Quick View ── */
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-3/5 relative">
                      <img src={lightboxImage.src} alt={lightboxImage.alt}
                        className="w-full h-72 md:h-full min-h-[400px] object-cover" style={{ borderRadius: `${radius}px 0 0 ${radius}px` }} />
                      {lightboxImage.badge && (
                        <span className="absolute top-4 left-4 px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase text-white rounded-full backdrop-blur-sm" style={{ background: `${customStyles.accentColor}dd` }}>{lightboxImage.badge}</span>
                      )}
                      <span className="absolute bottom-4 left-4 px-3 py-1 text-[9px] font-bold tracking-wider uppercase text-white/80 rounded-full backdrop-blur-md bg-black/40">Quick View</span>
                    </div>
                    <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold tracking-[0.15em] uppercase mb-2" style={{ color: customStyles.accentColor }}>{content.siteName}</p>
                        <h3 className="text-xl font-bold mb-1" style={headingStyle}>{lightboxImage.alt}</h3>
                        {aiDetails?.tagline && (
                          <p className="text-xs italic mb-2" style={{ color: customStyles.accentColor }}>{aiDetails.tagline}</p>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5" style={{ fill: customStyles.accentColor, color: customStyles.accentColor }} />)}
                          </div>
                          <span className="text-xs" style={mutedStyle}>(128 reviews)</span>
                        </div>
                        <p className="text-2xl font-bold mb-3" style={{ fontFamily: customStyles.fontDisplay, color: customStyles.accentColor }}>{lightboxImage.price || "$49.99"}</p>

                        {/* AI-powered description */}
                        {aiLoading ? (
                          <div className="mb-4 space-y-2">
                            <div className="h-3 rounded-full animate-pulse" style={{ background: `${effectiveText}15`, width: "100%" }} />
                            <div className="h-3 rounded-full animate-pulse" style={{ background: `${effectiveText}10`, width: "85%" }} />
                            <div className="h-3 rounded-full animate-pulse" style={{ background: `${effectiveText}08`, width: "70%" }} />
                          </div>
                        ) : aiDetails ? (
                          <div className="mb-4 space-y-3">
                            <p className="text-sm leading-relaxed" style={mutedStyle}>{aiDetails.description}</p>
                            {aiDetails.features?.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-1.5" style={{ color: effectiveText }}>Highlights</p>
                                <ul className="space-y-1">
                                  {aiDetails.features.map((f, fi) => (
                                    <li key={fi} className="text-xs flex items-start gap-1.5" style={mutedStyle}>
                                      <span style={{ color: customStyles.accentColor }}>✦</span> {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed mb-4" style={mutedStyle}>{lightboxImage.description || `Premium ${content.topic.toLowerCase()} item with exceptional quality and craftsmanship.`}</p>
                        )}

                        {/* Context-aware product options */}
                        {(() => {
                          const t = content.topic.toLowerCase();
                          const isClothing = ["saree","sari","lehenga","kurta","kurti","salwar","anarkali","sherwani","ethnic","dress","shirt","pant","jeans","jacket","hoodie","t-shirt","tshirt","cloth","apparel","fashion","wear","outfit","garment","sweater","blouse","skirt","coat","blazer","sharara","ghagra","churidar","palazzo","dupatta","indo western"].some(k => t.includes(k));
                          const isShoe = ["shoe","sneaker","footwear","boot","sandal","heel","slipper"].some(k => t.includes(k));
                          const isElectronics = ["phone","mobile","laptop","computer","electronic","gadget","smartphone","tablet","camera"].some(k => t.includes(k));
                          const isBook = ["book","novel"].some(k => t.includes(k));
                          const isWine = ["wine","vineyard","whisky","whiskey","beer","spirits","liquor"].some(k => t.includes(k));
                          const isJewelry = ["jewelry","jewel","ring","necklace","bracelet","earring"].some(k => t.includes(k));
                          const isPerfume = ["perfume","cologne","fragrance","scent"].some(k => t.includes(k));
                          const isWatch = ["watch","timepiece"].some(k => t.includes(k));
                          const isFurniture = ["furniture","home decor","decor","lamp","chair","table","sofa"].some(k => t.includes(k));
                          const isTea = ["tea","coffee","cafe"].some(k => t.includes(k));
                          const isBeauty = ["lipstick","cosmetic","makeup","beauty","skincare"].some(k => t.includes(k));

                          const optBtn = (label: string, isActive: boolean, onClk: () => void) => (
                            <button key={label} onClick={onClk}
                              className="px-3 py-1.5 text-xs font-semibold transition-all"
                              style={{
                                borderRadius: radius,
                                background: isActive ? customStyles.accentColor : "transparent",
                                color: isActive ? "#fff" : effectiveText,
                                border: `1.5px solid ${isActive ? customStyles.accentColor : effectiveText + "20"}`
                              }}>{label}</button>
                          );

                          return (
                            <>
                              {(isClothing || isShoe) && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>{isShoe ? "Shoe Size" : "Size"}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {(isShoe ? ["6","7","8","9","10","11","12"] : ["XS","S","M","L","XL","XXL"]).map(s => optBtn(s, selectedSize === s, () => setSelectedSize(s)))}
                                  </div>
                                </div>
                              )}
                              {(isClothing || isShoe || isJewelry || isWatch || isFurniture || isBeauty) && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>{isJewelry ? "Metal" : isBeauty ? "Shade" : "Color"}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {(isJewelry
                                      ? [{name:"Gold",hex:"#d4a843"},{name:"Rose Gold",hex:"#b76e79"},{name:"Silver",hex:"#c0c0c0"},{name:"Platinum",hex:"#e5e4e2"}]
                                      : isBeauty
                                      ? [{name:"Nude",hex:"#c8a88e"},{name:"Rose",hex:"#d4728c"},{name:"Berry",hex:"#8b2252"},{name:"Red",hex:"#cc2936"},{name:"Coral",hex:"#e76f51"}]
                                      : [{name:"Midnight Black",hex:"#1a1a2e"},{name:"Ivory White",hex:"#f5f0eb"},{name:"Royal Blue",hex:"#2563eb"},{name:"Crimson Red",hex:"#dc2626"},{name:"Forest Green",hex:"#16a34a"}]
                                    ).map(c => (
                                      <button key={c.name} onClick={() => setSelectedColor(c.name)} title={c.name}
                                        className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                                        style={{
                                          background: c.hex,
                                          borderColor: selectedColor === c.name ? customStyles.accentColor : "transparent",
                                          boxShadow: selectedColor === c.name ? `0 0 0 2px ${cardBg}, 0 0 0 4px ${customStyles.accentColor}` : "none"
                                        }} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {isElectronics && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>Storage</p>
                                  <div className="flex flex-wrap gap-2">{["64GB","128GB","256GB","512GB","1TB"].map(s => optBtn(s, selectedSize === s, () => setSelectedSize(s)))}</div>
                                </div>
                              )}
                              {isBook && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>Format</p>
                                  <div className="flex flex-wrap gap-2">{["Hardcover","Paperback","E-Book","Audiobook"].map(s => optBtn(s, selectedSize === s, () => setSelectedSize(s)))}</div>
                                </div>
                              )}
                              {isWine && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>Bottle Size</p>
                                  <div className="flex flex-wrap gap-2">{["375ml","750ml","1.5L Magnum"].map(s => optBtn(s, selectedSize === s, () => setSelectedSize(s)))}</div>
                                </div>
                              )}
                              {isPerfume && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>Volume</p>
                                  <div className="flex flex-wrap gap-2">{["30ml","50ml","100ml","200ml"].map(s => optBtn(s, selectedSize === s, () => setSelectedSize(s)))}</div>
                                </div>
                              )}
                              {isWatch && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>Strap</p>
                                  <div className="flex flex-wrap gap-2">{["Leather","Steel","NATO","Rubber","Mesh"].map(s => optBtn(s, selectedSize === s, () => setSelectedSize(s)))}</div>
                                </div>
                              )}
                              {isTea && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>Weight</p>
                                  <div className="flex flex-wrap gap-2">{["50g","100g","250g","500g"].map(s => optBtn(s, selectedSize === s, () => setSelectedSize(s)))}</div>
                                </div>
                              )}
                              {isFurniture && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>Finish</p>
                                  <div className="flex flex-wrap gap-2">{["Natural Oak","Walnut","Matte Black","White Wash"].map(s => optBtn(s, selectedSize === s, () => setSelectedSize(s)))}</div>
                                </div>
                              )}
                              {!isClothing && !isShoe && !isElectronics && !isBook && !isWine && !isPerfume && !isWatch && !isTea && !isFurniture && !isJewelry && !isBeauty && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>Variant</p>
                                  <div className="flex flex-wrap gap-2">{["Standard","Premium","Deluxe"].map(s => optBtn(s, selectedSize === s, () => setSelectedSize(s)))}</div>
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {/* Quantity */}
                        <div className="mb-4">
                          <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: effectiveText }}>Quantity</p>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setProductQty(Math.max(1, productQty - 1))}
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                              style={{ background: `${effectiveText}08`, color: effectiveText }}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-lg font-bold w-8 text-center" style={{ color: effectiveText }}>{productQty}</span>
                            <button onClick={() => setProductQty(productQty + 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                              style={{ background: customStyles.accentColor, color: "#fff" }}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            for (let i = 0; i < productQty; i++) addToCart({ name: lightboxImage.alt, price: lightboxImage.price || "$49.99", image: lightboxImage.src });
                            const details = [selectedSize, selectedColor].filter(Boolean).join(", ");
                            toast.success(`${productQty}× ${lightboxImage.alt}${details ? ` (${details})` : ""} added!`);
                            setLightboxImage(null); setProductQty(1); setSelectedSize("M"); setSelectedColor("");
                          }}
                          className={`flex-1 py-3 font-semibold text-sm flex items-center justify-center gap-2 ${btnClass}`} style={btnStyle()}>
                          <ShoppingCart className="w-4 h-4" /> Add to Cart — {lightboxImage.price || "$49.99"}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => toggleWishlist({ name: lightboxImage.alt, price: lightboxImage.price || "$49.99", image: lightboxImage.src, description: lightboxImage.description || "Featured item" })}
                          className="px-4 py-3 font-semibold text-sm border-2 transition-all"
                          style={{ borderColor: isInWishlist(lightboxImage.alt) ? customStyles.accentColor : `${customStyles.accentColor}30`, color: customStyles.accentColor, background: isInWishlist(lightboxImage.alt) ? `${customStyles.accentColor}15` : "transparent", borderRadius: radius }}>
                          <Heart className="w-4 h-4" style={{ fill: isInWishlist(lightboxImage.alt) ? customStyles.accentColor : "none" }} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Standard Lightbox ── */
                  <>
                    <img src={lightboxImage.src} alt={lightboxImage.alt}
                      className="w-full max-h-[70vh] object-contain rounded-t-2xl" style={{ background: "#111" }} />
                    <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      style={{ borderTop: `1px solid ${cardBorder}` }}>
                      <div>
                        <p className="font-bold text-lg mb-1" style={{ ...headingStyle }}>{lightboxImage.alt}</p>
                        <p className="text-sm" style={mutedStyle}>High-quality image</p>
                      </div>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = lightboxImage.src;
                          link.download = lightboxImage.alt || "image";
                          link.target = "_blank";
                          link.click();
                        }}
                        className="px-4 py-2.5 font-semibold text-sm border-2 transition-all"
                        style={{ borderColor: `${effectiveText}20`, color: effectiveText, borderRadius: radius }}>
                        ↓ Download
                      </motion.button>
                    </div>
                  </>
                )}
                <button onClick={() => setLightboxImage(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors text-lg font-medium z-10">
                  ✕
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>, document.body)}



      {/* ── Cart Sidebar ── */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 z-[65] bg-black/30 backdrop-blur-sm" />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="fixed right-0 top-0 h-full w-full sm:w-[400px] z-[66] flex flex-col overflow-hidden"
              style={{ background: cardBg, borderLeft: `1px solid ${cardBorder}`, boxShadow: "0 0 60px rgba(0,0,0,0.2)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: cardBorder }}>
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5" style={{ color: customStyles.accentColor }} />
                  <h3 className="font-bold text-lg" style={{ ...headingStyle }}>Your Cart</h3>
                  {cartCount > 0 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white" style={{ background: customStyles.accentColor }}>{cartCount}</span>
                  )}
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 rounded-lg hover:opacity-70 transition-opacity" style={{ color: effectiveText }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <ShoppingCart className="w-16 h-16 mb-4 opacity-10" style={{ color: effectiveText }} />
                    <p className="font-semibold mb-1" style={{ color: effectiveText }}>Your cart is empty</p>
                    <p className="text-sm" style={mutedStyle}>Add items from the shop to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <motion.div key={item.name} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 p-3 rounded-xl" style={{ background: `${effectiveText}05`, border: `1px solid ${cardBorder}` }}>
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: effectiveText }}>{item.name}</p>
                          <p className="text-sm font-bold mt-0.5" style={{ color: customStyles.accentColor }}>{item.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateQuantity(item.name, -1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                              style={{ background: `${effectiveText}10`, color: effectiveText }}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-6 text-center" style={{ color: effectiveText }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.name, 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                              style={{ background: `${effectiveText}10`, color: effectiveText }}>
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeFromCart(item.name)}
                              className="ml-auto p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                              style={{ color: "#ef4444" }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="px-6 py-5 border-t" style={{ borderColor: cardBorder }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm" style={mutedStyle}>Subtotal</span>
                    <span className="text-sm font-semibold" style={{ color: effectiveText }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={mutedStyle}>Shipping</span>
                    <span className="text-sm font-semibold" style={{ color: customStyles.accentColor }}>Free</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t" style={{ borderColor: cardBorder }}>
                    <span className="font-bold" style={{ color: effectiveText }}>Total</span>
                    <span className="text-xl font-bold" style={{ color: customStyles.accentColor }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { alert("Order placed! Thank you for shopping."); setCart([]); setShowCart(false); }}
                    className={`w-full mt-4 py-3.5 font-semibold text-sm ${btnClass}`} style={btnStyle()}>
                    Checkout — ${cartTotal.toFixed(2)}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Wishlist Panel ── */}
      <AnimatePresence>
        {showWishlist && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWishlist(false)}
              className="fixed inset-0 z-[65] bg-black/30 backdrop-blur-sm" />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="fixed right-0 top-0 h-full w-full sm:w-[400px] z-[66] flex flex-col overflow-hidden"
              style={{ background: cardBg, borderLeft: `1px solid ${cardBorder}`, boxShadow: "0 0 60px rgba(0,0,0,0.2)" }}>
              <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: cardBorder }}>
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5" style={{ color: customStyles.accentColor, fill: customStyles.accentColor }} />
                  <h3 className="font-bold text-lg" style={{ ...headingStyle }}>Wishlist</h3>
                  {wishlist.length > 0 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white" style={{ background: customStyles.accentColor }}>{wishlist.length}</span>
                  )}
                </div>
                <button onClick={() => setShowWishlist(false)} className="p-2 rounded-lg hover:opacity-70 transition-opacity" style={{ color: effectiveText }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <Heart className="w-16 h-16 mb-4 opacity-10" style={{ color: effectiveText }} />
                    <p className="font-semibold mb-1" style={{ color: effectiveText }}>Your wishlist is empty</p>
                    <p className="text-sm" style={mutedStyle}>Click the heart on products to save them</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wishlist.map((item) => (
                      <motion.div key={item.name} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 p-3 rounded-xl" style={{ background: `${effectiveText}05`, border: `1px solid ${cardBorder}` }}>
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: effectiveText }}>{item.name}</p>
                          <p className="text-xs mt-0.5 truncate" style={mutedStyle}>{item.description}</p>
                          <p className="text-sm font-bold mt-1" style={{ color: customStyles.accentColor }}>{item.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <motion.button whileHover={{ scale: 1.05 }}
                              onClick={() => { addToCart({ name: item.name, price: item.price, image: item.image }); }}
                              className={`px-3 py-1.5 text-[10px] font-semibold ${btnClass}`} style={btnStyle()}>
                              Add to Cart
                            </motion.button>
                            <button onClick={() => toggleWishlist(item)}
                              className="ml-auto p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                              style={{ color: "#ef4444" }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </EditModeContext.Provider>
  );
};

export default GeneratedWebsite;
