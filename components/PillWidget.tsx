
import React from 'react';
import { PILLARS } from '../constants';
import { PillarType } from '../types';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';

interface Props {
  pillarId: PillarType;
  taskCount: number;
  onClick?: () => void;
  variant?: 'card' | 'header'; 
}

export const PillWidget: React.FC<Props> = ({ pillarId, taskCount, onClick, variant = 'card' }) => {
  const pillar = PILLARS.find(p => p.id === pillarId);
  const { t, language } = useSettings();
  const { tasks } = useGame();

  if (!pillar) return null;

  const isCard = variant === 'card';
  const colorName = pillar.color.split('-')[1]; // e.g., 'blue', 'green'
  
  // Dynamic Backgrounds based on variant
  const cardClasses = `
    relative overflow-hidden w-full text-right transition-all duration-300 group
    bg-game-surface/80 backdrop-blur-sm
    border border-game-primary/30 rounded-none p-5
    hover:border-game-primary hover:shadow-[0_0_20px_rgba(var(--color-primary),0.2)] hover:scale-[1.01] active:scale-[0.99]
  `;

  const headerClasses = `
    relative w-full bg-game-surface
    border-b border-game-primary/30 p-6 pb-12 pt-16
  `;

  // Calculate stats for this pillar
  const pillarTasks = tasks.filter(t => t.pillar === pillarId);
  const totalTasks = pillarTasks.length;
  const completedTasks = pillarTasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Translation key based on ID
  const translatedLabel = t(pillar.id.toLowerCase() as any);

  return (
    <button 
      onClick={onClick}
      disabled={!onClick}
      className={isCard ? cardClasses : headerClasses}
    >
      {/* Decorative Background Blob */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${colorName}-600/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2`} />

      {/* Giant Icon Watermark */}
      <div className={`absolute ${isCard ? '-left-4 -bottom-4 opacity-5 rotate-12 group-hover:opacity-10' : 'left-4 top-1/2 -translate-y-1/2 opacity-5 scale-150'} transition-all duration-500`}>
        <pillar.icon size={isCard ? 100 : 140} />
      </div>

      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-4 w-full">
            {/* Icon Container */}
            <div className={`
                flex items-center justify-center rounded-none shadow-lg transition-transform duration-300 group-hover:rotate-6
                ${isCard ? 'p-3 w-14 h-14' : 'p-4 w-16 h-16'}
                bg-game-surface border border-game-primary/50 text-game-primary
                shadow-[0_0_15px_rgba(var(--color-primary),0.2)]
            `}>
                <pillar.icon size={isCard ? 28 : 32} />
            </div>
            
            {/* Text & Stats */}
            <div className="flex-1">
                <h3 className={`font-black text-game-text leading-tight uppercase tracking-tight ${isCard ? 'text-xl' : 'text-3xl mb-1'}`}>
                    {translatedLabel}
                </h3>
                
                {isCard && (
                    <div className="flex items-center gap-3 mt-1">
                        {taskCount > 0 ? (
                            <span className="text-[10px] font-bold text-game-accent bg-game-primary-dim/20 px-2 py-0.5 rounded-none border border-game-primary/30 uppercase tracking-wider">
                                {taskCount} {t('active')}
                            </span>
                        ) : (
                            <span className="text-[10px] font-medium text-game-text-muted uppercase tracking-wider">{t('noTasks')}</span>
                        )}
                        {totalTasks > 0 && (
                            <span className="text-[10px] text-game-text-muted font-mono">
                                {t('total')}: {totalTasks}
                            </span>
                        )}
                    </div>
                )}
                
                {!isCard && (
                    <div className="flex items-center gap-2 text-game-text-muted text-sm font-medium font-mono">
                        <span>{t('lvl')} {Math.floor(completedTasks / 10) + 1}</span>
                        <span className="w-1 h-1 bg-game-primary rounded-full"></span>
                        <span>{progress.toFixed(0)}% {t('completed')}</span>
                    </div>
                )}
            </div>
        </div>
        
        {/* Navigation Arrow (Card Only) */}
        {isCard && (
            <div className={`
                p-2 rounded-none border border-game-primary/30 bg-game-surface text-game-primary/50
                group-hover:bg-game-primary group-hover:text-game-text group-hover:border-game-accent transition-all
                ${language === 'en' ? 'rotate-180' : ''}
            `}>
                <ChevronLeft size={20} />
            </div>
        )}
      </div>

      {/* Progress Bar (Visual Flair) */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-game-primary-dim/20">
        <div 
            className={`h-full bg-game-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(var(--color-primary),1)]`} 
            style={{ width: `${progress}%` }} 
        />
      </div>
    </button>
  );
};
