import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Type, Paintbrush, Baseline, Palette, RectangleHorizontal, Layout,
  SlidersHorizontal, RotateCcw, Maximize2, LetterText, Layers, Sparkles,
  ImageIcon, Heading, AlignVerticalSpaceAround, StretchVertical,
  PanelTop, Columns3, SquareStack, Upload, Plus, Trash2, ShoppingBag, Pencil, Check
} from "lucide-react";
import type { WebsiteContent, CustomStyles } from "@/lib/generateContent";
import { toast } from "sonner";

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  content: WebsiteContent;
  customStyles: CustomStyles;
  setCustomStyles: React.Dispatch<React.SetStateAction<CustomStyles>>;
  defaultStyles: CustomStyles;
  onUpdateContent?: React.Dispatch<React.SetStateAction<WebsiteContent>>;
  onViewCode?: () => void;
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fontOptions = [
  { label: "Cormorant Garamond", display: "'Cormorant Garamond', serif", body: "'DM Sans', sans-serif" },
  { label: "Cinzel + Raleway", display: "'Cinzel', serif", body: "'Raleway', sans-serif" },
  { label: "Playfair Display", display: "'Playfair Display', serif", body: "'DM Sans', sans-serif" },
  { label: "Lora + Poppins", display: "'Lora', serif", body: "'Poppins', sans-serif" },
  { label: "Montserrat Modern", display: "'Montserrat', sans-serif", body: "'DM Sans', sans-serif" },
  { label: "Georgia Classic", display: "'Georgia', serif", body: "'Verdana', sans-serif" },
  { label: "Helvetica Clean", display: "'Helvetica Neue', sans-serif", body: "'Arial', sans-serif" },
];

type TabId = "presets" | "typography" | "colors" | "layout" | "hero" | "cards" | "images" | "products";

const themePresets: { name: string; emoji: string; styles: Partial<CustomStyles> }[] = [
  { name: "Dark Luxe", emoji: "🖤", styles: { bgColor: "#0f0f17", textColor: "#f5f0eb", accentColor: "#c9a96e", fontDisplay: "'Cinzel', serif", fontBody: "'Raleway', sans-serif", borderRadius: 4, shadowStyle: "bold", cardStyle: "bordered", navStyle: "glass", headingWeight: "700" } },
  { name: "Pastel Dream", emoji: "🌸", styles: { bgColor: "#fef6f9", textColor: "#4a3f55", accentColor: "#e091a8", fontDisplay: "'Playfair Display', serif", fontBody: "'DM Sans', sans-serif", borderRadius: 20, shadowStyle: "soft", cardStyle: "elevated", navStyle: "glass", headingWeight: "700" } },
  { name: "Corporate Clean", emoji: "💼", styles: { bgColor: "#ffffff", textColor: "#1e293b", accentColor: "#1d4ed8", fontDisplay: "'Montserrat', sans-serif", fontBody: "'DM Sans', sans-serif", borderRadius: 8, shadowStyle: "soft", cardStyle: "elevated", navStyle: "solid", headingWeight: "700" } },
  { name: "Emerald Forest", emoji: "🌿", styles: { bgColor: "#f0fdf4", textColor: "#1a2e1a", accentColor: "#059669", fontDisplay: "'Lora', serif", fontBody: "'Poppins', sans-serif", borderRadius: 12, shadowStyle: "medium", cardStyle: "glass", navStyle: "glass", headingWeight: "500" } },
  { name: "Sunset Vibes", emoji: "🌅", styles: { bgColor: "#fff7ed", textColor: "#431407", accentColor: "#ea580c", fontDisplay: "'Cormorant Garamond', serif", fontBody: "'DM Sans', sans-serif", borderRadius: 16, shadowStyle: "soft", cardStyle: "elevated", navStyle: "minimal", headingWeight: "700" } },
  { name: "Midnight Blue", emoji: "🌙", styles: { bgColor: "#0f172a", textColor: "#e2e8f0", accentColor: "#3b82f6", fontDisplay: "'Montserrat', sans-serif", fontBody: "'DM Sans', sans-serif", borderRadius: 12, shadowStyle: "bold", cardStyle: "glass", navStyle: "glass", headingWeight: "700" } },
  { name: "Rose Gold", emoji: "✨", styles: { bgColor: "#faf5ff", textColor: "#3b0764", accentColor: "#c084fc", fontDisplay: "'Playfair Display', serif", fontBody: "'Raleway', sans-serif", borderRadius: 50, shadowStyle: "soft", cardStyle: "elevated", navStyle: "glass", headingWeight: "700" } },
  { name: "Brutalist Raw", emoji: "🔲", styles: { bgColor: "#ffffff", textColor: "#000000", accentColor: "#000000", fontDisplay: "'Helvetica Neue', sans-serif", fontBody: "'Arial', sans-serif", borderRadius: 0, shadowStyle: "none", cardStyle: "bordered", navStyle: "solid", headingWeight: "900" } },
];

