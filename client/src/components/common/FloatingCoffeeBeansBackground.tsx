import React, { useState, useEffect, useRef } from 'react';

// Detailed SVG Coffee Bean with realistic 3D crevice, gradient, and rim highlight
export const CoffeeBeanSVG: React.FC<{
  className?: string;
  size?: number;
  rotation?: number;
  colorVariant?: 'green' | 'light' | 'medium' | 'dark';
}> = ({ className = '', size = 48, rotation = 0, colorVariant = 'medium' }) => {
  const colors = {
    green: {
      bodyStart: '#607D3B',
      bodyMid: '#445D25',
      bodyEnd: '#2C3E14',
      crevice: '#1E2B0E',
      highlight: '#99C762',
    },
    light: {
      bodyStart: '#B87B4C',
      bodyMid: '#8A522A',
      bodyEnd: '#5C3418',
      crevice: '#361D0C',
      highlight: '#DFA576',
    },
    medium: {
      bodyStart: '#6E4025',
      bodyMid: '#422415',
      bodyEnd: '#241209',
      crevice: '#140A05',
      highlight: '#A66E3A',
    },
    dark: {
      bodyStart: '#3D2014',
      bodyMid: '#24110A',
      bodyEnd: '#140804',
      crevice: '#080301',
      highlight: '#693821',
    },
  }[colorVariant];

  const uniqueId = `bean-${colorVariant}-${Math.random().toString(36).substr(2, 5)}`;

  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`filter drop-shadow-lg transition-transform duration-700 ${className}`}
    >
      <defs>
        <radialGradient
          id={`${uniqueId}-body`}
          cx="40%"
          cy="35%"
          r="65%"
          fx="35%"
          fy="30%"
        >
          <stop offset="0%" stopColor={colors.bodyStart} />
          <stop offset="65%" stopColor={colors.bodyMid} />
          <stop offset="100%" stopColor={colors.bodyEnd} />
        </radialGradient>

        <linearGradient
          id={`${uniqueId}-highlight`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={colors.highlight} stopOpacity="0.8" />
          <stop offset="40%" stopColor={colors.highlight} stopOpacity="0.2" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={`${uniqueId}-crevice`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.crevice} stopOpacity="0.9" />
          <stop offset="50%" stopColor="#000000" stopOpacity="0.95" />
          <stop offset="100%" stopColor={colors.crevice} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Main Oval Seed Body */}
      <path
        d="M50 5 C75 5 95 32 95 65 C95 98 75 125 50 125 C25 125 5 98 5 65 C5 32 25 5 50 5 Z"
        fill={`url(#${uniqueId}-body)`}
      />

      {/* Top rim specular highlight reflection */}
      <path
        d="M50 8 C70 8 86 32 86 60 C86 70 80 60 70 45 C58 30 40 20 25 35 C18 42 14 55 14 60 C14 32 30 8 50 8 Z"
        fill={`url(#${uniqueId}-highlight)`}
        opacity="0.4"
      />

      {/* Center Roasted Crevice (S-curved split) */}
      <path
        d="M50 12 Q44 38 54 65 Q62 92 48 118"
        stroke={`url(#${uniqueId}-crevice)`}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Inner fissure line */}
      <path
        d="M50 15 Q45 38 53 65 Q60 92 49 115"
        stroke="#050302"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Crevice lip highlight */}
      <path
        d="M53 18 Q48 40 56 65 Q63 90 52 112"
        stroke={colors.highlight}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
};

export interface FloatingBeanItem {
  id: number;
  left: number; // percentage (0 - 100)
  top: number; // percentage (0 - 100)
  size: number;
  rotation: number;
  parallaxSpeed: number; // scroll speed multiplier
  floatDuration: number; // seconds
  floatDelay: number; // seconds
  blurAmount: string;
  opacity: number;
  colorVariant: 'green' | 'light' | 'medium' | 'dark';
}

