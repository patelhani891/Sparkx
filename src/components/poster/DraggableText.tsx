import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import type { PosterElement } from "@/types/poster";

interface DraggableTextProps {
  element: PosterElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PosterElement>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableText = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  containerRef,
}: DraggableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    onSelect();
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (textRef.current) {
      onUpdate({ content: textRef.current.textContent || "" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    e.stopPropagation();
  };

  const textShadow = element.textShadow || "0 2px 8px rgba(0,0,0,0.4)";
  const glowShadow = element.glowColor && element.glowSize
    ? `0 0 ${element.glowSize}px ${element.glowColor}, 0 0 ${element.glowSize * 2}px ${element.glowColor}`
    : "";
  const combinedShadow = [textShadow !== "none" ? textShadow : "", glowShadow].filter(Boolean).join(", ") || "none";
  const strokeStyle = element.textStroke && element.textStroke > 0
    ? { WebkitTextStroke: `${element.textStroke}px ${element.textStrokeColor || "#000000"}` }
    : {};

  const gradientStyle = element.gradient
    ? {
        background: element.gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }
    : {};

  const bgStyle = element.backgroundColor
    ? {
        backgroundColor: element.backgroundColor,
        padding: element.backgroundPadding ?? 4,
        borderRadius: element.borderRadius ?? 0,
        display: "inline-block",
        border: element.backgroundBorderWidth ? `${element.backgroundBorderWidth}px solid ${element.backgroundBorderColor || "#ffffff"}` : undefined,
      }
    : {};

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  return (
    <motion.div
      drag={!isEditing}
      dragMomentum={false}
      dragConstraints={containerRef}
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        x: dragX,
        y: dragY,
        zIndex: isSelected ? 100 : (element.zIndex ?? 1),
        mixBlendMode: (element.blendMode as any) || "normal",
      }}
      onDragEnd={(_, info) => {
        onUpdate({
          x: element.x + info.offset.x,
          y: element.y + info.offset.y,
        });
        dragX.set(0);
        dragY.set(0);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="group"
    >
      <div
        className="relative px-2 py-1 rounded transition-all"
        style={{
          outline: isSelected ? "2px solid hsl(217 91% 60%)" : "2px solid transparent",
          outlineOffset: "4px",
        }}
      >
        <div style={bgStyle}>
          <div
            ref={textRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="outline-none whitespace-pre-wrap min-w-[40px] cursor-move"
            style={{
              fontSize: element.fontSize,
              fontWeight: element.fontWeight,
              color: element.gradient ? undefined : element.color,
              fontFamily: element.fontFamily,
              textAlign: element.textAlign,
              opacity: element.opacity,
              transform: `rotate(${element.rotation}deg) skewX(${element.skewX ?? 0}deg) skewY(${element.skewY ?? 0}deg) scaleX(${(element.scaleX ?? 1) * (element.flipX ? -1 : 1)}) scaleY(${(element.scaleY ?? 1) * (element.flipY ? -1 : 1)})`,
              letterSpacing: `${element.letterSpacing}em`,
              textTransform: element.textTransform,
              fontStyle: element.italic ? "italic" : "normal",
              textDecoration: [element.underline ? "underline" : "", element.strikethrough ? "line-through" : ""].filter(Boolean).join(" ") || "none",
              cursor: isEditing ? "text" : "move",
              width: element.width ? `${element.width}px` : "auto",
              lineHeight: element.lineHeight ?? (element.fontSize > 40 ? 1.05 : 1.5),
              textShadow: element.gradient ? "none" : combinedShadow,
              wordSpacing: element.wordSpacing ? `${element.wordSpacing}em` : undefined,
              filter: element.blur ? `blur(${element.blur}px)` : undefined,
              backdropFilter: element.backdropBlur ? `blur(${element.backdropBlur}px)` : undefined,
              ...strokeStyle,
              ...gradientStyle,
            }}
          >
            {element.content}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DraggableText;