const baseTabs: { id: TabId; label: string; icon: React.ReactNode; ecommerceOnly?: boolean }[] = [
  { id: "presets", label: "Themes", icon: <Sparkles className="w-4 h-4" /> },
  { id: "products", label: "Products", icon: <ShoppingBag className="w-4 h-4" />, ecommerceOnly: true },
  { id: "typography", label: "Type", icon: <Type className="w-4 h-4" /> },
  { id: "colors", label: "Colors", icon: <Palette className="w-4 h-4" /> },
  { id: "layout", label: "Layout", icon: <Columns3 className="w-4 h-4" /> },
  { id: "hero", label: "Hero", icon: <PanelTop className="w-4 h-4" /> },
  { id: "cards", label: "Cards", icon: <SquareStack className="w-4 h-4" /> },
  { id: "images", label: "Images", icon: <ImageIcon className="w-4 h-4" /> },
];

const Section = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: "#374151" }}>{icon} {label}</div>
    {children}
  </div>
);

const ColorPicker = ({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {colors.map(c => (
      <button key={c} onClick={() => onChange(c)}
        className={`w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 ${value === c ? "border-blue-500 scale-110 shadow-md" : "border-gray-200"}`}
        style={{ background: c }} />
    ))}
    <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded-xl cursor-pointer border-0 p-0" />
  </div>
);

const BtnGroup = ({ options, value, onChange }: { options: [string, any][]; value: any; onChange: (v: any) => void }) => (
  <div className="flex gap-2">
    {options.map(([label, val]) => (
      <button key={label} onClick={() => onChange(val)}
        className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${String(value) === String(val) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
      >{label}</button>
    ))}
  </div>
);

/* ── Image Upload Helper ── */
const ImageUploadSlot = ({ src, label, onUpload, onRemove }: { src?: string; label: string; onUpload: (dataUrl: string) => void; onRemove?: () => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpload(e.target?.result as string);
      toast.success(`${label} image updated!`);
    };
    reader.readAsDataURL(file);
  }, [onUpload, label]);

  return (
    <div className="relative group">
      {src ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={src} alt={label} className="w-full h-20 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button onClick={() => inputRef.current?.click()} className="p-1.5 rounded-full bg-white/90 hover:scale-110 transition-transform">
              <Upload className="w-3 h-3 text-gray-700" />
            </button>
            {onRemove && (
              <button onClick={onRemove} className="p-1.5 rounded-full bg-white/90 hover:scale-110 transition-transform">
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            )}
          </div>
          <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">{label}</span>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          className="w-full h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500">
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
};

const ToolsPanel = ({ isOpen, onClose, content, customStyles, setCustomStyles, defaultStyles, onUpdateContent, onViewCode }: ToolsPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("presets");
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState({ name: "", price: "", description: "", badge: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", badge: "" });
  const onReset = () => setCustomStyles(defaultStyles);

  const isEcommerce = content.businessType === "ecommerce";
  const tabs = baseTabs.filter(t => !t.ecommerceOnly || isEcommerce);

  const startEditProduct = useCallback((index: number) => {
    const p = content.products?.[index];
    if (!p) return;
    setEditingProductIndex(index);
    setEditProduct({ name: p.name, price: p.price, description: p.description, badge: p.badge || "" });
  }, [content.products]);

  const saveEditProduct = useCallback(() => {
    if (editingProductIndex === null || !editProduct.name.trim()) return;
    onUpdateContent?.(prev => {
      if (!prev.products) return prev;
      const updated = [...prev.products];
      updated[editingProductIndex] = { ...updated[editingProductIndex], name: editProduct.name.trim(), price: editProduct.price.trim(), description: editProduct.description.trim(), badge: editProduct.badge.trim() || updated[editingProductIndex].badge };
      return { ...prev, products: updated };
    });
    setEditingProductIndex(null);
    toast.success("Product updated!");
  }, [editingProductIndex, editProduct, onUpdateContent]);

  const handleAddNewProduct = useCallback(() => {
    if (!newProduct.name.trim() || !newProduct.price.trim()) {
      toast.error("Please enter product name and price");
      return;
    }
    onUpdateContent?.(prev => {
      const products = prev.products || [];
      return {
        ...prev,
        products: [...products, {
          name: newProduct.name.trim(),
          price: newProduct.price.startsWith("$") ? newProduct.price.trim() : `$${newProduct.price.trim()}`,
          description: newProduct.description.trim() || `Premium ${prev.topic.toLowerCase()} product`,
          image: `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&auto=format&q=80`,
          badge: newProduct.badge.trim() || "New",
        }],
      };
    });
    setNewProduct({ name: "", price: "", description: "", badge: "" });
    setShowAddForm(false);
    toast.success(`${newProduct.name.trim()} added!`);
  }, [newProduct, onUpdateContent]);

  const updateHeroImage = useCallback((dataUrl: string) => {
    onUpdateContent?.(prev => ({ ...prev, heroImage: dataUrl }));
  }, [onUpdateContent]);

  const updateAboutImage = useCallback((dataUrl: string) => {
    onUpdateContent?.(prev => ({ ...prev, aboutImage: dataUrl }));
  }, [onUpdateContent]);

  const updateGalleryImage = useCallback((index: number, dataUrl: string) => {
    onUpdateContent?.(prev => {
      const newGallery = [...prev.galleryImages];
      newGallery[index] = { ...newGallery[index], src: dataUrl };
      return { ...prev, galleryImages: newGallery };
    });
  }, [onUpdateContent]);

  const addGalleryImage = useCallback((dataUrl: string) => {
    onUpdateContent?.(prev => ({
      ...prev,
      galleryImages: [...prev.galleryImages, { src: dataUrl, caption: `${prev.topic} Custom` }],
    }));
  }, [onUpdateContent]);

  const removeGalleryImage = useCallback((index: number) => {
    onUpdateContent?.(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  }, [onUpdateContent]);

  const updateProductImage = useCallback((index: number, dataUrl: string) => {
    onUpdateContent?.(prev => {
      if (!prev.products) return prev;
      const newProducts = [...prev.products];
      newProducts[index] = { ...newProducts[index], image: dataUrl };
      return { ...prev, products: newProducts };
    });
  }, [onUpdateContent]);

  const addNewProduct = useCallback((dataUrl: string) => {
    onUpdateContent?.(prev => {
      const products = prev.products || [];
      const newProduct = {
        name: `New Product ${products.length + 1}`,
        price: `$${(Math.floor(Math.random() * 150) + 20)}.99`,
        description: `Beautiful ${prev.topic.toLowerCase()} product`,
        image: dataUrl,
        badge: "New",
      };
      return { ...prev, products: [...products, newProduct] };
    });
  }, [onUpdateContent]);

  const removeProduct = useCallback((index: number) => {
    onUpdateContent?.(prev => {
      if (!prev.products || prev.products.length <= 1) return prev;
      return { ...prev, products: prev.products.filter((_, i) => i !== index) };
    });
    toast.success("Product removed");
  }, [onUpdateContent]);

  const updatePromoBanner = useCallback((dataUrl: string) => {
    onUpdateContent?.(prev => ({ ...prev, promoBanner: dataUrl }));
  }, [onUpdateContent]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "presets":
        return (
          <div className="space-y-3">
            {themePresets.map(preset => {
              const isActive = customStyles.accentColor === preset.styles.accentColor && customStyles.bgColor === preset.styles.bgColor;
              return (
                <motion.button key={preset.name} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setCustomStyles(s => ({ ...s, ...preset.styles }))}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 group ${isActive ? "shadow-lg" : "hover:shadow-md"}`}
                  style={{ borderColor: isActive ? preset.styles.accentColor : "#e5e7eb", background: isActive ? `${preset.styles.accentColor}08` : "white" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{preset.emoji}</span>
                    <span className="font-bold text-sm" style={{ color: isActive ? preset.styles.accentColor : "#374151" }}>{preset.name}</span>
                    {isActive && <span className="ml-auto text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full text-white" style={{ background: preset.styles.accentColor }}>Active</span>}
                  </div>
                  <div className="flex gap-1.5">
                    {[preset.styles.bgColor, preset.styles.textColor, preset.styles.accentColor].filter(Boolean).map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-lg border border-gray-200" style={{ background: c }} />
                    ))}
                    <span className="ml-2 text-[10px] font-medium text-gray-400 self-center" style={{ fontFamily: preset.styles.fontDisplay }}>{preset.styles.fontDisplay?.split("'")[1] || "Font"}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        );
      case "typography":
        return (
          <div className="space-y-6">
            <Section icon={<Type className="w-4 h-4" />} label="Font Family">
              <div className="space-y-1.5">
                {fontOptions.map(f => (
                  <button key={f.label} onClick={() => setCustomStyles(s => ({ ...s, fontDisplay: f.display, fontBody: f.body }))}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${customStyles.fontDisplay === f.display ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    style={{ fontFamily: f.display }}
                  >{f.label}</button>
                ))}
              </div>
            </Section>
            <Section icon={<Heading className="w-4 h-4" />} label="Heading Weight">
              <BtnGroup options={[["Light", "300"], ["Normal", "500"], ["Bold", "700"], ["Black", "900"]]}
                value={customStyles.headingWeight} onChange={v => setCustomStyles(s => ({ ...s, headingWeight: v }))} />
            </Section>
            <Section icon={<Type className="w-4 h-4" />} label="Text Size">
              <BtnGroup options={[["XS", 0.8], ["S", 0.9], ["M", 1], ["L", 1.1], ["XL", 1.25]]}
                value={customStyles.textScale} onChange={v => setCustomStyles(s => ({ ...s, textScale: v }))} />
            </Section>
            <Section icon={<AlignVerticalSpaceAround className="w-4 h-4" />} label="Line Height">
              <BtnGroup options={[["Tight", 1.4], ["Normal", 1.7], ["Relaxed", 2.0], ["Loose", 2.3]]}
                value={customStyles.lineHeight} onChange={v => setCustomStyles(s => ({ ...s, lineHeight: v }))} />
            </Section>
            <Section icon={<LetterText className="w-4 h-4" />} label="Letter Spacing">
              <BtnGroup options={[["Tight", -0.5], ["Normal", 0], ["Wide", 1], ["Extra", 2.5]]}
                value={customStyles.letterSpacing} onChange={v => setCustomStyles(s => ({ ...s, letterSpacing: v }))} />
            </Section>
          </div>
        );

      case "colors":
        return (
          <div className="space-y-6">
            <Section icon={<Paintbrush className="w-4 h-4" />} label="Background">
              <ColorPicker colors={["#faf8f5", "#ffffff", "#f8f7ff", "#f0fdf4", "#fff1f2", "#fefce8", "#f0f9ff", "#faf5ff", "#1a1a2e", "#0f172a", "#18181b", "#1c1917"]}
                value={customStyles.bgColor} onChange={c => setCustomStyles(s => ({ ...s, bgColor: c }))} />
            </Section>
            <Section icon={<Baseline className="w-4 h-4" />} label="Text Color">
              <ColorPicker colors={["#1a1a2e", "#1e293b", "#333333", "#555555", "#0f172a", "#f5f0eb", "#ffffff", "#d4d4d8"]}
                value={customStyles.textColor} onChange={c => setCustomStyles(s => ({ ...s, textColor: c }))} />
            </Section>
            <Section icon={<Palette className="w-4 h-4" />} label="Accent Color">
              <ColorPicker colors={["#2a9d8f", "#6366f1", "#059669", "#e11d48", "#d946ef", "#ca8a04", "#0ea5e9", "#e76f51", "#1d4ed8", "#7e22ce", "#f43f5e", "#10b981"]}
                value={customStyles.accentColor} onChange={c => setCustomStyles(s => ({ ...s, accentColor: c }))} />
            </Section>
          </div>
        );

      case "layout":
        return (
          <div className="space-y-6">
            <Section icon={<Maximize2 className="w-4 h-4" />} label="Layout Width">
              <BtnGroup options={[["Narrow", "1000px"], ["Default", "1200px"], ["Wide", "1400px"], ["Full", "100%"]]}
                value={customStyles.maxWidth} onChange={v => setCustomStyles(s => ({ ...s, maxWidth: v }))} />
            </Section>
            <Section icon={<Maximize2 className="w-4 h-4" />} label="Section Spacing">
              <BtnGroup options={[["Compact", 60], ["Normal", 100], ["Spacious", 140], ["Airy", 180]]}
                value={customStyles.sectionSpacing} onChange={v => setCustomStyles(s => ({ ...s, sectionSpacing: v }))} />
            </Section>
            <Section icon={<Layout className="w-4 h-4" />} label="Navigation Style">
              <BtnGroup options={[["Glass", "glass"], ["Solid", "solid"], ["Minimal", "minimal"]]}
                value={customStyles.navStyle} onChange={v => setCustomStyles(s => ({ ...s, navStyle: v }))} />
            </Section>
            <Section icon={<Sparkles className="w-4 h-4" />} label="Animations">
              <button
                onClick={() => setCustomStyles(s => ({ ...s, animationEnabled: !s.animationEnabled }))}
                className={`w-full py-2.5 rounded-xl border text-sm font-medium transition-all ${customStyles.animationEnabled ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"}`}
              >
                {customStyles.animationEnabled ? "✨ Animations On" : "Animations Off"}
              </button>
            </Section>
            <Section icon={<Layers className="w-4 h-4" />} label={`BG Overlay Opacity: ${Math.round((customStyles.bgOverlayOpacity ?? 0.9) * 100)}%`}>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((customStyles.bgOverlayOpacity ?? 0.9) * 100)}
                onChange={e => setCustomStyles(s => ({ ...s, bgOverlayOpacity: parseInt(e.target.value) / 100 }))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, transparent, ${customStyles.bgColor || '#000'})` }}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Transparent</span>
                <span>Opaque</span>
              </div>
            </Section>
          </div>
        );

      case "hero":
        return (
          <div className="space-y-6">
            <Section icon={<StretchVertical className="w-4 h-4" />} label="Hero Height">
              <BtnGroup options={[["Short", "70vh"], ["Medium", "85vh"], ["Full", "100vh"]]}
                value={customStyles.heroHeight} onChange={v => setCustomStyles(s => ({ ...s, heroHeight: v }))} />
            </Section>
            <Section icon={<SlidersHorizontal className="w-4 h-4" />} label="Button Style">
              <BtnGroup options={[["Rounded", "rounded"], ["Pill", "pill"], ["Square", "square"]]}
                value={customStyles.buttonStyle} onChange={v => setCustomStyles(s => ({ ...s, buttonStyle: v }))} />
            </Section>
            <Section icon={<SlidersHorizontal className="w-4 h-4" />} label="Hero Overlay Strength">
              <input type="range" min="10" max="90" value={Math.round((customStyles.bgOverlayOpacity ?? 0.5) * 100)}
                onChange={e => setCustomStyles(s => ({ ...s, bgOverlayOpacity: parseInt(e.target.value) / 100 }))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, transparent, rgba(0,0,0,0.8))` }} />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Light</span><span>{Math.round((customStyles.bgOverlayOpacity ?? 0.5) * 100)}%</span><span>Dark</span>
              </div>
            </Section>
            <Section icon={<Type className="w-4 h-4" />} label="Hero Text Align">
              <BtnGroup options={[["Left", "left"], ["Center", "center"], ["Right", "right"]]}
                value={customStyles.heroTextAlign || "center"} onChange={v => setCustomStyles(s => ({ ...s, heroTextAlign: v }))} />
            </Section>
          </div>
        );

      case "cards":
        return (
          <div className="space-y-6">
            <Section icon={<RectangleHorizontal className="w-4 h-4" />} label="Border Radius">
              <BtnGroup options={[["Sharp", 0], ["Soft", 8], ["Round", 16], ["Pill", 50]]}
                value={customStyles.borderRadius} onChange={v => setCustomStyles(s => ({ ...s, borderRadius: v }))} />
            </Section>
            <Section icon={<Layers className="w-4 h-4" />} label="Shadow Style">
              <BtnGroup options={[["None", "none"], ["Soft", "soft"], ["Medium", "medium"], ["Bold", "bold"]]}
                value={customStyles.shadowStyle} onChange={v => setCustomStyles(s => ({ ...s, shadowStyle: v }))} />
            </Section>
            <Section icon={<Layers className="w-4 h-4" />} label="Card Style">
              <BtnGroup options={[["Flat", "flat"], ["Elevated", "elevated"], ["Bordered", "bordered"], ["Glass", "glass"]]}
                value={customStyles.cardStyle} onChange={v => setCustomStyles(s => ({ ...s, cardStyle: v }))} />
            </Section>
          </div>
        );

      case "images":
        return (
          <div className="space-y-6">
            <Section icon={<ImageIcon className="w-4 h-4" />} label="Image Filter">
              <div className="flex gap-2 flex-wrap">
                {([["None", "none"], ["B&W", "grayscale"], ["Sepia", "sepia"], ["Vivid", "saturate"], ["Vintage", "vintage"]] as const).map(([label, val]) => (
                  <button key={label} onClick={() => setCustomStyles(s => ({ ...s, imageFilter: val as string }))}
                    className={`flex-1 min-w-[60px] py-2.5 rounded-xl border text-xs font-medium transition-all ${customStyles.imageFilter === val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  >{label}</button>
                ))}
              </div>
            </Section>

            {/* ── Upload Images to Sections ── */}
            {onUpdateContent && (
              <>
                <Section icon={<Upload className="w-4 h-4" />} label="Hero & About Images">
                  <div className="grid grid-cols-2 gap-3">
                    <ImageUploadSlot src={content.heroImage} label="Hero" onUpload={updateHeroImage} />
                    <ImageUploadSlot src={content.aboutImage} label="About" onUpload={updateAboutImage} />
                    {content.promoBanner && (
                      <ImageUploadSlot src={content.promoBanner} label="Promo Banner" onUpload={updatePromoBanner} />
                    )}
                  </div>
                </Section>

                <Section icon={<ImageIcon className="w-4 h-4" />} label="Gallery Images">
                  <div className="grid grid-cols-3 gap-2">
                    {content.galleryImages.map((img, i) => (
                      <ImageUploadSlot key={i} src={img.src} label={`Gallery ${i + 1}`}
                        onUpload={(url) => updateGalleryImage(i, url)}
                        onRemove={content.galleryImages.length > 2 ? () => removeGalleryImage(i) : undefined} />
                    ))}
                    <ImageUploadSlot label="Add New" onUpload={addGalleryImage} />
                  </div>
                </Section>

                {content.products && content.products.length > 0 && (
                  <Section icon={<ImageIcon className="w-4 h-4" />} label="Product Images">
                    <div className="grid grid-cols-3 gap-2">
                      {content.products.map((product, i) => (
                        <ImageUploadSlot key={i} src={product.image} label={product.name.slice(0, 12)}
                          onUpload={(url) => updateProductImage(i, url)}
                          onRemove={content.products.length > 1 ? () => removeProduct(i) : undefined} />
                      ))}
                      <ImageUploadSlot label="Add Product" onUpload={addNewProduct} />
                    </div>
                  </Section>
                )}
              </>
            )}

            <div className="pt-3 space-y-3">
              <p className="text-xs text-gray-400 leading-relaxed"><span className="font-semibold text-gray-600">🖼️ Replace Images:</span> Hover over any image and click the upload icon, or drag & drop a new image.</p>
              <p className="text-xs text-gray-400 leading-relaxed"><span className="font-semibold text-gray-600">🔍 Zoom:</span> Hover over images and use the +/- buttons to zoom in or out.</p>
            </div>
          </div>
        );

      case "products":
        return (
          <div className="space-y-4">
            <Section icon={<ShoppingBag className="w-4 h-4" />} label={`Products (${content.products?.length || 0})`}>
              <div className="space-y-2">
                {content.products?.map((product, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                    {editingProductIndex === i ? (
                      <div className="p-3 space-y-2 bg-blue-50/50">
                        <input type="text" value={editProduct.name} onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))}
                          placeholder="Product name" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-blue-400" />
                        <input type="text" value={editProduct.price} onChange={e => setEditProduct(p => ({ ...p, price: e.target.value }))}
                          placeholder="Price (e.g. $49.99)" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-blue-400" />
                        <textarea value={editProduct.description} onChange={e => setEditProduct(p => ({ ...p, description: e.target.value }))}
                          placeholder="Description" rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-blue-400 resize-none" />
                        <input type="text" value={editProduct.badge} onChange={e => setEditProduct(p => ({ ...p, badge: e.target.value }))}
                          placeholder="Badge (e.g. New, Sale)" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-blue-400" />
                        <div className="flex gap-2">
                          <button onClick={saveEditProduct} className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors">
                            <Check className="w-3 h-3" /> Save
                          </button>
                          <button onClick={() => setEditingProductIndex(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.price}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => startEditProduct(i)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
                            <Pencil className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          <button onClick={() => removeProduct(i)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Add New Product */}
            {showAddForm ? (
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/30 p-4 space-y-3">
                <p className="text-sm font-bold text-gray-700">Add New Product</p>
                <input type="text" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                  placeholder="Product name *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
                <input type="text" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                  placeholder="Price (e.g. $49.99) *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
                <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)" rows={2} className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-400 resize-none" />
                <input type="text" value={newProduct.badge} onChange={e => setNewProduct(p => ({ ...p, badge: e.target.value }))}
                  placeholder="Badge (e.g. New, Sale)" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
                <div className="flex gap-2">
                  <button onClick={handleAddNewProduct} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-600 transition-colors">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                  <button onClick={() => { setShowAddForm(false); setNewProduct({ name: "", price: "", description: "", badge: "" }); }}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm font-semibold text-gray-400 hover:text-blue-500 flex items-center justify-center gap-2 transition-all">
                <Plus className="w-4 h-4" /> Add New Product
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm" />
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-[71] bg-white shadow-2xl flex flex-col"
            style={{ borderLeft: "1px solid #e5e7eb", height: "100dvh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h3 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#111" }}>Customize</h3>
              <div className="flex items-center gap-2">
                <button onClick={onReset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100" title="Reset to defaults">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 shrink-0 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-3 px-2 text-[10px] font-medium transition-all relative ${activeTab === tab.id ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content - properly scrollable */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
              <div className="p-5 pb-20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderTabContent()}
                  </motion.div>
                </AnimatePresence>

                {/* Always-visible actions */}
                <div className="mt-8 pt-5 border-t border-gray-200 space-y-3">
                  {onViewCode && (
                    <button
                      onClick={() => { onViewCode(); onClose(); }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", boxShadow: "0 4px 15px rgba(37,99,235,0.3)" }}
                    >
                      <span>✨</span> View Updated Code
                    </button>
                  )}
                  <p className="text-xs text-gray-400 leading-relaxed"><span className="font-semibold text-gray-600">✏️ Edit Text:</span> Double-click any text on the website</p>
                  <p className="text-[10px] text-gray-300 leading-relaxed">Code updates automatically with every customization you make</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ToolsPanel;
