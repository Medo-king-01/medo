
import React, { useEffect, useState } from 'react';
import { Sword, Shield, Wind, Brain, Eye, ChevronsUp, AlertCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { AudioService } from '../services/audioService';

export const LevelUpModal: React.FC = () => {
  const { showLevelUpModal, closeLevelUpModal, stats } = useGame();
  const { t, soundEnabled } = useSettings();
  const [step, setStep] = useState(0);

  // Constants for stats animation
  const statsList = [
      { label: t('str'), icon: Sword, delay: 1000 },
      { label: t('vit'), icon: Shield, delay: 1200 },
      { label: t('agi'), icon: Wind, delay: 1400 },
      { label: t('int'), icon: Brain, delay: 1600 },
      { label: t('sense'), icon: Eye, delay: 1800 },
  ];

  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    if (showLevelUpModal) {
      setStep(1);
      if (soundEnabled) {
          // Initial alert sound
          AudioService.playLevelUp();
          
          // Sequential ticks for stats
          statsList.forEach((stat) => {
             timeouts.push(setTimeout(() => AudioService.playStatTick(), stat.delay)); 
          });
      }
      
      // Sequence
      timeouts.push(setTimeout(() => setStep(2), 500)); // Window Fully Open
      timeouts.push(setTimeout(() => setStep(3), 2000)); // Stats fully shown (Button ready)
      
    } else {
      setStep(0);
    }

    return () => {
        timeouts.forEach(clearTimeout);
    };
  }, [showLevelUpModal]); // Removed soundEnabled to prevent re-triggering

  if (!showLevelUpModal) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-game-bg/80 backdrop-blur-sm animate-fade-in font-sans">
        
        {/* --- RED SYSTEM WINDOW CONTAINER --- */}
        {/* We override app theme colors here to enforce the Anime System Look (Red/Black) */}
        <div 
            className={`
                relative w-full max-w-sm bg-game-surface/95 
                border-2 border-game-primary shadow-[0_0_30px_rgba(var(--color-primary),0.3)]
                rounded-none overflow-hidden transition-all duration-500 ease-out
                ${step >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
            `}
            style={{
                boxShadow: '0 0 40px rgba(var(--color-primary), 0.2), inset 0 0 20px rgba(var(--color-primary), 0.1)'
            }}
        >
            {/* Header: SYSTEM ALERT */}
            <div className="bg-game-primary-dim/20 p-3 border-b border-game-primary flex items-center gap-3">
                <AlertCircle className="text-game-primary animate-pulse" size={20} />
                <span className="text-game-primary font-mono font-bold tracking-[0.2em] text-xs uppercase animate-pulse">
                    {t('systemMessage')}
                </span>
            </div>

            <div className="p-8 text-center relative z-10">
                
                {/* 1. LEVEL UP TEXT */}
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-game-text to-game-primary drop-shadow-[0_0_10px_rgba(var(--color-primary),0.8)] italic uppercase transform -skew-x-12 mb-2">
                    {t('levelUpTitle')}
                </h2>

                {/* 2. LEVEL CHANGE ANIMATION */}
                <div className="flex items-center justify-center gap-6 my-6 font-mono text-3xl font-bold text-game-text">
                    <span className="opacity-50 text-2xl">{stats.level - 1}</span>
                    <ChevronsUp size={32} className="text-game-primary animate-bounce" />
                    <span className="text-game-primary text-4xl drop-shadow-[0_0_15px_rgba(var(--color-primary),1)]">
                        {stats.level}
                    </span>
                </div>

                {/* Separator Line */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-game-primary to-transparent mb-6 opacity-50"></div>

                {/* 3. STATS GRID */}
                <div className="space-y-3 mb-8">
                    <p className="text-[10px] text-game-primary font-mono tracking-[0.3em] uppercase mb-4 opacity-80">
                        {t('statsIncreased')}
                    </p>
                    
                    {statsList.map((stat, i) => (
                        <div 
                            key={i} 
                            className={`
                                flex items-center justify-between px-4 py-2 bg-game-primary-dim/10 rounded-none border border-game-primary/30
                                transition-all duration-500
                                ${step >= 2 ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}
                            `}
                            style={{ transitionDelay: `${i * 150}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                <stat.icon size={16} className="text-game-text" />
                                <span className="text-xs font-bold text-game-text uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-game-primary font-black text-lg">+1</span>
                                <ChevronsUp size={14} className="text-game-primary animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* 4. BUTTON */}
                <button 
                    onClick={closeLevelUpModal}
                    className={`
                        w-full py-4 border border-game-primary bg-transparent text-game-primary font-mono font-bold uppercase tracking-[0.2em]
                        hover:bg-game-primary hover:text-game-text transition-all duration-300 relative group overflow-hidden
                        ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    <span className="relative z-10 group-hover:font-black">{t('accept')}</span>
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-game-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>

            </div>

            {/* Background Decor (Grid Lines) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--color-primary),0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--color-primary),0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"></div>
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-game-primary"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-game-primary"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-game-primary"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-game-primary"></div>

        </div>
    </div>
  );
};
