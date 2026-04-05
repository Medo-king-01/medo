
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { PILLARS, HUNTER_TITLES } from '../constants';
import { Activity, Flame, Trophy, Zap, Settings, CalendarDays, Bot, Target, CheckCircle2, ArrowRight, PieChart, Plus, ShieldAlert, Skull } from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { PillWidget } from './PillWidget';
import { DailyQuestWidget } from './DailyQuestWidget';
import { PillarType, AppTab } from '../types';
import { AudioService } from '../services/audioService';

interface Props {
  onNavigateToPillar: (pillar: PillarType) => void;
  onOpenSettings: () => void;
  onNavigateToTab: (tab: AppTab) => void;
  onQuickAdd: () => void;
}

export const Dashboard: React.FC<Props> = ({ onNavigateToPillar, onOpenSettings, onNavigateToTab, onQuickAdd }) => {
  const { stats, tasks, playerProfile, setWeeklyChallenge, completeWeeklyChallenge, useItem, awaken } = useGame();
  const { t, soundEnabled, language } = useSettings();
  
  const [challengeInput, setChallengeInput] = useState('');
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const showChallengeSelector = !stats.weeklyChallenge;

  // Calculate Rank based on Level
  const currentRank = useMemo(() => {
    const lvl = stats.level;
    if (lvl >= 75) return 'SS';
    if (lvl >= 50) return 'S';
    if (lvl >= 35) return 'A';
    if (lvl >= 20) return 'B';
    if (lvl >= 10) return 'C';
    if (lvl >= 5) return 'D';
    return 'E';
  }, [stats.level]);

  const rankInfo = HUNTER_TITLES[currentRank];

  const handleSetChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if(challengeInput.trim()) {
        if(soundEnabled) AudioService.playClick();
        setWeeklyChallenge(challengeInput);
        setChallengeInput('');
    }
  };

  const handleQuickAdd = () => {
      if(soundEnabled) AudioService.playClick();
      onQuickAdd();
  }

  const handleNavigatePillar = (id: PillarType) => {
      if(soundEnabled) AudioService.playTabSwitch();
      onNavigateToPillar(id);
  }

  return (
    // Replaced bg-game-black with bg-game-bg and text-white with text-game-text
    <div className="flex-1 w-full overflow-y-auto no-scrollbar space-y-6 pb-32 animate-fade-in bg-game-bg text-game-text relative transition-colors duration-300 font-sans">
      
      {/* Background Grid - System Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(var(--color-primary), 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--color-primary), 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-1 h-1 bg-game-primary rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-purple-500 rounded-full opacity-30 animate-pulse delay-700"></div>
          <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-game-accent rounded-full opacity-40 animate-pulse delay-1000"></div>
      </div>

      {/* SYSTEM STATUS HEADER */}
      <div className="px-5 pt-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-game-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--color-primary),1)]"></div>
                <p className="text-game-primary text-[10px] font-mono uppercase tracking-[0.2em]">{t('systemActive')}</p>
            </div>
            <button onClick={onOpenSettings} className="p-2 bg-game-primary-dim/20 backdrop-blur-md rounded-lg text-game-accent hover:text-game-text border border-game-primary/30 hover:border-game-accent transition-colors">
                <Settings size={18} />
            </button>
        </div>

        <div className="bg-game-surface/40 backdrop-blur-sm border border-game-primary/30 p-4 rounded-none relative overflow-hidden group">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-game-primary"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-game-primary"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-game-primary"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-game-primary"></div>

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xs text-game-accent font-mono uppercase tracking-widest mb-1">{t('playerProfile')}</h2>
                    <h1 className="text-2xl font-black text-game-text tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(var(--color-primary),0.5)]">
                        {playerProfile?.name || t('player')}
                    </h1>
                    <div className={`text-xs font-bold mt-1 ${rankInfo.color} uppercase tracking-wider flex items-center gap-1`}>
                        <ShieldAlert size={12} />
                        {language === 'ar' ? rankInfo.ar : rankInfo.en}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-game-accent to-game-primary font-mono leading-none">
                        {stats.level}
                    </div>
                    <div className="text-[9px] text-game-primary uppercase tracking-[0.2em] font-bold">{t('level')}</div>
                    {stats.awakenings > 0 && (
                        <div className="text-[10px] text-game-accent font-bold mt-1">
                            {t('awakening')}: {stats.awakenings} (+{stats.awakenings * 10}% XP)
                        </div>
                    )}
                    {stats.level >= 100 && (
                        <button 
                            onClick={awaken}
                            className="mt-2 px-2 py-1 bg-game-accent text-game-bg text-[10px] font-bold uppercase rounded-none animate-pulse"
                        >
                            {t('awakenSystem')}
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* 1️⃣ SPECIAL QUEST (Weekly Challenge) */}
      <div className="px-4 relative z-10">
        {showChallengeSelector && (
            <div className="bg-gradient-to-r from-game-primary-dim/20 to-game-bg border border-game-primary/30 p-5 rounded-none shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-game-primary/5 rounded-full blur-[50px] group-hover:bg-game-primary/10 transition-colors"></div>
                
                <div className="flex items-center gap-2 mb-3 text-game-accent relative z-10">
                    <Skull size={18} />
                    <h3 className="font-bold text-xs uppercase tracking-[0.15em]">{t('weeklyChallenge')}</h3>
                </div>
                <p className="text-xs text-game-text-muted mb-4 relative z-10 font-mono">{t('challengeDesc')} <span className="text-yellow-400 font-bold text-glow-gold">+500 XP</span>.</p>
                
                <form onSubmit={handleSetChallenge} className="flex gap-2 relative z-10">
                    <input 
                        type="text"
                        value={challengeInput}
                        onChange={(e) => setChallengeInput(e.target.value)}
                        placeholder={t('challengePlaceholder')}
                        className="flex-1 bg-game-surface/60 border border-game-primary/30 rounded-none px-4 py-3 text-sm text-game-text focus:border-game-accent outline-none placeholder:text-game-primary/50 font-bold w-full font-mono"
                        maxLength={40}
                    />
                    <button 
                        type="submit"
                        disabled={!challengeInput.trim()}
                        className="bg-game-primary text-white px-4 rounded-none font-bold disabled:opacity-50 hover:bg-game-primary-dim transition-all border border-game-accent"
                    >
                        <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        )}

        {/* Active/Completed Challenge */}
        {stats.weeklyChallenge && (
             <div className={`
                p-5 rounded-none flex items-center justify-between shadow-lg border relative overflow-hidden transition-all
                ${stats.weeklyChallenge.completed 
                    ? 'bg-green-950/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                    : 'bg-game-primary-dim/10 border-game-primary/30'}
             `}>
                <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm border ${stats.weeklyChallenge.completed ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'}`}>
                            {stats.weeklyChallenge.completed ? t('missionComplete') : t('activeMission')}
                        </span>
                    </div>
                    <p className={`font-bold text-sm font-mono ${stats.weeklyChallenge.completed ? 'text-gray-500 line-through' : 'text-game-text'}`}>
                        {stats.weeklyChallenge.title}
                    </p>
                </div>
                
                {!stats.weeklyChallenge.completed ? (
                    <button 
                        onClick={() => {
                            if(soundEnabled) AudioService.playClick();
                            completeWeeklyChallenge();
                        }}
                        className="relative z-10 bg-game-surface/40 hover:bg-yellow-600/20 hover:text-yellow-400 text-game-primary/50 p-3 rounded-none transition-all border border-game-primary/30 hover:border-yellow-400"
                    >
                        <CheckCircle2 size={24} />
                    </button>
                ) : (
                    <div className="bg-green-500/10 border border-green-500/30 p-2 rounded-none text-green-500">
                        <CheckCircle2 size={24} />
                    </div>
                )}
             </div>
        )}
      </div>

      {/* Stats Grid - Responsive grid-cols */}
      <div className="px-4 grid grid-cols-2 gap-3 relative z-10">
        {/* Level Widget (Tall) */}
        <div className="col-span-1 row-span-2">
             <DashboardWidget 
                label={t('level')}
                value={stats.level}
                subValue={currentRank} // Show Rank Letter
                icon={Trophy}
                iconColor="text-yellow-500"
                progress={{
                    current: stats.currentXp,
                    max: stats.maxXp,
                    colorClass: "bg-gradient-to-r from-yellow-600 to-yellow-400"
                }}
                variant="circular"
                borderColor="border-game-primary/30"
            />
        </div>

        {/* Energy Widget */}
        <DashboardWidget 
            label={t('energy')}
            value={stats.energy}
            subValue={`/ ${stats.maxEnergy}`}
            icon={Zap}
            iconColor="text-blue-400"
            progress={{
                current: stats.energy,
                max: stats.maxEnergy,
                colorClass: "bg-gradient-to-r from-blue-600 to-blue-400"
            }}
            borderColor="border-game-primary/30"
        />

        {/* Mini Widgets */}
        <div className="col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
            <DashboardWidget 
                label={t('streak')}
                value={stats.streak}
                icon={Flame}
                iconColor="text-orange-500"
                borderColor="border-game-primary/30"
            />
             <DashboardWidget 
                label={t('done')}
                value={completedTasksCount}
                icon={Activity}
                iconColor="text-emerald-500"
                borderColor="border-game-primary/30"
            />
        </div>
      </div>

      {/* Daily Quest Widget */}
      <DailyQuestWidget />

      {/* Inventory Section */}
      <div className="px-4 relative z-10">
        <div className="bg-game-surface/40 backdrop-blur-sm border border-game-primary/30 p-4 rounded-none">
            <h3 className="text-xs font-bold text-game-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldAlert size={14} /> {t('inventory')}
            </h3>
            <div className="grid grid-cols-3 gap-2">
                {Object.entries(stats.inventory || {}).map(([itemId, count]) => {
                    if (count <= 0) return null;
                    return (
                        <div key={itemId} className="bg-game-bg border border-game-primary/20 p-2 text-center relative group">
                            <div className="text-xs font-bold text-game-text mb-1 truncate">{t(itemId as any) || itemId.replace('_', ' ')}</div>
                            <div className="text-[10px] text-game-primary font-mono">x{count}</div>
                            <button 
                                onClick={() => useItem(itemId as any)}
                                className="absolute inset-0 bg-game-primary/90 text-game-bg text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                {t('use')}
                            </button>
                        </div>
                    );
                })}
                {(!stats.inventory || Object.values(stats.inventory).every(c => c === 0)) && (
                    <div className="col-span-3 text-center text-[10px] text-game-text-muted font-mono py-2">
                        Inventory Empty
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Quick Nav (The Dock) */}
      <div className="px-4 relative z-10">
          <div className="bg-game-surface/60 backdrop-blur-md border border-game-primary/30 rounded-none p-1 flex shadow-lg">
             <button onClick={() => onNavigateToTab(AppTab.PLANNER)} className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-game-primary-dim/20 rounded-none transition-colors group">
                <CalendarDays size={20} className="text-game-primary/50 group-hover:text-game-accent transition-colors" />
                <span className="text-[9px] font-bold text-game-primary/50 group-hover:text-game-accent uppercase tracking-wider">{t('planner')}</span>
             </button>
             <div className="w-px bg-game-primary/20 my-2"></div>
             <button onClick={() => onNavigateToTab(AppTab.COACH)} className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-game-primary-dim/20 rounded-none transition-colors group">
                <Bot size={20} className="text-game-primary/50 group-hover:text-purple-400 transition-colors" />
                <span className="text-[9px] font-bold text-game-primary/50 group-hover:text-game-accent uppercase tracking-wider">{t('coach')}</span>
             </button>
             <div className="w-px bg-game-primary/20 my-2"></div>
             <button onClick={() => onNavigateToTab(AppTab.STATS)} className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-game-primary-dim/20 rounded-none transition-colors group">
                <PieChart size={20} className="text-game-primary/50 group-hover:text-green-400 transition-colors" />
                <span className="text-[9px] font-bold text-game-primary/50 group-hover:text-game-accent uppercase tracking-wider">{t('statistics')}</span>
             </button>
          </div>
      </div>

      {/* Pillars Preview List (Compact) */}
      <div className="px-4 pb-4 space-y-3 relative z-10">
         <div className="flex justify-between items-end border-b border-game-primary/30 pb-2 mb-2">
            <h3 className="text-xs font-black text-game-primary/50 uppercase tracking-[0.2em]">{t('lifePillars')}</h3>
            <button onClick={() => onNavigateToTab(AppTab.PILLARS)} className="text-[10px] text-game-accent font-bold hover:text-game-text uppercase tracking-widest">{t('viewAll')}</button>
         </div>
         
         <div className="grid grid-cols-1 gap-3">
            {PILLARS.slice(0, 3).map((pillar) => {
                const count = tasks.filter(t => t.pillar === pillar.id && !t.completed).length;
                return (
                    <PillWidget 
                        key={pillar.id}
                        pillarId={pillar.id} 
                        taskCount={count}
                        onClick={() => handleNavigatePillar(pillar.id)}
                        variant="card"
                    />
                );
            })}
         </div>
      </div>

      {/* Quick Add FAB (Floating Action Button) */}
      <button 
        onClick={handleQuickAdd}
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-6 w-14 h-14 bg-game-primary text-white rounded-none rotate-45 shadow-[0_0_30px_rgba(var(--color-primary),0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 border-2 border-game-accent group"
      >
        <Plus size={28} strokeWidth={3} className="-rotate-45 group-hover:rotate-45 transition-transform duration-300" />
      </button>

    </div>
  );
};
