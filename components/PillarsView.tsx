
import React from 'react';
import { useGame } from '../context/GameContext';
import { PILLARS } from '../constants';
import { PillarType } from '../types';
import { PillWidget } from './PillWidget';
import { Layers, Shield, Sword, Book, Zap, Heart, Music } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface Props {
    onNavigate: (pillar: PillarType) => void;
}

export const PillarsView: React.FC<Props> = ({ onNavigate }) => {
  const { tasks } = useGame();
  const { t } = useSettings();

  return (
    <div className="flex-1 w-full flex flex-col pb-24 bg-game-bg text-game-text animate-fade-in overflow-y-auto no-scrollbar relative">
      
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-game-primary/10 to-transparent"></div>
          <div className="absolute top-20 right-10 w-32 h-32 bg-game-accent/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header Info */}
      <div className="px-6 pt-8 pb-4 relative z-10">
         <div className="flex items-center gap-3 mb-3 text-game-primary">
            <div className="p-2 bg-game-primary/10 rounded-lg border border-game-primary/30">
                <Layers size={24} className="animate-pulse" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter drop-shadow-md">{t('lifePillars')}</h2>
         </div>
         <p className="text-game-text-muted text-sm font-mono border-l-2 border-game-primary/50 pl-3">
             Select a domain to manage your quests and upgrade your skills.
         </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 relative z-10">
        {PILLARS.map((pillar, index) => {
          const pillarTasks = tasks.filter(t => t.pillar === pillar.id);
          const activeCount = pillarTasks.filter(t => !t.completed).length;
          
          return (
            <div 
                key={pillar.id} 
                className="animate-slide-up hover:scale-[1.02] transition-transform duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
            >
                <PillWidget 
                    pillarId={pillar.id} 
                    taskCount={activeCount}
                    onClick={() => onNavigate(pillar.id)}
                    variant="card"
                />
            </div>
          );
        })}
      </div>

      <div className="px-6 py-8 text-center relative z-10 mt-auto">
        <div className="inline-block px-4 py-1 bg-game-surface border border-game-border rounded-full">
            <p className="text-[10px] text-game-text-muted font-mono tracking-widest">{t('systemOnline')}</p>
        </div>
      </div>
    </div>
  );
};
