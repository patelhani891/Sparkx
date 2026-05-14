import { useEffect, useState } from "react";

interface SparkxTextProps {
  className?: string;
  isDark?: boolean;
}

const SparkxText = ({ className = "", isDark: isDarkProp }: SparkxTextProps) => {
  const [isDarkLocal, setIsDarkLocal] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDarkLocal(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const isDark = isDarkProp !== undefined ? isDarkProp : isDarkLocal;

  return (
    <span className={className}>
      <span style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)", WebkitTextFillColor: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)" }}>SPARK</span>
      <span style={{
        background: "linear-gradient(90deg, #a855f7, #ec4899)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>X</span>
    </span>
  );
};

export default SparkxText;