const FULL_PAGE_BEANS: FloatingBeanItem[] = [
  // Top Hero Area Beans
  { id: 101, left: 4, top: 8, size: 74, rotation: -28, parallaxSpeed: 0.28, floatDuration: 7.2, floatDelay: 0, blurAmount: 'blur-[1.5px]', opacity: 0.85, colorVariant: 'dark' },
  { id: 102, left: 91, top: 12, size: 82, rotation: 36, parallaxSpeed: 0.32, floatDuration: 8.5, floatDelay: 1.2, blurAmount: 'blur-[2px]', opacity: 0.8, colorVariant: 'medium' },
  { id: 103, left: 48, top: 4, size: 42, rotation: 14, parallaxSpeed: 0.18, floatDuration: 6.5, floatDelay: 2.5, blurAmount: 'blur-none', opacity: 0.7, colorVariant: 'light' },
  { id: 104, left: 16, top: 22, size: 54, rotation: -45, parallaxSpeed: 0.22, floatDuration: 7.8, floatDelay: 3.1, blurAmount: 'blur-none', opacity: 0.9, colorVariant: 'medium' },
  { id: 105, left: 82, top: 26, size: 60, rotation: 52, parallaxSpeed: 0.26, floatDuration: 6.8, floatDelay: 0.7, blurAmount: 'blur-none', opacity: 0.85, colorVariant: 'dark' },

  // Middle How It Works & Menu Area Beans
  { id: 106, left: 7, top: 38, size: 68, rotation: 22, parallaxSpeed: 0.25, floatDuration: 8.2, floatDelay: 1.8, blurAmount: 'blur-[1px]', opacity: 0.8, colorVariant: 'green' },
  { id: 107, left: 93, top: 44, size: 58, rotation: -38, parallaxSpeed: 0.2, floatDuration: 7.5, floatDelay: 2.2, blurAmount: 'blur-none', opacity: 0.9, colorVariant: 'medium' },
  { id: 108, left: 24, top: 54, size: 36, rotation: 68, parallaxSpeed: 0.15, floatDuration: 9, floatDelay: 3.8, blurAmount: 'blur-[2px]', opacity: 0.5, colorVariant: 'light' },
  { id: 109, left: 76, top: 58, size: 70, rotation: -18, parallaxSpeed: 0.3, floatDuration: 6.9, floatDelay: 0.4, blurAmount: 'blur-[1.5px]', opacity: 0.85, colorVariant: 'dark' },

  // Lower Area Beans
  { id: 110, left: 5, top: 68, size: 80, rotation: -32, parallaxSpeed: 0.35, floatDuration: 8.4, floatDelay: 1.5, blurAmount: 'blur-[2px]', opacity: 0.85, colorVariant: 'medium' },
  { id: 111, left: 88, top: 74, size: 64, rotation: 44, parallaxSpeed: 0.28, floatDuration: 7.1, floatDelay: 2.8, blurAmount: 'blur-none', opacity: 0.95, colorVariant: 'dark' },
  { id: 112, left: 18, top: 86, size: 50, rotation: 12, parallaxSpeed: 0.2, floatDuration: 7.6, floatDelay: 3.4, blurAmount: 'blur-none', opacity: 0.8, colorVariant: 'light' },
  { id: 113, left: 82, top: 92, size: 76, rotation: -48, parallaxSpeed: 0.32, floatDuration: 8.8, floatDelay: 0.9, blurAmount: 'blur-[1.5px]', opacity: 0.85, colorVariant: 'green' },
  { id: 114, left: 52, top: 82, size: 32, rotation: -60, parallaxSpeed: 0.12, floatDuration: 9.5, floatDelay: 4.2, blurAmount: 'blur-[2.5px]', opacity: 0.4, colorVariant: 'dark' },
];

export const FloatingCoffeeBeansBackground: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* Ambient Atmospheric Radial Glows */}
      <div className="absolute top-[10%] left-1/4 w-[600px] h-[600px] bg-caramel/15 rounded-full blur-[160px]" />
      <div className="absolute top-[40%] right-1/4 w-[700px] h-[700px] bg-caramel/10 rounded-full blur-[180px]" />
      <div className="absolute top-[75%] left-1/3 w-[800px] h-[800px] bg-caramel/15 rounded-full blur-[200px]" />

      {/* Floating Coffee Beans */}
      {FULL_PAGE_BEANS.map((bean) => {
        const scrollOffset = scrollY * bean.parallaxSpeed;
        const mouseOffsetX = mousePos.x * 35 * bean.parallaxSpeed;
        const mouseOffsetY = mousePos.y * 35 * bean.parallaxSpeed;

        return (
          <div
            key={bean.id}
            style={{
              left: `${bean.left}%`,
              top: `${bean.top}%`,
              transform: `translate3d(${mouseOffsetX}px, ${-scrollOffset + mouseOffsetY}px, 0)`,
              transition: 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)',
              opacity: bean.opacity,
            }}
            className="absolute"
          >
            <div
              style={{
                animation: `float ${bean.floatDuration}s ease-in-out infinite`,
                animationDelay: `${bean.floatDelay}s`,
              }}
              className={bean.blurAmount}
            >
              <CoffeeBeanSVG
                size={bean.size}
                rotation={bean.rotation}
                colorVariant={bean.colorVariant}
              />
            </div>
          </div>
        );
      })}

      {/* Ambient Rising Aroma Steam Particles */}
      <div className="absolute top-[15%] left-1/4 w-2 h-2 rounded-full bg-caramel/40 blur-xs animate-steam" />
      <div className="absolute top-[35%] right-1/3 w-3 h-3 rounded-full bg-caramel/30 blur-xs animate-steam [animation-delay:1.5s]" />
      <div className="absolute top-[65%] left-2/3 w-2.5 h-2.5 rounded-full bg-caramel/35 blur-xs animate-steam [animation-delay:2.8s]" />
      <div className="absolute top-[85%] left-1/5 w-2 h-2 rounded-full bg-caramel/30 blur-xs animate-steam [animation-delay:4s]" />
    </div>
  );
};
