import { useRef, useState, useEffect } from "react";
import type { PosterState, PosterElement } from "@/types/poster";
import { POSTER_FILTERS } from "@/types/poster";
import DraggableText from "./DraggableText";

interface PosterCanvasProps {
  poster: PosterState;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<PosterElement>) => void;
  isGenerating: boolean;
}

const PosterCanvas = ({
  poster,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  isGenerating,
}: PosterCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevImageRef = useRef<string | null>(null);

  useEffect(() => {
    if (poster.backgroundImage !== prevImageRef.current) {
      prevImageRef.current = poster.backgroundImage;
      setImgLoaded(false);
    }
  }, [poster.backgroundImage]);

  const showLoading = isGenerating || (!!poster.backgroundImage && !imgLoaded);
  const filterCss = POSTER_FILTERS.find((f) => f.id === poster.filter)?.css || "";

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-auto relative"
      style={{ background: "radial-gradient(ellipse 200% 150% at 50% 0%, #1a1a1a 0%, #141414 30%, #111111 55%, #0d0d0d 100%)" }}
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      {/* Frame around canvas */}
      <div className="relative z-10" style={{
        padding: "1px",
        borderRadius: (poster.borderRadius ?? 0) + 2,
        background: "linear-gradient(135deg, #c084fc, #e879f9)",
        boxShadow: "0 0 6px 1px rgba(168,85,247,0.15)",
      }}>
      <div
        ref={canvasRef}
        className="relative overflow-hidden cursor-default select-none"
        style={{
          width: poster.width,
          height: poster.height,
          maxWidth: "100%",
          maxHeight: "calc(100vh - 8rem)",
          aspectRatio: `${poster.width}/${poster.height}`,
          backgroundColor: poster.backgroundColor,
          borderRadius: poster.borderRadius ?? 0,
          border: (poster.borderWidth ?? 0) > 0
            ? `${poster.borderWidth}px solid ${poster.borderColor || "#ffffff"}`
            : undefined,
          outline: undefined,
          outlineOffset: undefined,
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.5)",
          padding: poster.padding ?? 0,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas) {
            onSelectElement(null);
          }
        }}
        id="poster-canvas"
      >
        {/* Background Image */}
        {poster.backgroundImage && (
          <img
            data-canvas
            src={poster.backgroundImage}
            alt=""
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              filter: [filterCss, poster.blurBackground ? `blur(${poster.blurBackground}px)` : ""].filter(Boolean).join(" ") || undefined,
              borderRadius: poster.borderRadius ?? 0,
              transform: poster.blurBackground ? "scale(1.05)" : undefined,
            }}
          />
        )}

        {/* Overlay */}
        {poster.overlayOpacity > 0 && (
          <div
            data-canvas
            className="absolute inset-0"
            style={{
              backgroundColor: poster.overlayColor,
              opacity: poster.overlayOpacity,
              borderRadius: poster.borderRadius ?? 0,
            }}
          />
        )}

        {/* Overlay Gradient */}
        {poster.overlayGradient && (
          <div
            data-canvas
            className="absolute inset-0"
            style={{ background: poster.overlayGradient, borderRadius: poster.borderRadius ?? 0 }}
          />
        )}

        {/* Vignette */}
        {(poster.vignette ?? 0) > 0 && (
          <div
            data-canvas
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, transparent ${60 - (poster.vignette ?? 0) * 40}%, rgba(0,0,0,${(poster.vignette ?? 0) * 0.85}) 100%)`,
              borderRadius: poster.borderRadius ?? 0,
            }}
          />
        )}

        {/* Film Grain */}
        {(poster.grain ?? 0) > 0 && (
          <div
            data-canvas
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              opacity: (poster.grain ?? 0) * 0.3,
              mixBlendMode: "overlay",
              borderRadius: poster.borderRadius ?? 0,
            }}
          />
        )}

        {/* Generating / image-loading overlay */}
        {showLoading && (
          <div data-canvas className="absolute inset-0 flex items-center justify-center z-50" style={{ background: "radial-gradient(ellipse 200% 150% at 50% 0%, #1a1a1a 0%, #141414 30%, #111111 55%, #0d0d0d 100%)" }}>
            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl sparkx-logo flex items-center justify-center animate-pulse shadow-lg">
                  <div className="h-7 w-7 rounded-xl bg-white/30 animate-ping" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-1 w-32 rounded-full bg-accent/20 overflow-hidden">
                  <div className="h-full sparkx-logo rounded-full animate-pulse-line origin-center" />
                </div>
                <span className="text-[11px] text-white/70 font-ui tracking-wider uppercase">Creating your poster…</span>
              </div>
            </div>
          </div>
        )}

        {/* Elements */}
        {poster.elements.map((el) => (
          <DraggableText
            key={el.id}
            element={el}
            isSelected={selectedElementId === el.id}
            onSelect={() => onSelectElement(el.id)}
            onUpdate={(updates) => onUpdateElement(el.id, updates)}
            containerRef={canvasRef}
          />
        ))}

        {/* Empty state */}
        {!poster.backgroundImage && poster.elements.length === 0 && !isGenerating && (
          <div data-canvas className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-12">
              <div className="h-16 w-16 mx-auto mb-4 rounded-2xl sparkx-logo flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white">⚡</span>
              </div>
              <p className="text-muted-foreground/50 font-ui text-sm font-semibold">
                Your masterpiece awaits
              </p>

            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default PosterCanvas;
