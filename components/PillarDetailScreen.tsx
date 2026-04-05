
import React from 'react';
import { PillarType, Task } from '../types';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { PillWidget } from './PillWidget';
import { TaskItem } from './TaskItem';
import { ArrowRight, Plus, ClipboardList } from 'lucide-react';

interface Props {
  pillarId: PillarType;
  onBack: () => void;
  onAddTask: () => void;
  onEditTask?: (task: Task) => void;
  customHeader?: React.ReactNode; 
}

export const PillarDetailScreen: React.FC<Props> = ({ pillarId, onBack, onAddTask, onEditTask, customHeader }) => {
  const { tasks, completeTask, deleteTask, stats } = useGame();
  const { t } = useSettings();
  
  const pillarTasks = tasks.filter(t => t.pillar === pillarId);
  const activeTasks = pillarTasks.filter(t => !t.completed);
  const completedTasks = pillarTasks.filter(t => t.completed);

  // Sorting: Newest first
  activeTasks.sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col h-full bg-game-bg text-game-text animate-fade-in absolute inset-0 z-30">
      
      {/* Header Area */}
      <div className="relative shadow-2xl z-10">
        <button 
            onClick={onBack}
            className="absolute top-6 left-4 z-20 p-2 bg-game-surface/80 backdrop-blur-md rounded-none text-game-text border border-game-border hover:bg-game-surface active:scale-90 transition-all shadow-[0_0_10px_rgba(var(--color-primary),0.2)]"
        >
            <ArrowRight size={20} />
        </button>
        <PillWidget pillarId={pillarId} taskCount={activeTasks.length} variant="header" />
      </div>

      {/* Task List Container */}
      <div className="flex-1 overflow-y-auto pb-28 pt-4 px-4 no-scrollbar relative">
        
        {/* Background Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-game-primary/5 rounded-none blur-[100px]"></div>
        </div>

        <div className="relative z-10">
            {/* Custom Header Injection (Daily Quest) */}
            {customHeader && <div className="mb-4 animate-slide-up">{customHeader}</div>}

            <div className="space-y-4">
                {activeTasks.length === 0 && completedTasks.length === 0 && !customHeader && (
                    <div className="flex flex-col items-center justify-center h-64 text-game-text-muted opacity-80 animate-fade-in">
                        <div className="w-20 h-20 bg-game-surface rounded-none flex items-center justify-center mb-4 border border-game-border shadow-[0_0_20px_rgba(var(--color-primary),0.1)]">
                            <ClipboardList size={32} className="text-game-primary/50" />
                        </div>
                        <p className="font-bold tracking-wide uppercase">{t('noTasks')}</p>
                        <p className="text-xs mt-2 font-mono">{t('pillarQuiet')}</p>
                    </div>
                )}

                {/* Active Tasks */}
                <div className="space-y-3">
                    {activeTasks.map((task, index) => (
                        <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                            <TaskItem 
                                task={task}
                                onComplete={completeTask}
                                onDelete={deleteTask}
                                onEdit={onEditTask}
                                canAfford={stats.energy >= task.energyCost}
                            />
                        </div>
                    ))}
                </div>

                {/* Completed Tasks Header */}
                {completedTasks.length > 0 && (
                    <div className="pt-8 mt-4 border-t border-dashed border-game-border/50">
                        <h4 className="text-[10px] font-black text-game-text-muted mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span>{t('completedArchive')}</span>
                            <span className="bg-game-surface border border-game-border text-game-text-muted px-2 py-0.5 rounded-none">{completedTasks.length}</span>
                        </h4>
                        <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity duration-500">
                            {completedTasks.map(task => (
                                <TaskItem 
                                    key={task.id}
                                    task={task}
                                    onComplete={completeTask}
                                    onDelete={deleteTask}
                                    canAfford={true}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* FAB to Add Task - Safe Area Aware */}
      <button 
        onClick={onAddTask}
        className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-6 w-14 h-14 bg-game-primary text-white rounded-none shadow-[0_0_30px_rgba(var(--color-primary),0.4)] hover:scale-110 active:scale-90 transition-all z-40 flex items-center justify-center border border-game-surface"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  );
};
