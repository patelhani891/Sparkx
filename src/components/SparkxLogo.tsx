import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SparkxLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
}

const widths = { sm: 80, md: 120, lg: 180 };

const SparkxLogo = ({ className = "", size = "md", isDark: isDarkProp }: SparkxLogoProps) => {
  const [isDarkLocal, setIsDarkLocal] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDarkLocal(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const isDark = isDarkProp !== undefined ? isDarkProp : isDarkLocal;
  const sparkColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)";

  return (
    <motion.svg
      viewBox="0 0 930 200"
      xmlns="http://www.w3.org/2000/svg"
      width={widths[size]}
      height={widths[size] * (200 / 930)}
      className={className}
      animate={{
        filter: [
          "drop-shadow(0 0 6px rgba(168,85,247,0.4))",
          "drop-shadow(0 0 18px rgba(236,72,153,0.6))",
          "drop-shadow(0 0 6px rgba(168,85,247,0.4))",
        ],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="logo-grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#e879f9" />
          <stop offset="50%"  stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="logo-grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ff80b5" />
          <stop offset="50%"  stopColor="#ec4899" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
      </defs>

      {/* SPARK — white in dark, black in light */}
      <path
        d="M50,150 L150,150 L150,110 L50,110 L50,50 L150,50 M200,150 L200,50 L280,50 C310,50 310,100 280,100 L200,100 M350,150 L400,50 L450,150 M500,150 L500,50 L580,50 C610,50 610,100 580,100 L500,100 L580,150 M650,150 L650,50 M650,100 L730,50 M650,100 L730,150"
        fill="none"
        stroke={sparkColor}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* X line 1 — purple gradient */}
      <path
        d="M780,150 L880,50"
        fill="none"
        stroke="url(#logo-grad-purple)"
        strokeWidth="10"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(168,85,247,0.9))" }}
      />

      {/* X line 2 — pink gradient */}
      <path
        d="M880,150 L780,50"
        fill="none"
        stroke="url(#logo-grad-pink)"
        strokeWidth="10"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(236,72,153,0.9))" }}
      />
    </motion.svg>
  );
};

export default SparkxLogo;
