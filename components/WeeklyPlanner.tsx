
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { DAYS_OF_WEEK } from '../constants';
import { TaskItem } from './TaskItem';
import { DayOfWeek, Task } from '../types';
import { Calendar, CheckCircle2, Coffee, Plus, Lock, AlertCircle, Map } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { useToast } from '../context/ToastContext';

interface Props {
  onAddTask: (day: DayOfWeek) => void;
  onEditTask: (task: Task) => void;
}

export const WeeklyPlanner: React.FC<Props> = ({ onAddTask, onEditTask }) => {
  const { tasks, completeTask, deleteTask, stats } = useGame();
  const { t } = useSettings();
  const { addToast } = useToast();
  
  // Calculate Today's Index (0 = Saturday, ... 6 = Friday)
  const todayIndex = (new Date().getDay() + 1) % 7;

  // State to track expanded days (default to today or Saturday)
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(DAYS_OF_WEEK[todayIndex].id);
  
  // Ref to scroll to the current day
  const todayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (todayRef.current) {
      // Small delay to ensure rendering is complete before scrolling
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, []);

  // Optimize: Group tasks by day once using useMemo instead of filtering 7 times inside map
  const tasksByDay = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    DAYS_OF_WEEK.forEach(d => grouped[d.id] = []);
    
    tasks.forEach(task => {
        if (task.day && grouped[task.day]) {
            grouped[task.day].push(task);
        }
    });
    return grouped;
  }, [tasks]);

  const handleAddClick = (dayIndex: number, dayId: DayOfWeek) => {
      if (dayIndex < todayIndex) {
          addToast(t('dayLockedMsg') || "هذا اليوم قد مضى. لا يمكن إضافة مهام جديدة.", 'error');
          return;
      }
      onAddTask(dayId);
  };

  return (
    <div className="h-full overflow-y-auto pb-24 animate-fade-in bg-game-bg text-game-text relative no-scrollbar">
        
        {/* Background Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-game-primary-dim/10 to-transparent"></div>
        </div>

        <div className="p-6 relative z-10">
            <div className="flex items-center gap-3 mb-6 text-game-primary">
                <div className="p-2 bg-game-primary-dim/10 rounded-none border border-game-primary/30">
                    <Map size={24} className="animate-pulse" />
                </div>
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter drop-shadow-[0_0_5px_rgba(var(--color-primary),0.5)] text-game-text">{t('weeklyPlanner')}</h2>
                    <p className="text-game-primary/70 text-[10px] font-mono tracking-[0.2em] uppercase mt-1">{t('questBoard')}</p>
                </div>
            </div>

            <div className="space-y-4">
                {DAYS_OF_WEEK.map((day, index) => {
                    const isRestDay = day.id === 'Friday';
                    const isPast = index < todayIndex;
                    const isToday = index === todayIndex;
                    
                    const dayTasks = tasksByDay[day.id] || [];
                    const completedCount = dayTasks.filter(t => t.completed).length;
                    const totalCount = dayTasks.length;
                    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                    const isExpanded = expandedDay === day.id;

                    return (
                        <div 
                            key={day.id} 
                            ref={isToday ? todayRef : null}
                            className={`
                                border rounded-none overflow-hidden transition-all duration-300 relative
                                ${isPast 
                                    ? 'bg-game-surface/40 border-game-primary-dim/20 opacity-70 grayscale-[0.5]' 
                                    : isRestDay 
                                        ? 'bg-gradient-to-br from-green-900/20 to-game-bg border-green-900/50' 
                                        : isToday
                                            ? 'bg-game-surface border-game-primary shadow-[0_0_15px_rgba(var(--color-primary),0.15)]'
                                            : 'bg-game-surface/80 border-game-primary/20 hover:border-game-primary/40'}
                            `}
                        >
                            {/* Header Card */}
                            <div 
                                onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                                className="p-4 flex items-center justify-between cursor-pointer active:bg-white/5 relative z-10"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Day Icon / Progress */}
                                    <div className="relative w-12 h-12 flex items-center justify-center">
                                        {isPast ? (
                                            <div className="bg-game-surface p-2 rounded-full border border-game-primary-dim/30">
                                                <Lock size={18} className="text-game-primary-dim/50" />
                                            </div>
                                        ) : isRestDay ? (
                                            <Coffee className="text-green-500" size={24} />
                                        ) : (
                                            <CircularProgress 
                                                size={48} 
                                                strokeWidth={4} 
                                                percentage={progress} 
                                                color={progress === 100 ? 'text-game-primary' : 'text-game-primary-dim/50'}
                                            >
                                                <span className={`text-[10px] font-bold ${progress === 100 ? 'text-game-primary' : 'text-game-primary-dim/50'}`}>
                                                    {Math.round(progress)}%
                                                </span>
                                            </CircularProgress>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <h3 className={`font-black text-lg flex items-center gap-2 ${isPast ? 'text-game-text-muted' : isRestDay ? 'text-green-500' : 'text-game-text'}`}>
                                            {day.label}
                                            {isToday && <span className="text-[9px] bg-game-primary text-game-text px-2 py-0.5 rounded-none border border-game-primary-dim uppercase tracking-wider shadow-[0_0_10px_rgba(var(--color-primary),0.5)]">{t('today')}</span>}
                                        </h3>
                                        <p className="text-xs text-game-text-muted font-mono mt-0.5">
                                            {isPast 
                                                ? t('dayLocked') || "LOCKED" 
                                                : isRestDay 
                                                    ? t('restDay') 
                                                    : `${completedCount} / ${totalCount} ${t('completedTasks')}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Expand Icon */}
                                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} text-game-primary/50`}>
                                    ▼
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-4 pt-0 border-t border-game-primary/20 bg-game-surface/30">
                                    
                                    {isRestDay && !isPast ? (
                                        <div className="py-8 text-center text-green-500/80">
                                            <div className="inline-block p-3 rounded-full bg-green-500/10 border border-green-500/30 mb-3">
                                                <Coffee size={24} className="text-green-400" />
                                            </div>
                                            <p className="text-sm font-bold tracking-wide">{t('enjoyDay')}</p>
                                        </div>
                                    ) : (
                                        <>
                                            {dayTasks.length === 0 ? (
                                                <div className="py-8 text-center">
                                                    <p className="text-game-text-muted text-sm mb-4 font-mono">
                                                        {isPast ? (t('noTasksHistory') || "NO QUESTS FOUND") : t('noScheduledTasks')}
                                                    </p>
                                                    {!isPast && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleAddClick(index, day.id); }}
                                                            className="text-game-primary text-xs font-bold border border-game-primary/30 px-4 py-2 rounded-none hover:bg-game-primary/10 transition-colors uppercase tracking-wider"
                                                        >
                                                            + {t('addTaskFor')} {day.label}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3 mt-4">
                                                    {dayTasks.map(task => (
                                                        <TaskItem 
                                                            key={task.id}
                                                            task={task}
                                                            onComplete={completeTask}
                                                            onDelete={deleteTask}
                                                            onEdit={isPast ? undefined : onEditTask} // Disable editing for past days
                                                            canAfford={stats.energy >= task.energyCost}
                                                        />
                                                    ))}
                                                    {!isPast && (
                                                        <button 
                                                            onClick={() => handleAddClick(index, day.id)}
                                                            className="w-full py-3 border border-dashed border-game-primary/30 rounded-none text-game-primary/50 text-sm font-bold hover:text-game-primary hover:border-game-primary/50 hover:bg-game-primary/5 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                                                        >
                                                            <Plus size={16} /> {t('addMore')}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
