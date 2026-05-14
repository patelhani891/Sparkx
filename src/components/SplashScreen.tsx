import { useEffect } from "react";

interface SplashScreenProps { onComplete: () => void; }

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div id="splash-container" style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse 200% 150% at 50% 0%, #1a1a1a 0%, #141414 30%, #111111 55%, #0d0d0d 100%)",
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 9999,
    }}>
      <style>{`
        :root {
          --entry-speed: 1.1s;
          --draw-speed: 2.4s;
          --hold-duration: 0.6s;
          --exit-speed: 0.7s;
        }

        /* Subtle noise texture overlay */
        #splash-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.4;
        }

        .sparkx-stage {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transform-style: preserve-3d;
          opacity: 0;
          animation:
            sparkx-reveal var(--entry-speed) cubic-bezier(0.34,1.56,0.64,1) forwards,
            sparkx-exit var(--exit-speed) calc(var(--draw-speed) + var(--hold-duration)) cubic-bezier(0.7,0,0.84,0) forwards;
        }

        .sparkx-stage svg {
          width: 52vw;
          max-width: 560px;
          height: auto;
          overflow: visible;
          filter: drop-shadow(0 0 40px rgba(168,85,247,0.15));
        }

        @keyframes sparkx-reveal {
          0%   { opacity:0; transform: rotateX(-80deg) translateZ(120px) scale(0.9); filter: blur(20px); }
          100% { opacity:1; transform: rotateX(0deg) translateZ(0) scale(1); filter: blur(0px); }
        }
        @keyframes sparkx-exit {
          0%   { opacity:1; transform: scale(1); filter: blur(0px) brightness(1); }
          100% { opacity:0; transform: scaleX(5) scaleY(0.03) translateZ(600px); filter: blur(50px) brightness(6); }
        }

        .sparkx-path-trace {
          fill: none;
          stroke: rgba(255,255,255,0.55);
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 1500;
          stroke-dashoffset: 1500;
          animation: sparkx-draw var(--draw-speed) cubic-bezier(0.22,1,0.36,1) forwards;
        }

        .sparkx-x-line-1 {
          stroke: url(#grad-purple);
          filter: drop-shadow(0 0 12px rgba(168,85,247,1)) drop-shadow(0 0 28px rgba(192,132,252,0.6));
        }
        .sparkx-x-line-2 {
          stroke: url(#grad-pink);
          filter: drop-shadow(0 0 12px rgba(236,72,153,1)) drop-shadow(0 0 28px rgba(255,128,181,0.6));
        }

        @keyframes sparkx-draw {
          0%  { stroke-dashoffset: 1500; opacity: 0; }
          8%  { opacity: 1; }
          100%{ stroke-dashoffset: 0; opacity: 1; }
        }

        .sparkx-spark {
          fill: #c084fc;
          filter: blur(1px) drop-shadow(0 0 10px #a855f7);
          animation: sparkx-travel var(--draw-speed) cubic-bezier(0.22,1,0.36,1) forwards;
          opacity: 0;
          offset-path: path('M50,150 L150,150 L150,110 L50,110 L50,50 L150,50 M200,150 L200,50 L280,50 C310,50 310,100 280,100 L200,100 M350,150 L400,50 L450,150 M500,150 L500,50 L580,50 C610,50 610,100 580,100 L500,100 L580,150 M650,150 L650,50 M650,100 L730,50 M650,100 L730,150 M780,150 L880,50 M880,150 L780,50');
        }
        .sparkx-spark-trail {
          fill: rgba(192,132,252,0.35);
          filter: blur(4px);
          animation: sparkx-travel var(--draw-speed) cubic-bezier(0.22,1,0.36,1) forwards;
          animation-delay: 0.05s;
          opacity: 0;
          offset-path: path('M50,150 L150,150 L150,110 L50,110 L50,50 L150,50 M200,150 L200,50 L280,50 C310,50 310,100 280,100 L200,100 M350,150 L400,50 L450,150 M500,150 L500,50 L580,50 C610,50 610,100 580,100 L500,100 L580,150 M650,150 L650,50 M650,100 L730,50 M650,100 L730,150 M780,150 L880,50 M880,150 L780,50');
        }
        @keyframes sparkx-travel {
          0%  { offset-distance: 0%; opacity: 0; }
          5%  { opacity: 1; }
          95% { opacity: 1; }
          100%{ offset-distance: 100%; opacity: 0; }
        }

        .sparkx-bloom {
          opacity: 0;
          stroke-width: 6;
          filter: blur(18px);
          animation: sparkx-bloom-fade 2s calc(var(--draw-speed) - 0.6s) ease-in-out forwards;
        }
        .bloom-body { stroke: rgba(255,255,255,0.3); }
        .bloom-x1   { stroke: #c084fc; }
        .bloom-x2   { stroke: #ec4899; }
        @keyframes sparkx-bloom-fade {
          0%  { opacity: 0; }
          40% { opacity: 0.5; }
          100%{ opacity: 0.15; }
        }

        /* Tagline below logo */
        .sparkx-tagline {
          opacity: 0;
          animation: sparkx-tagline-in 0.8s calc(var(--draw-speed) * 0.6) ease forwards;
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: rgba(167,139,250,0.45);
          margin-top: 28px;
        }
        @keyframes sparkx-tagline-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Horizontal rule lines flanking tagline */
        .sparkx-rule {
          display: inline-block;
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.3));
          vertical-align: middle;
          margin: 0 12px;
        }
        .sparkx-rule.right {
          background: linear-gradient(90deg, rgba(167,139,250,0.3), transparent);
        }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position:"absolute", top:"-10%", left:"-5%", width:600, height:600, background:"radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)", filter:"blur(100px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:500, height:500, background:"radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 65%)", filter:"blur(100px)", pointerEvents:"none" }} />

      {/* Fine grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)", backgroundSize:"80px 80px", pointerEvents:"none" }} />

      <div className="sparkx-stage" style={{ perspective: 2000 }}>
        <svg viewBox="0 0 1000 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#e879f9" />
              <stop offset="50%"  stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#ff80b5" />
              <stop offset="50%"  stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
            <path id="body" d="M50,150 L150,150 L150,110 L50,110 L50,50 L150,50 M200,150 L200,50 L280,50 C310,50 310,100 280,100 L200,100 M350,150 L400,50 L450,150 M500,150 L500,50 L580,50 C610,50 610,100 580,100 L500,100 L580,150 M650,150 L650,50 M650,100 L730,50 M650,100 L730,150" />
            <path id="x1" d="M780,150 L880,50" />
            <path id="x2" d="M880,150 L780,50" />
          </defs>

          <use href="#body" className="sparkx-bloom bloom-body" fill="none" />
          <use href="#x1"   className="sparkx-bloom bloom-x1"   fill="none" />
          <use href="#x2"   className="sparkx-bloom bloom-x2"   fill="none" />

          <use href="#body" className="sparkx-path-trace" />
          <use href="#x1"   className="sparkx-path-trace sparkx-x-line-1" />
          <use href="#x2"   className="sparkx-path-trace sparkx-x-line-2" />

          <circle r="5" className="sparkx-spark-trail" />
          <circle r="3.5" className="sparkx-spark" />
        </svg>

        <div className="sparkx-tagline">
          <span className="sparkx-rule" />
          AI · Creative Studio
          <span className="sparkx-rule right" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
