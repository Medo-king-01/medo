
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { CheckCircle2, Trash2, Zap, Pencil, CalendarClock, Circle, ChevronUp, ChevronDown, Moon, Sun, Ghost, XCircle, Lock, AlertOctagon, Sword, AlertTriangle, Flame, BatteryCharging } from 'lucide-react';
import { PILLARS } from '../constants';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  canAfford: boolean;
}

export const TaskItem: React.FC<Props> = React.memo(({ task, onComplete, onDelete, onEdit, canAfford }) => {
  const { moveTask, investInBossTask, tasks } = useGame();
  const { t } = useSettings();
  const pillarInfo = PILLARS.find(p => p.id === task.pillar);
  const [isVisible, setIsVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Phase II: Dependency Check
  const isLockedByPrerequisite = React.useMemo(() => {
      if (!task.prerequisiteTaskId) return false;
      const prereq = tasks.find(t => t.id === task.prerequisiteTaskId);
      return prereq ? !prereq.completed : false;
  }, [task.prerequisiteTaskId, tasks]);

  // Time Modifier Check
  const hour = new Date().getHours();
  const isMorning = hour >= 6 && hour < 10;
  const isNight = hour >= 22 || hour < 4;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    if (task.isMissed) return;
    
    if (task.isBoss) {
        investInBossTask(task.id, task.energyCost);
        return;
    }

    setIsCompleting(true);
    // Play sound logic handled in GameContext
    setTimeout(() => {
        onComplete(task.id);
        setIsCompleting(false);
    }, 500); // Wait for slash animation
  };
  
  // Safe comparison for YYYY-MM-DD
  const isOverdue = React.useMemo(() => {
    if (!task.dueDate) return false;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return task.dueDate < todayStr;
  }, [task.dueDate]);

  // Hidden Recovery Task Styling
  if (task.isHiddenRecovery && !task.completed) {
      return (
        <div className={`
            relative p-4 rounded-none mb-3 transition-all duration-500 animate-pop overflow-hidden
            bg-emerald-950/30 border border-emerald-500/60
            flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.15)]
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            ${isCompleting ? 'scale-95 opacity-0' : 'scale-100'}
        `}>
            {/* Scanline Effect Overlay */}
            <div className="absolute inset-0 bg-scanlines opacity-30 pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
                <div className="bg-emerald-900/50 p-2 rounded-sm border border-emerald-500 animate-pulse">
                    <BatteryCharging size={22} className="text-emerald-300" />
                </div>
                <div>
                    <h4 className="font-black text-emerald-200 text-sm tracking-wide uppercase font-mono">{task.title}</h4>
                    <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 border border-emerald-500/30">
                            RECOVERY +{Math.abs(task.energyCost)} EP
                        </span>
                        <span className="text-[9px] text-emerald-500/70 font-mono animate-pulse">
                            HIDDEN QUEST
                        </span>
                    </div>
                </div>
            </div>
            <button
                onClick={handleComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-sm transition-all shadow-[0_0_10px_#10b981] border border-emerald-400 relative z-10 group"
            >
                <Zap size={20} className="fill-white group-hover:scale-110 transition-transform" />
            </button>
        </div>
      );
  }

  // Missed Task Styling (Broken Dungeon Effect)
  if (task.isMissed) {
      return (
        <div className={`
            relative p-4 rounded-none border mb-3 transition-all duration-500 opacity-80 hover:opacity-100
            bg-game-surface/40 border-game-primary-dim/30 flex items-center justify-between
            ${isVisible ? 'translate-y-0' : 'translate-y-4'}
        `}>
            {/* Cracks Effect (Simulated via gradients) */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(var(--color-primary),0.05)_10px,rgba(var(--color-primary),0.05)_11px)] pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
                <div className="bg-game-surface p-2 rounded-none border border-game-primary-dim/30">
                    <XCircle size={20} className="text-game-primary-dim/50" />
                </div>
                <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-game-primary-dim/50 bg-game-surface px-1.5 border border-game-primary-dim/30">{t('failed')}</span>
                        {pillarInfo && (
                            <span className={`text-[9px] font-bold ${pillarInfo.color} opacity-60`}>{t(pillarInfo.id.toLowerCase() as any) || pillarInfo.label}</span>
                        )}
                    </div>
                    <h4 className="font-bold text-gray-600 text-lg line-through decoration-game-primary-dim/30 decoration-2">{task.title}</h4>
                    <span className="text-[10px] font-mono text-game-primary-dim/50 mt-1 block flex items-center gap-1">
                        <Lock size={10} /> {t('dungeonLocked')}
                    </span>
                </div>
            </div>
            
             <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3 text-game-primary-dim/50 hover:text-game-primary hover:bg-game-surface rounded-none transition-colors relative z-10"
            >
                <Trash2 size={18} />
            </button>
        </div>
      );
  }

  return (
    <div 
        className={`
            relative p-4 rounded-none border mb-3 transition-all duration-300 group overflow-hidden
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            ${task.completed 
                ? 'bg-game-surface/40 border-game-primary-dim/20 opacity-60 grayscale' 
                : 'bg-game-surface/80 backdrop-blur-sm border-game-primary/30 hover:border-game-primary/60 hover:shadow-[0_0_15px_rgba(var(--color-primary),0.15)]'}
        `}
    >
      {/* SLASH Animation Element */}
      {isCompleting && (
          <div className="absolute inset-0 z-50 pointer-events-none">
              <div className="slash-line w-full animate-slash bg-game-primary shadow-[0_0_10px_rgba(var(--color-primary),1),0_0_20px_rgba(var(--color-primary),0.5)]"></div>
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          </div>
      )}

      {/* Subtle selection indicator */}
      {!task.completed && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${pillarInfo?.color.replace('text-', 'bg-')} opacity-50 group-hover:opacity-100 transition-opacity`} />
      )}

      <div className="flex justify-between items-start">
        <div className="flex-1 ml-3">
            
            {/* Meta Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                {pillarInfo && (
                    <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-none bg-game-surface border border-game-primary-dim/30 ${pillarInfo.color}`}>
                         <pillarInfo.icon size={10} />
                        <span>{t(pillarInfo.id.toLowerCase() as any) || pillarInfo.label}</span>
                    </div>
                )}
                {task.dueDate && (
                     <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-game-surface border border-game-primary-dim/30 ${isOverdue && !task.completed ? 'text-game-primary border-game-primary-dim/50' : 'text-gray-500'}`}>
                        <CalendarClock size={10} />
                        <span>{task.dueDate}</span>
                    </div>
                )}
                {/* Time Effect Badge */}
                {!task.completed && task.pillar !== 'Quran' && (
                    <>
                        {isMorning && <div className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-yellow-500/5 border border-yellow-500/20 text-yellow-500"><Sun size={10}/> {t('morningBuff')}</div>}
                        {isNight && <div className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-blue-900/20 border border-blue-500/20 text-blue-400"><Moon size={10}/> {t('nightDebuff')}</div>}
                    </>
                )}
                {task.isBoss && (
                    <div className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-red-900/20 border border-red-500/50 text-red-500 animate-pulse">
                        <Flame size={10} /> {t('boss')}
                    </div>
                )}
                {isLockedByPrerequisite && (
                    <div className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-gray-900/20 border border-gray-500/50 text-gray-400">
                        <Lock size={10} /> Locked
                    </div>
                )}
            </div>

          <h4 className={`font-bold text-lg leading-snug transition-all ${task.completed ? 'line-through text-gray-600' : 'text-game-text group-hover:text-game-accent'} ${isLockedByPrerequisite ? 'opacity-50' : ''}`}>
            {task.title}
          </h4>
          {task.description && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-mono opacity-80">{task.description}</p>}
          
          {/* Boss Progress Bar */}
          {task.isBoss && !task.completed && (
              <div className="mt-3 bg-game-bg border border-red-900/30 p-2 rounded-none">
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-red-400">{t('bossHp')}</span>
                      <span className="text-game-text-muted">{task.targetEnergy! - (task.investedEnergy || 0)} / {task.targetEnergy}</span>
                  </div>
                  <div className="h-1.5 bg-game-surface overflow-hidden">
                      <div 
                          className="h-full bg-red-500 transition-all duration-500"
                          style={{ width: `${Math.max(0, 100 - ((task.investedEnergy || 0) / task.targetEnergy! * 100))}%` }}
                      />
                  </div>
              </div>
          )}

          {/* Rewards (Stats) */}
          {!task.completed && (
            <div className="flex items-center mt-3 gap-2">
                <div className={`flex items-center text-[9px] font-mono px-2 py-0.5 rounded-none border ${task.energyCost < 0 ? 'text-green-500 bg-green-900/10 border-green-500/20' : 'text-yellow-500 bg-yellow-900/10 border-yellow-500/20'}`}>
                    <Zap size={10} className={`ml-1 ${task.energyCost < 0 ? 'fill-green-500' : 'fill-yellow-500'}`} /> 
                    <span className="font-bold">{task.energyCost < 0 ? '+' : '-'}{Math.abs(task.energyCost)} {t('ep')}</span>
                </div>
                <div className="text-[9px] text-blue-400 font-mono font-bold bg-blue-900/10 px-2 py-0.5 rounded-none border border-blue-500/20">
                    +{task.xpReward} {t('xp')}
                </div>
            </div>
          )}
        </div>

        {/* Actions & Reordering */}
        <div className="flex flex-col gap-1 pl-2 items-center">
            {/* Reorder Buttons */}
            {!task.completed && (
                <div className="flex flex-col gap-1 mb-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                    <button onClick={() => moveTask(task.id, 'up')} className="p-0.5 hover:bg-game-surface rounded-none text-gray-500 hover:text-game-text">
                        <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveTask(task.id, 'down')} className="p-0.5 hover:bg-game-surface rounded-none text-gray-500 hover:text-game-text">
                        <ChevronDown size={14} />
                    </button>
                </div>
            )}

            {!task.completed && (
                <button
                onClick={handleComplete}
                disabled={!canAfford || isCompleting || isLockedByPrerequisite}
                className={`
                    p-3 rounded-none transition-all duration-200 relative overflow-hidden group/btn
                    ${(canAfford && !isLockedByPrerequisite)
                        ? 'bg-game-surface text-gray-500 hover:bg-game-primary hover:text-game-text hover:shadow-[0_0_15px_rgba(var(--color-primary),0.6)] border border-game-primary/30 hover:border-game-accent' 
                        : 'bg-game-surface/50 text-gray-700 cursor-not-allowed border border-game-primary-dim/20'}
                `}
                title={isLockedByPrerequisite ? 'Locked by prerequisite' : (canAfford ? t('execute') : t('insufficientEnergy'))}
                >
                    {(canAfford && !isLockedByPrerequisite) ? (
                        <div className="relative">
                            {task.isBoss ? (
                                <Flame size={20} className={`text-red-500 transition-transform duration-300 ${isCompleting ? 'scale-0' : 'group-hover/btn:scale-110'}`} />
                            ) : (
                                <Sword size={20} className={`transition-transform duration-300 ${isCompleting ? 'scale-0' : 'group-hover/btn:rotate-45'}`} />
                            )}
                            {/* Inner glow on hover */}
                            <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 blur-md"></div>
                        </div>
                    ) : <Lock size={20} />}
                </button>
            )}
            
            {!task.completed && onEdit && (
                <button
                    onClick={() => onEdit(task)}
                    className="p-2 text-gray-500 hover:text-game-text hover:bg-game-surface rounded-none transition-colors scale-90 hover:scale-100"
                >
                    <Pencil size={16} />
                </button>
            )}

            <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-500 hover:text-game-primary hover:bg-game-primary-dim/10 rounded-none transition-colors scale-90 hover:scale-100"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-game-surface border border-red-900/50 rounded-none w-full max-w-sm overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <div className="p-4 border-b border-red-900/30 bg-red-950/20 flex items-center gap-3">
                    <AlertTriangle className="text-red-500" size={24} />
                    <h3 className="font-black text-red-500 uppercase tracking-widest">{t('deleteWarning')}</h3>
                </div>
                <div className="p-6">
                    <p className="text-game-text text-sm leading-relaxed mb-6 font-mono">
                        {t('deleteTaskConfirm')}
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-3 bg-game-bg border border-game-primary/30 text-game-text-muted font-bold uppercase tracking-widest hover:bg-game-primary-dim/10 hover:text-game-text transition-colors rounded-none"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            onClick={() => {
                                setShowDeleteConfirm(false);
                                onDelete(task.id);
                            }}
                            className="flex-1 py-3 bg-red-900/20 border border-red-900 text-red-500 font-bold uppercase tracking-widest hover:bg-red-900/40 transition-colors rounded-none"
                        >
                            {t('confirmDelete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
});
