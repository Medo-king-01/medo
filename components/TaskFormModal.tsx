
import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Zap, Trophy, Target, Calendar, Scroll, CheckCircle2, LayoutGrid, Clock, BarChart3, Lock, Heart, PersonStanding, Flame } from 'lucide-react';
import { PillarType, Task, DayOfWeek, TaskDifficulty, ExerciseCategory, ExerciseLevel } from '../types';
import { PILLARS, EXERCISE_DB, EXERCISE_PRESETS, DAYS_OF_WEEK, PILLAR_BASE_RATES, DIFFICULTY_CONFIG, ENERGY_PER_QURAN_PAGE } from '../constants';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { AudioService } from '../services/audioService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => void;
  initialData?: Task | null;
  defaultPillar?: PillarType;
  defaultDay?: DayOfWeek;
}

export const TaskFormModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData, defaultPillar, defaultDay }) => {
  const { tasks } = useGame();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pillar, setPillar] = useState<PillarType>('Learning');
  const [day, setDay] = useState<DayOfWeek>('Saturday');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('2'); // Default D-Rank equivalent
  const [dueDate, setDueDate] = useState('');
  const [pages, setPages] = useState<number>(1); // For Quran
  
  // New: Boss Task
  const [isBoss, setIsBoss] = useState(false);
  const [targetEnergy, setTargetEnergy] = useState<number>(100);
  const [prerequisiteTaskId, setPrerequisiteTaskId] = useState<string | undefined>(undefined);

  // Exercise Specific States
  const [exerciseCategory, setExerciseCategory] = useState<ExerciseCategory>('Cardio');
  const [exerciseLevel, setExerciseLevel] = useState<ExerciseLevel>('Beginner');

  const { t, soundEnabled } = useSettings();
  const { addToast } = useToast();

  // Calculate Today's App Index (0 = Saturday, ... 6 = Friday)
  const todayIndex = (new Date().getDay() + 1) % 7;

  // Dynamic Calculation
  const baseRates = PILLAR_BASE_RATES[pillar];
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;
  
  // Calculate final costs
  const calculatedEnergy = pillar === 'Quran' 
    ? -(pages * ENERGY_PER_QURAN_PAGE) 
    : Math.ceil(baseRates.energy * multiplier);

  const calculatedXp = isBoss 
    ? Math.ceil(baseRates.xp * multiplier * (targetEnergy / Math.ceil(baseRates.energy * multiplier)) * 1.5)
    : Math.ceil(baseRates.xp * multiplier);

  // Get current real day for visual comparison
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];

  useEffect(() => {
    if (isOpen) {
      if(soundEnabled) AudioService.playPop();

      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setPillar(initialData.pillar);
        setDay(initialData.day || 'Saturday');
        setDifficulty(initialData.difficulty || '2');
        setDueDate(initialData.dueDate || '');
        setPages(initialData.pages || 1);
        setIsBoss(initialData.isBoss || false);
        setTargetEnergy(initialData.targetEnergy || 100);
        setPrerequisiteTaskId(initialData.prerequisiteTaskId);
      } else {
        setTitle('');
        setDescription('');
        setPillar(defaultPillar || 'Learning');
        // If defaultDay is provided and it's in the past relative to today (App Index), default to Today instead
        const defaultDayIndex = DAYS_OF_WEEK.findIndex(d => d.id === defaultDay);
        // Ensure strictly future or current days when adding from Planner
        const effectiveDay = (defaultDay && defaultDayIndex >= todayIndex) ? defaultDay : todayName;
        
        setDay(effectiveDay);
        setDifficulty('2');
        setDueDate('');
        setPages(1);
        setIsBoss(false);
        setTargetEnergy(100);
        setPrerequisiteTaskId(undefined);
        
        // Reset Exercise Defaults
        setExerciseCategory('Cardio');
        setExerciseLevel('Beginner');
      }
    }
  }, [isOpen, initialData, defaultPillar, defaultDay, todayName, todayIndex, soundEnabled]);

  const handleExerciseSelect = (ex: typeof EXERCISE_DB[0]) => {
    if(soundEnabled) AudioService.playClick();
    
    const preset = EXERCISE_PRESETS[ex.category][exerciseLevel];
    // Need to use t() for units, but EXERCISE_DB has hardcoded 'Reps'/'Time'. Mapping here:
    const unitLabel = ex.unit === 'Time' ? t('unitSec') : t('unitReps');
    
    setTitle(`${ex.nameEn} / ${ex.nameAr}`);
    setPillar('Exercise');
    
    // Auto-generate detailed description
    const desc = `${exerciseLevel} Level:\n• ${preset.sets} ${t('sets')}\n• ${preset.value} ${unitLabel} per Set\n• ${preset.rest} ${t('unitSec')} Rest`;
    setDescription(desc);
    
    // Auto-set system difficulty based on preset rank
    setDifficulty(preset.rank);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(soundEnabled) AudioService.playClick();
    
    // For Quran, title can be auto-generated if empty
    let finalTitle = title;
    if (pillar === 'Quran' && !finalTitle.trim()) {
        finalTitle = `${t('quran')} - ${pages} ${t('pagesToRead')}`;
    }

    if (!finalTitle.trim()) return;
    
    if (day === 'Friday' && pillar !== 'Quran') {
        addToast(t('fridayRestWarning'), 'error');
        if (soundEnabled) AudioService.playFailure();
        return;
    }

    onSubmit({
      title: finalTitle,
      description,
      pillar,
      day,
      difficulty,
      dueDate,
      pages: pillar === 'Quran' ? Number(pages) : undefined,
      isBoss,
      targetEnergy: isBoss ? Number(targetEnergy) : undefined,
      investedEnergy: initialData?.investedEnergy || 0, // Preserve invested energy if editing
      prerequisiteTaskId: prerequisiteTaskId === 'none' ? undefined : prerequisiteTaskId
    });
    onClose();
  };

  const handlePillarChange = (p: PillarType) => {
      if(soundEnabled) AudioService.playClick();
      setPillar(p);
      if (p === 'Quran') {
          setIsBoss(false);
      }
  }

  const handleDayChange = (d: DayOfWeek) => {
      if(soundEnabled) AudioService.playClick();
      setDay(d);
  }

  const handleDifficultyChange = (d: TaskDifficulty) => {
      if(soundEnabled) AudioService.playClick();
      setDifficulty(d);
  }

  // Filter exercises based on selected category
  const filteredExercises = EXERCISE_DB.filter(ex => ex.category === exerciseCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-game-bg/90 backdrop-blur-md sm:pb-0 sm:p-4 animate-fade-in">
      <div className="bg-game-surface border border-game-primary/50 w-full max-w-md rounded-none p-0 relative shadow-[0_0_30px_rgba(var(--color-primary),0.2)] max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-game-primary/30 bg-game-surface flex justify-between items-center sticky top-0 z-10 shrink-0">
             <h3 className="text-lg font-black text-game-text uppercase tracking-wider flex items-center gap-2">
                {initialData ? <><CheckCircle2 size={20} className="text-game-primary"/> {t('editTask')}</> : <><LayoutGrid size={20} className="text-game-primary"/> {t('newTask')}</>}
            </h3>
            <button onClick={onClose} className="p-2 bg-game-bg rounded-none text-game-text-muted hover:text-game-text hover:bg-game-primary/20 transition-colors border border-transparent hover:border-game-primary/50">
                <X size={20} />
            </button>
        </div>
        
        <div className="overflow-y-auto p-6 space-y-6 no-scrollbar flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Pillar Selector (Grid) */}
                <div>
                    <label className="text-[10px] text-game-text-muted font-bold uppercase tracking-widest mb-3 block">{t('selectPillar')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {PILLARS.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handlePillarChange(p.id)}
                                className={`
                                    flex flex-col items-center justify-center gap-1 p-2 rounded-none border-2 transition-all
                                    ${pillar === p.id 
                                        ? `bg-game-primary-dim/20 border-game-primary text-game-text shadow-[0_0_10px_rgba(var(--color-primary),0.2)]` 
                                        : 'bg-game-bg border-game-border text-game-text-muted hover:border-game-text-muted hover:bg-game-surface-highlight'}
                                `}
                            >
                                <p.icon size={20} className={pillar === p.id ? 'text-game-primary' : 'text-game-text-muted'} />
                                <span className="text-[10px] font-bold">{t(p.id.toLowerCase() as any)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Day Selector */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] text-game-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} /> {t('timing')}
                        </label>
                        <div className="flex items-center gap-1 text-[10px] text-game-primary font-bold animate-pulse">
                            <Clock size={10} />
                            <span>{t('today')}: {todayName}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {DAYS_OF_WEEK.map((d, index) => {
                            const isToday = d.id === todayName;
                            // Strict check using App Index logic (0=Sat)
                            const isPast = index < todayIndex;
                            const isDisabled = isPast || (d.id === 'Friday' && pillar !== 'Quran');

                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => !isDisabled && handleDayChange(d.id)}
                                    className={`
                                        relative flex items-center justify-center px-3 py-2 rounded-none text-[10px] font-bold border transition-all whitespace-nowrap
                                        ${isDisabled ? 'opacity-40 border-dashed border-game-border cursor-not-allowed bg-game-bg/50 text-game-text-muted' : ''}
                                        ${day === d.id 
                                            ? 'bg-game-primary text-game-text border-game-primary shadow-lg scale-105' 
                                            : !isDisabled && isToday ? 'bg-game-surface border-game-primary text-game-text' : 'bg-game-bg text-game-text-muted border-game-border hover:border-game-text-muted'}
                                    `}
                                    disabled={isDisabled}
                                >
                                    {isPast && <Lock size={8} className="absolute -top-1 -left-1 text-game-text-muted" />}
                                    {t(d.id.toLowerCase() as any) || d.label}
                                    {isToday && day !== d.id && !isDisabled && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-game-primary rounded-none" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Inputs Area */}
                <div className="bg-game-bg p-4 rounded-none border border-game-border space-y-4">
                    {pillar === 'Quran' ? (
                        <div className="bg-game-primary-dim/10 border border-game-primary/30 p-4 rounded-none text-center">
                            <label className="block text-xs text-game-primary mb-3 font-bold flex items-center justify-center gap-2">
                                <Scroll size={16} /> {t('pagesToRead')}
                            </label>
                            <div className="flex items-center justify-center gap-4">
                                <button type="button" onClick={() => setPages(p => Math.max(1, p - 1))} className="w-10 h-10 rounded-none bg-game-surface hover:bg-game-surface-highlight text-game-text font-bold text-xl transition-colors border border-game-border">-</button>
                                <span className="text-3xl font-black text-game-text w-16 text-center">{pages}</span>
                                <button type="button" onClick={() => setPages(p => p + 1)} className="w-10 h-10 rounded-none bg-game-surface hover:bg-game-surface-highlight text-game-text font-bold text-xl transition-colors border border-game-border">+</button>
                            </div>
                            <p className="text-[10px] text-game-text-muted mt-3">{t('pageEnergy')}</p>
                        </div>
                    ) : pillar === 'Exercise' ? (
                        /* --- 🏋️‍♂️ EXERCISE SPECIALIZED UI --- */
                        <div className="space-y-4 animate-slide-up">
                            
                            {/* 1. Category Tabs */}
                            <div>
                                <label className="text-[10px] text-game-primary font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Target size={12} /> {t('workoutCategory')}
                                </label>
                                <div className="flex bg-game-bg rounded-none p-1 border border-game-border">
                                    {(['Cardio', 'Strength', 'Flexibility'] as ExerciseCategory[]).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setExerciseCategory(cat)}
                                            className={`flex-1 py-2 rounded-none text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${exerciseCategory === cat ? 'bg-game-surface-highlight text-game-text shadow border border-game-primary/30' : 'text-game-text-muted hover:text-game-text'}`}
                                        >
                                            {cat === 'Cardio' && <Heart size={12} />}
                                            {cat === 'Strength' && <Dumbbell size={12} />}
                                            {cat === 'Flexibility' && <PersonStanding size={12} />}
                                            {/* Translate Category Labels if needed, or leave as technical terms */}
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Difficulty Level */}
                            <div>
                                <label className="text-[10px] text-game-text-muted font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Flame size={12} /> {t('intensityLevel')}
                                </label>
                                <div className="flex gap-2">
                                    {(['Beginner', 'Intermediate', 'Advanced'] as ExerciseLevel[]).map(lvl => (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => setExerciseLevel(lvl)}
                                            className={`
                                                flex-1 py-2 px-2 rounded-none text-[10px] font-black uppercase border transition-all
                                                ${exerciseLevel === lvl 
                                                    ? (lvl === 'Beginner' ? 'bg-green-900/30 border-green-500 text-green-400' 
                                                      : lvl === 'Intermediate' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400' 
                                                      : 'bg-red-900/30 border-red-500 text-red-400')
                                                    : 'bg-game-bg border-game-border text-game-text-muted hover:border-game-text-muted'}
                                            `}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Exercise Selection Grid */}
                            <div>
                                <label className="text-[10px] text-game-text-muted font-bold mb-2 uppercase tracking-wide block">
                                    {t('selectExercise')}
                                </label>
                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {filteredExercises.map(ex => (
                                        <button
                                            key={ex.id}
                                            type="button"
                                            onClick={() => handleExerciseSelect(ex)}
                                            className="bg-game-surface border border-game-border hover:border-game-primary/50 hover:bg-game-primary/10 rounded-none p-3 flex justify-between items-center transition-all group text-left"
                                        >
                                            <div>
                                                <span className="block text-xs text-game-text font-bold">{ex.nameEn}</span>
                                                <span className="block text-[10px] text-game-text-muted font-cairo">{ex.nameAr}</span>
                                            </div>
                                            <div className="bg-game-bg text-[9px] text-game-text-muted px-2 py-1 rounded-none font-mono border border-game-border">
                                                {ex.unit}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auto-Filled Details Preview */}
                            <div className="bg-game-bg/60 p-3 rounded-none border border-game-border flex flex-col gap-2">
                                <div>
                                    <label className="text-[9px] text-game-text-muted font-bold uppercase">{t('autoTitle')}</label>
                                    <input 
                                        type="text" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        className="w-full bg-transparent border-b border-game-border text-sm font-bold text-game-text py-1 outline-none focus:border-game-primary"
                                        placeholder={t('selectExercisePlaceholder')}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-game-text-muted font-bold uppercase">{t('planDetails')}</label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-transparent text-xs text-game-text-muted font-mono h-16 outline-none resize-none"
                                        placeholder={t('planDetailsPlaceholder')}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* --- STANDARD UI FOR OTHER PILLARS --- */
                        <>
                            <div>
                                <label className="block text-[10px] text-game-text-muted font-bold mb-1 uppercase">{t('taskTitle')}</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-game-bg border border-game-border rounded-none p-4 text-game-text placeholder:text-game-text-muted focus:border-game-primary focus:ring-1 focus:ring-game-primary outline-none transition-all font-bold"
                                    placeholder={t('taskPlaceholder')}
                                />
                            </div>

                            {/* Difficulty Selector */}
                            <div>
                                <label className="text-[10px] text-game-text-muted font-bold mb-2 uppercase flex items-center gap-2">
                                    <BarChart3 size={12} /> {t('difficultyLevel')}
                                </label>
                                <div className="grid grid-cols-5 gap-1">
                                    {(Object.keys(DIFFICULTY_CONFIG) as TaskDifficulty[]).map(key => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handleDifficultyChange(key)}
                                            className={`
                                                flex flex-col items-center justify-center py-2 rounded-none border transition-all
                                                ${difficulty === key 
                                                    ? `bg-game-surface border-game-text text-game-text` 
                                                    : 'bg-game-bg border-game-border text-game-text-muted hover:border-game-text-muted'}
                                            `}
                                        >
                                            <span className={`text-xs font-black ${DIFFICULTY_CONFIG[key].color}`}>{key}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center mt-2 text-[10px] text-game-text-muted font-mono uppercase">
                                    {t(`difficultyLevel${difficulty}` as any) || DIFFICULTY_CONFIG[difficulty].label} • x{DIFFICULTY_CONFIG[difficulty].multiplier} {t('rewards' as any)}
                                </div>
                            </div>

                            {/* Boss Task Toggle */}
                            {pillar !== 'Quran' && (
                                <div className="bg-game-surface-highlight p-3 border border-game-primary/30 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] text-game-primary font-bold uppercase flex items-center gap-2">
                                            <Flame size={14} className={isBoss ? 'text-red-500 animate-pulse' : ''} />
                                            {t('milestoneBossTask' as any)}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsBoss(!isBoss)}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${isBoss ? 'bg-red-500' : 'bg-game-border'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isBoss ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    
                                    {isBoss && (
                                        <div className="animate-slide-down">
                                            <label className="block text-[10px] text-game-text-muted font-bold mb-1 uppercase">{t('targetEnergyToDefeat' as any)}</label>
                                            <input 
                                                type="number" 
                                                min="10"
                                                step="10"
                                                value={targetEnergy}
                                                onChange={(e) => setTargetEnergy(Number(e.target.value))}
                                                className="w-full bg-game-bg border border-red-500/50 rounded-none p-3 text-red-400 placeholder:text-game-text-muted focus:border-red-500 outline-none transition-all font-bold font-mono"
                                            />
                                            <p className="text-[9px] text-game-text-muted mt-2 font-mono">
                                                {t('bossTaskDesc' as any)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Dependency Chain Selector */}
                            <div>
                                <label className="block text-[10px] text-game-text-muted font-bold mb-1 uppercase">{t('prerequisiteTaskOptional')}</label>
                                <select
                                    value={prerequisiteTaskId || 'none'}
                                    onChange={(e) => setPrerequisiteTaskId(e.target.value)}
                                    className="w-full bg-game-bg border border-game-border rounded-none p-3 text-game-text focus:border-game-primary outline-none transition-all font-bold text-xs"
                                >
                                    <option value="none">{t('none')}</option>
                                    {tasks.filter(t => t.id !== initialData?.id && !t.completed && !t.isMissed).map(t => (
                                        <option key={t.id} value={t.id}>{t.title} ({t.pillar})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] text-game-text-muted font-bold mb-1 uppercase">{t('additionalNotes')}</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-game-bg border border-game-border rounded-none p-3 text-game-text placeholder:text-game-text-muted focus:border-game-primary outline-none h-20 text-sm resize-none"
                                    placeholder={t('detailsPlaceholder')}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Stats Preview */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-game-bg p-3 rounded-none border border-game-border flex items-center gap-3">
                        <div className="bg-game-primary-dim/20 p-2 rounded-none text-game-primary"><Zap size={18} /></div>
                        <div>
                            <p className="text-[10px] text-game-text-muted font-bold uppercase">{t('energy')}</p>
                            <p className={`text-lg font-black ${calculatedEnergy < 0 ? 'text-green-500' : 'text-game-text'}`}>
                                {calculatedEnergy > 0 ? `-${calculatedEnergy}` : `+${Math.abs(calculatedEnergy)}`}
                            </p>
                        </div>
                    </div>
                    {pillar !== 'Quran' && (
                        <div className="flex-1 bg-game-bg p-3 rounded-none border border-game-border flex items-center gap-3">
                            <div className="bg-game-primary-dim/20 p-2 rounded-none text-game-primary"><Trophy size={18} /></div>
                            <div>
                                <p className="text-[10px] text-game-text-muted font-bold uppercase">{t('energyReward')}</p>
                                <p className="text-lg font-black text-game-text">{calculatedXp} XP</p>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={day === 'Friday' && pillar !== 'Quran'}
                    className={`
                        w-full font-black py-4 rounded-none transition-all shadow-lg flex items-center justify-center gap-2 shrink-0
                        ${day === 'Friday' && pillar !== 'Quran' 
                            ? 'bg-game-surface text-game-text-muted cursor-not-allowed border border-game-border' 
                            : 'bg-game-primary text-game-text hover:bg-game-primary/90 hover:scale-[1.02] active:scale-[0.98] border border-game-primary'}
                    `}
                >
                    {initialData ? t('saveChanges') : t('addToSchedule')}
                </button>

            </form>
        </div>
      </div>
    </div>
  );
};
