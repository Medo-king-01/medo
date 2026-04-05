import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useSettings } from '../context/SettingsContext';

interface Props {
  stats: {
    strength: number;
    vitality: number;
    agility: number;
    intelligence: number;
    sense: number;
  };
}

export const HumanBodyStats: React.FC<Props> = ({ stats }) => {
  const { t } = useSettings();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [scanlineY, setScanlineY] = useState(0);

  // Scanning line animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanlineY((prev) => (prev > 420 ? -50 : prev + 2));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotation({ x: -y / 10, y: x / 10 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  // Normalize stats for visual representation
  const maxStat = Math.max(stats.strength, stats.vitality, stats.agility, stats.intelligence, stats.sense, 10);
  const getScale = (val: number) => 0.6 + (val / maxStat) * 1.4;
  const getOpacity = (val: number) => 0.5 + (val / maxStat) * 0.5;

  const nodes = [
    { id: 'int', label: t('int'), val: stats.intelligence, cx: 150, cy: 40, color: '#60a5fa' }, // Blue (Head)
    { id: 'sense', label: t('sense'), val: stats.sense, cx: 150, cy: 90, color: '#c084fc' }, // Purple (Neck/Upper Chest)
    { id: 'vit', label: t('vit'), val: stats.vitality, cx: 150, cy: 140, color: '#facc15' }, // Yellow (Heart/Core)
    { id: 'str', label: t('str'), val: stats.strength, cx: 90, cy: 150, color: '#f87171' }, // Red (Left Arm)
    { id: 'str2', label: t('str'), val: stats.strength, cx: 210, cy: 150, color: '#f87171', hideLabel: true }, // Red (Right Arm)
    { id: 'agi', label: t('agi'), val: stats.agility, cx: 120, cy: 280, color: '#4ade80' }, // Green (Left Leg)
    { id: 'agi2', label: t('agi'), val: stats.agility, cx: 180, cy: 280, color: '#4ade80', hideLabel: true }, // Green (Right Leg)
  ];

  // A more muscular, heroic silhouette path
  const bodyPath = `
    M 150 15 
    C 165 15, 170 30, 165 45 
    C 160 55, 155 60, 155 65 
    L 195 75 
    C 210 80, 220 90, 225 105
    L 235 180 
    C 237 190, 230 200, 220 200 
    L 210 145 
    L 185 95 
    L 175 150 
    L 170 200 
    L 185 280 
    C 190 310, 195 350, 190 370 
    C 185 380, 170 380, 165 370 
    L 155 280 
    L 150 210 
    L 145 280 
    L 135 370 
    C 130 380, 115 380, 110 370 
    C 105 350, 110 310, 115 280 
    L 130 200 
    L 125 150 
    L 115 95 
    L 90 145 
    L 80 200 
    C 70 200, 63 190, 65 180 
    L 75 105 
    C 80 90, 90 80, 105 75 
    L 145 65 
    C 145 60, 140 55, 135 45 
    C 130 30, 135 15, 150 15 
    Z
  `;

  return (
    <div 
      className="relative w-full h-96 flex items-center justify-center overflow-hidden rounded-xl bg-black/60 border border-game-primary/30"
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        animate={{ rotateX: rotation.x, rotateY: rotation.y }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        className="relative w-full h-full flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Ambient Glow Behind */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--color-primary),0.2)_0%,transparent_70%)] pointer-events-none" style={{ transform: 'translateZ(-50px)' }} />
        
        <svg viewBox="0 0 300 400" className="w-full h-full drop-shadow-[0_0_25px_rgba(var(--color-primary),0.8)]" style={{ transformStyle: 'preserve-3d' }}>
          <defs>
            <filter id="glow-strong" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-light">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(var(--color-primary), 0.6)" />
              <stop offset="50%" stopColor="rgba(var(--color-primary), 0.15)" />
              <stop offset="100%" stopColor="rgba(var(--color-primary), 0.4)" />
            </linearGradient>
            <clipPath id="bodyClip">
              <path d={bodyPath} />
            </clipPath>
          </defs>

          {/* Layer 1: Back Hologram (Ghost) */}
          <g style={{ transform: 'translateZ(-30px)', opacity: 0.3 }}>
            <path d={bodyPath} fill="rgba(var(--color-primary), 0.2)" filter="url(#glow-strong)" />
          </g>

          {/* Layer 2: Main Silhouette */}
          <g style={{ transform: 'translateZ(0px)' }}>
            <path 
              d={bodyPath} 
              stroke="rgba(var(--color-primary), 1)" 
              strokeWidth="2.5" 
              fill="url(#bodyGrad)" 
              filter="url(#glow-light)"
            />
            {/* Internal Grid / Tech Pattern */}
            <g clipPath="url(#bodyClip)" opacity="0.4">
              <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(var(--color-primary), 0.6)" strokeWidth="0.5" />
              </pattern>
              <rect width="300" height="400" fill="url(#grid)" />
              
              {/* Scanning Line */}
              <line 
                x1="0" y1={scanlineY} x2="300" y2={scanlineY} 
                stroke="rgba(var(--color-primary), 1)" 
                strokeWidth="3" 
                filter="url(#glow-strong)"
              />
              <rect 
                x="0" y={scanlineY - 30} width="300" height="30" 
                fill="url(#bodyGrad)" opacity="0.6"
              />
            </g>

            {/* Neural Network Connections */}
            <g stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" className="animate-pulse">
              {/* Heart to Head */}
              <path d="M 150 140 L 150 90 L 150 40" />
              {/* Heart to Arms */}
              <path d="M 150 140 L 115 145 L 90 150" />
              <path d="M 150 140 L 185 145 L 210 150" />
              {/* Heart to Legs */}
              <path d="M 150 140 L 140 210 L 120 280" />
              <path d="M 150 140 L 160 210 L 180 280" />
              {/* Cross connections */}
              <path d="M 120 280 L 180 280" strokeDasharray="2 4" opacity="0.6" />
              <path d="M 90 150 L 150 90 L 210 150" strokeDasharray="2 4" opacity="0.6" />
            </g>
          </g>

          {/* Layer 3: Stat Nodes (Floating in front) */}
          <g style={{ transform: 'translateZ(40px)' }}>
            {nodes.map((node, i) => {
              const scale = getScale(node.val);
              const opacity = getOpacity(node.val);
              
              return (
                <g key={i} className="transition-all duration-700 ease-out" style={{ transform: `translateZ(${node.val * 0.5}px)` }}>
                  {/* Outer Rotating Ring */}
                  <circle 
                    cx={node.cx} 
                    cy={node.cy} 
                    r={20 * scale} 
                    fill="none"
                    stroke={node.color}
                    strokeWidth="2"
                    strokeDasharray="4 6"
                    opacity={opacity * 0.9}
                    className="animate-[spin_3s_linear_infinite]"
                    style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                  />
                  {/* Pulsing Aura */}
                  <circle 
                    cx={node.cx} 
                    cy={node.cy} 
                    r={14 * scale} 
                    fill={node.color} 
                    opacity={opacity * 0.5} 
                    filter="url(#glow-strong)"
                    className="animate-pulse"
                  />
                  {/* Core Node */}
                  <circle 
                    cx={node.cx} 
                    cy={node.cy} 
                    r={6 * scale} 
                    fill="#fff" 
                    opacity={1}
                    filter="url(#glow-light)"
                  />
                  {/* Inner Core */}
                  <circle 
                    cx={node.cx} 
                    cy={node.cy} 
                    r={2.5 * scale} 
                    fill={node.color} 
                  />
                  
                  {/* Label & Value */}
                  {!node.hideLabel && (
                    <g transform={`translate(${node.cx < 150 ? node.cx - 55 : node.cx + 55}, ${node.cy})`}>
                      {/* Connecting Line to Label */}
                      <line 
                        x1={node.cx < 150 ? 55 : -55} 
                        y1="0" 
                        x2={node.cx < 150 ? 30 : -30} 
                        y2="0" 
                        stroke={node.color} 
                        strokeWidth="1.5" 
                        opacity="0.8" 
                      />
                      {/* Label Box */}
                      <rect 
                        x={node.cx < 150 ? -35 : -35} 
                        y="-18" 
                        width="70" 
                        height="36" 
                        fill="rgba(0,0,0,0.8)" 
                        stroke={node.color} 
                        strokeWidth="1.5" 
                        rx="6"
                        opacity="0.95"
                      />
                      <text x="0" y="-4" fill={node.color} fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                        {node.label.toUpperCase()}
                      </text>
                      <text x="0" y="12" fill="white" fontSize="14" fontWeight="black" textAnchor="middle" className="font-mono">
                        {Math.floor(node.val)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </motion.div>
    </div>
  );
};
