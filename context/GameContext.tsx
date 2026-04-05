
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { GameState, Task, UserStats, PlayerProfile, WeeklyHistory, MonthlyHistory, WeeklyReport, MonthlyReport, WeeklyReward, MonthlyReward, DailyQuestProgress, BASE_XP_PER_LEVEL, DayOfWeek, PILLAR_TO_ATTRIBUTE_MAP, Achievement, PillarType } from '../types';
import { ENERGY_RECOVERY_RATE, PILLAR_BASE_RATES, DIFFICULTY_CONFIG, XP_SCALING_FACTOR, DAILY_QUEST_TARGETS, ENERGY_PER_QURAN_PAGE, DAYS_OF_WEEK, XP_PENALTY_RATIO, MAX_DAILY_XP_LOSS_PERCENT, CRITICAL_HIT_CHANCE, CRITICAL_HIT_MULTIPLIER, FATIGUE_THRESHOLD, FATIGUE_XP_MULTIPLIER, FATIGUE_ENERGY_MULTIPLIER, ATROPHY_DAYS_THRESHOLD, ATROPHY_PENALTY, DEFAULT_ACHIEVEMENTS, RANK_THRESHOLDS, RANK_RESISTANCE_MULTIPLIER } from '../constants';
import { StorageService, defaultStats } from '../services/storage';
import { HistoryEngine } from '../services/historyEngine';
import { useToast } from './ToastContext';
import { useSettings } from '../context/SettingsContext';
import { AudioService } from '../services/audioService';
import { TranslationKey } from '../utils/translations';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface GameContextType extends GameState {
  isLoaded: boolean; // Add this to interface
  createProfile: (profileData: Omit<PlayerProfile, 'createdAt'>) => void;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  addTask: (task: Partial<Task>) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  investInBossTask: (id: string, energyAmount: number) => void;
  reorderTasks: (reorderedTasks: Task[]) => void;
  moveTask: (taskId: string, direction: 'up' | 'down') => void;
  resetProgress: () => void;
  setWeeklyChallenge: (title: string) => void;
  completeWeeklyChallenge: () => void;
  updateDailyQuest: (type: keyof Omit<DailyQuestProgress, 'isCompleted' | 'lastResetDate'>, amount: number) => void;
  showLevelUpModal: boolean;
  closeLevelUpModal: () => void;
  importSaveData: (jsonData: string) => boolean;
  exportSaveData: () => string;
  upgradeSkill: (skillId: string) => void;
  useItem: (itemId: 'ENERGY_POTION' | 'STREAK_SHIELD' | 'XP_BOOSTER') => void;
  awaken: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// --- 🛠️ CORE TIME ENGINE UTILITIES ---

/**
 * Gets the local date string "YYYY-MM-DD" ensuring local timezone is respected.
 * Avoids UTC issues with toISOString().
 */
const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns the App-specific day index (0 = Saturday, 1 = Sunday, ... 6 = Friday).
 * Standard JS getDay() returns 0 for Sunday, 6 for Saturday.
 * Formula: (jsDay + 1) % 7 -> Converts Sat(6) to 0, Sun(0) to 1, Fri(5) to 6.
 */
const getAppDayIndex = (date: Date = new Date()): number => {
    return (date.getDay() + 1) % 7;
};

/**
 * Returns the date of the most recent Saturday (Start of App Week).
 * This ensures strict alignment of week cycles.
 */
const getStartOfCurrentWeek = (date: Date = new Date()): string => {
    const appDayIndex = getAppDayIndex(date); // How many days passed since Saturday
    const satDate = new Date(date);
    satDate.setDate(date.getDate() - appDayIndex);
    return getLocalDateString(satDate);
};

// Helper for safe UUID
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Time Modifier Function
const getTimeModifier = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return { xp: 1.15, energy: 0.85 }; // Morning Bonus
    if (hour >= 22 || hour < 4) return { xp: 0.85, energy: 1.15 }; // Night Penalty
    return { xp: 1, energy: 1 };
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const statsRef = useRef<UserStats>(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  
  // History State
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistory[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistory[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [weeklyRewards, setWeeklyRewards] = useState<WeeklyReward[]>([]);
  const [monthlyRewards, setMonthlyRewards] = useState<MonthlyReward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const { addToast } = useToast();
  const { soundEnabled, hapticsEnabled, t } = useSettings();

  const isSaving = useRef(false);

  // Helper for Sound/Haptics
  const triggerFeedback = useCallback(async (type: 'success' | 'hard-success' | 'error' | 'levelup' | 'click' | 'boost' | 'mystery' | 'failure') => {
      if (hapticsEnabled) {
          if (Capacitor.isNativePlatform()) {
              try {
                  if (type === 'success') await Haptics.impact({ style: ImpactStyle.Light });
                  if (type === 'hard-success') await Haptics.impact({ style: ImpactStyle.Heavy });
                  if (type === 'error') await Haptics.vibrate({ duration: 150 });
                  if (type === 'levelup') {
                      await Haptics.impact({ style: ImpactStyle.Heavy });
                      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 100);
                      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 200);
                  }
                  if (type === 'click') await Haptics.impact({ style: ImpactStyle.Light });
                  if (type === 'failure') await Haptics.vibrate({ duration: 500 });
              } catch (e) {
                  console.warn('Haptics failed', e);
              }
          } else if (navigator.vibrate) {
              if (type === 'success') navigator.vibrate(50);
              if (type === 'hard-success') navigator.vibrate([100, 50, 100]);
              if (type === 'error') navigator.vibrate([50, 50, 50]);
              if (type === 'levelup') navigator.vibrate([100, 50, 100, 50, 200]);
              if (type === 'click') navigator.vibrate(10);
              if (type === 'failure') navigator.vibrate([500, 200]);
          }
      }
      
      if (soundEnabled) {
          if (type === 'success') AudioService.playTaskComplete();
          if (type === 'hard-success') AudioService.playHardTaskComplete();
          if (type === 'error') AudioService.playEnergyWarning();
          if (type === 'click') AudioService.playClick(); 
          if (type === 'boost') AudioService.playXpGain();
          if (type === 'mystery') AudioService.playMysteryReveal();
          if (type === 'failure') AudioService.playFailure();
      }
  }, [soundEnabled, hapticsEnabled]);

  // --- 1. INITIAL LOAD & TIME TRAVEL ENGINE ---
  useEffect(() => {
    StorageService.init();

    const loadedProfile = StorageService.loadProfile();
    const loadedStats = StorageService.loadStats();
    const loadedTasks = StorageService.loadTasks();
    
    // Load History
    setWeeklyHistory(StorageService.loadWeeklyHistory());
    setMonthlyHistory(StorageService.loadMonthlyHistory());
    setWeeklyReports(StorageService.loadWeeklyReports());
    setMonthlyReports(StorageService.loadMonthlyReports());
    setWeeklyRewards(StorageService.loadWeeklyRewards());
    setMonthlyRewards(StorageService.loadMonthlyRewards());
    
    const loadedAchievements = StorageService.loadAchievements();
    if (loadedAchievements && loadedAchievements.length > 0) {
      setAchievements(loadedAchievements);
    } else {
      setAchievements(DEFAULT_ACHIEVEMENTS);
    }

    if (loadedProfile) setPlayerProfile(loadedProfile);
    if (loadedTasks) setTasks(loadedTasks);
    
    if (loadedStats) {
        let currentStats = { ...loadedStats };
        const todayStr = getLocalDateString(); // Normalized YYYY-MM-DD
        const nowMs = Date.now();
        const isNewDay = currentStats.lastLoginDate !== todayStr;

        // 🛠️ TIME FIX: Ensure currentWeekStart is strictly aligned to a Saturday
        const calculatedWeekStart = getStartOfCurrentWeek();
        
        // If the saved week start doesn't match the calculated Saturday, user might have traveled
        // or the initial account creation wasn't on a Saturday. We soft-correct it if it's the same week,
        // or let the time skip logic handle it if it's a new week.
        if (!currentStats.currentWeekStart) {
             currentStats.currentWeekStart = calculatedWeekStart;
        }

        // --- MISSED TASK LOGIC (Robust Index Comparison) ---
        let updatedTasks = loadedTasks ? [...loadedTasks] : [];
        let missedCount = 0;
        let totalXpPenalty = 0;

        // Map Day Names to App Index (0=Saturday ... 6=Friday)
        const dayNameIndices: Record<string, number> = { 
            'Saturday': 0, 'Sunday': 1, 'Monday': 2, 'Tuesday': 3, 
            'Wednesday': 4, 'Thursday': 5, 'Friday': 6 
        };
        
        const currentAppDayIdx = getAppDayIndex(); // Today's Index (0-6)

        // Check if we are in a completely new week relative to saved data
        const [sy, sm, sd] = currentStats.currentWeekStart.split('-').map(Number);
        const savedWeekStartObj = new Date(sy, sm - 1, sd);
        const todayLocalObj = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        const diffTime = todayLocalObj.getTime() - savedWeekStartObj.getTime();
        const daysSinceWeekStart = Math.round(diffTime / (1000 * 3600 * 24));
        
        // Strict Week Cycle Check (>= 7 days ensures we passed the full week cycle)
        const isNewWeekCycle = daysSinceWeekStart >= 7;

        updatedTasks = updatedTasks.map(t => {
            if (!t.completed && !t.isMissed && t.day) {
                const taskDayIdx = dayNameIndices[t.day];
                let isFailure = false;

                if (isNewWeekCycle) {
                    // New week started -> All uncompleted tasks from previous week are failures
                    isFailure = true;
                } else {
                    // Same week -> Check if day has passed
                    // Example: Today is Monday (2). Task is Sunday (1). 1 < 2 => Failure.
                    if (taskDayIdx < currentAppDayIdx) {
                        isFailure = true;
                    }
                }

                if (isFailure) {
                    missedCount++;
                    const penalty = Math.ceil(t.xpReward * XP_PENALTY_RATIO);
                    totalXpPenalty += penalty;
                    return { ...t, isMissed: true };
                }
            }
            return t;
        });

        // Apply Penalties
        if (missedCount > 0) {
            const maxLoss = Math.floor(currentStats.currentXp * MAX_DAILY_XP_LOSS_PERCENT);
            const actualXpLoss = Math.min(totalXpPenalty, maxLoss);
            
            currentStats.currentXp = Math.max(0, currentStats.currentXp - actualXpLoss);
            currentStats.weeklyMissedTasks = (currentStats.weeklyMissedTasks || 0) + missedCount;
            currentStats.weeklyXpLost = (currentStats.weeklyXpLost || 0) + actualXpLoss;

            setTimeout(() => {
                addToast(t('missedTasksWarning' as any).replace('{{count}}', missedCount.toString()).replace('{{xp}}', actualXpLoss.toString()), 'error');
                triggerFeedback('failure');
            }, 2000);
            
            setTasks(updatedTasks);
        }

        // --- ENERGY RECOVERY & DAILY RESETS ---
        let targetEnergy = currentStats.energy;
        if (isNewDay) {
            // Reset daily pillar count
            currentStats.dailyPillarCount = {
                Learning: 0, Studying: 0, Exercise: 0, Work: 0, Entertainment: 0, Quran: 0
            };
            
            // Apply Atrophy
            const currentLastActivity = currentStats.lastPillarActivity || defaultStats.lastPillarActivity;
            let atrophyApplied = false;
            
            Object.keys(currentLastActivity).forEach(pillar => {
                const p = pillar as PillarType;
                const lastDateStr = currentLastActivity[p] || todayStr;
                const [ly, lm, ld] = lastDateStr.split('-').map(Number);
                const lastDateObj = new Date(ly, lm - 1, ld);
                const diffTime = todayLocalObj.getTime() - lastDateObj.getTime();
                const daysSinceActivity = Math.round(diffTime / (1000 * 3600 * 24));
                
                if (daysSinceActivity >= ATROPHY_DAYS_THRESHOLD) {
                    const attr = PILLAR_TO_ATTRIBUTE_MAP[p];
                    if (attr && currentStats.hunterAttributes[attr] > 1) {
                        currentStats.hunterAttributes[attr] = Math.max(1, currentStats.hunterAttributes[attr] - ATROPHY_PENALTY);
                        atrophyApplied = true;
                    }
                }
            });
            
            if (atrophyApplied) {
                setTimeout(() => {
                    addToast(t('atrophyWarning' as any), 'error');
                }, 3000);
            }

            const partialRecovery = Math.floor(currentStats.maxEnergy * 0.5); // 50% recovery at midnight
            const actualRecovered = Math.min(currentStats.maxEnergy - currentStats.energy, partialRecovery);
            if (actualRecovered > 0) {
                currentStats.weeklyEnergyRecovered = (currentStats.weeklyEnergyRecovered || 0) + actualRecovered;
                currentStats.energy += actualRecovered;
            }
            targetEnergy = currentStats.energy; // Partial Reset
            currentStats.lastEnergyUpdate = nowMs;
        } else {
            // No intraday recovery, energy only resets partially at midnight
            // or through specific tasks (Quran, Leisure, Hidden Recovery)
            currentStats.lastEnergyUpdate = nowMs;
            targetEnergy = currentStats.energy;
        }

        // --- DAILY QUEST RESET & STREAK ---
        if (currentStats.dailyQuest?.lastResetDate !== todayStr) {
             const lastTaskDateStr = currentStats.lastTaskCompletionDate || '1970-01-01';
             
             // Calculate yesterday safely using date subtraction
             const yesterdayObj = new Date();
             yesterdayObj.setDate(yesterdayObj.getDate() - 1);
             const yesterdayStr = getLocalDateString(yesterdayObj);

             // Streak Logic: If last completion wasn't today OR yesterday, streak breaks.
             if (lastTaskDateStr !== todayStr && lastTaskDateStr !== yesterdayStr) {
                 if (currentStats.streak > 0) {
                    setTimeout(() => {
                        addToast(t('streakBroken' as any), "error");
                    }, 0);
                    currentStats.streak = 0;
                 }
             }

             currentStats.dailyQuest = {
                pushups: 0, situps: 0, squats: 0, run: 0,
                isCompleted: false,
                lastResetDate: todayStr
            };
        }
        currentStats.lastLoginDate = todayStr;

        // --- PROCESS WEEKLY/MONTHLY TRANSITIONS ---
        // Pass the calculatedWeekStart to force alignment if a new week begins
        const processed = HistoryEngine.processTimeSkip(
            currentStats,
            updatedTasks,
            StorageService.loadWeeklyHistory(), // Pass fresh loaded data
            StorageService.loadMonthlyHistory(),
            StorageService.loadWeeklyReports(),
            StorageService.loadMonthlyReports(),
            StorageService.loadWeeklyRewards(),
            StorageService.loadMonthlyRewards(),
            calculatedWeekStart
        );

        if (processed.shouldResetTasks) {
            // New week started: Update week start date to the correct Saturday
            processed.stats.currentWeekStart = calculatedWeekStart; 
            setTasks(processed.tasks);
            setTimeout(() => {
                addToast(t('newWeekStarted' as any), 'info');
            }, 0);
            StorageService.saveTasks(processed.tasks);
        } else if (missedCount > 0) {
            setTasks(updatedTasks);
        }

        // Update History State if new reports generated
        if (processed.reportsGenerated > 0) {
            setTimeout(() => {
                addToast(t('reportsGenerated' as any).replace('{{count}}', processed.reportsGenerated.toString()), 'info');
                if(soundEnabled) AudioService.playMysteryReveal();
            }, 0);

            setWeeklyHistory(processed.weeklyHistory);
            setMonthlyHistory(processed.monthlyHistory);
            setWeeklyReports(processed.weeklyReports);
            setMonthlyReports(processed.monthlyReports);
            setWeeklyRewards(processed.weeklyRewards);
            setMonthlyRewards(processed.monthlyRewards);
            
            // Batch Save
            StorageService.saveWeeklyHistory(processed.weeklyHistory);
            StorageService.saveMonthlyHistory(processed.monthlyHistory);
            StorageService.saveWeeklyReports(processed.weeklyReports);
            StorageService.saveMonthlyReports(processed.monthlyReports);
            StorageService.saveWeeklyRewards(processed.weeklyRewards);
            StorageService.saveMonthlyRewards(processed.monthlyRewards);
        }

        setStats(processed.stats);
        
        if (isNewDay) {
            setTimeout(() => {
                setStats(prev => ({ ...prev, energy: targetEnergy }));
                if (soundEnabled) AudioService.playEnergyRestore();
                addToast(t('newDayRestored' as any), 'success');
            }, 800);
        }
    }

    setIsLoaded(true);
  }, []);


  // --- 2. GAME LOOP (HEARTBEAT) ---
  useEffect(() => {
    if (!isLoaded || !playerProfile) return;

    const tick = () => {
        setStats(prev => {
            const now = Date.now();
            let newEnergy = prev.energy;
            let lastUpdate = prev.lastEnergyUpdate;

            if (newEnergy < prev.maxEnergy) {
                const diffInHours = (now - lastUpdate) / (1000 * 60 * 60);
                const thresholdHours = 1 / ENERGY_RECOVERY_RATE; 

                if (diffInHours >= thresholdHours) {
                    const energyGained = Math.floor(diffInHours * ENERGY_RECOVERY_RATE);
                    newEnergy = Math.min(prev.maxEnergy, prev.energy + energyGained);
                    lastUpdate = lastUpdate + (energyGained / ENERGY_RECOVERY_RATE) * (1000 * 60 * 60); 
                    
                    if (soundEnabled) AudioService.playEnergyRestore();
                }
            } else {
                lastUpdate = now;
            }

            if (newEnergy === prev.energy && lastUpdate === prev.lastEnergyUpdate) {
                return prev;
            }

            return {
                ...prev,
                energy: newEnergy,
                lastEnergyUpdate: lastUpdate
            };
        });
    };

    // Optimization: Run tick every 60 seconds instead of 30.
    // Energy recovery is slow (8/hour), so strict 30s checks are unnecessary overhead.
    const interval = setInterval(tick, 60000); 
    return () => clearInterval(interval);
  }, [isLoaded, playerProfile, soundEnabled]);


  // --- 4. AUTO-SAVE SYSTEM ---
  useEffect(() => {
    if (isLoaded && playerProfile && !isSaving.current) {
        isSaving.current = true;
        const statsSaved = StorageService.saveStats(stats);
        const tasksSaved = StorageService.saveTasks(tasks);
        const achievementsSaved = StorageService.saveAchievements(achievements);
        
        if (!statsSaved || !tasksSaved || !achievementsSaved) {
            console.warn("Critical: Auto-save failed. Check storage quota.");
        }
        setTimeout(() => { isSaving.current = false; }, 100);
    }
  }, [stats, tasks, achievements, isLoaded, playerProfile]);


  // --- ACTIONS ---

  const createProfile = useCallback((data: Omit<PlayerProfile, 'createdAt'>) => {
    const newProfile: PlayerProfile = {
        ...data,
        createdAt: getLocalDateString()
    };
    StorageService.initializeNewAccount(newProfile);
    setPlayerProfile(newProfile);
    setStats({
        ...defaultStats,
        lastLoginDate: getLocalDateString(),
        currentWeekStart: getStartOfCurrentWeek() // Align to Saturday immediately
    });
    setTasks([]);
    triggerFeedback('success');
    addToast(t('welcomeJourney' as any), 'success');
  }, [addToast, triggerFeedback]);

  const updateProfile = useCallback((updates: Partial<PlayerProfile>) => {
    setPlayerProfile(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...updates };
        StorageService.saveProfile(updated);
        return updated;
    });
    addToast(t('profileUpdated' as any), 'success');
  }, [addToast]);

  const addTask = useCallback((taskData: Partial<Task>) => {
    setTasks(prev => {
        const maxOrder = prev.length > 0 ? Math.max(...prev.map(t => t.order)) : 0;
        const pillar = taskData.pillar || 'Work';
        const difficulty = taskData.difficulty || '3';
        
        const baseRates = PILLAR_BASE_RATES[pillar];
        const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;

        const baseEnergyCost = pillar === 'Quran' ? -(taskData.pages || 1) * ENERGY_PER_QURAN_PAGE : Math.ceil(baseRates.energy * multiplier);
        let baseXpReward = pillar === 'Quran' ? Math.ceil(5 * multiplier * (taskData.pages || 1)) : Math.ceil(baseRates.xp * multiplier);
        
        const isBoss = pillar === 'Quran' ? false : (taskData.isBoss || false);
        
        if (isBoss && taskData.targetEnergy) {
            const investmentRatio = taskData.targetEnergy / Math.ceil(baseRates.energy * multiplier);
            baseXpReward = Math.ceil(baseXpReward * investmentRatio * 1.5);
        }

        const newTask: Task = {
          id: generateId(),
          title: taskData.title || (pillar === 'Quran' ? t('quranReading' as any) : t('newTask' as any)),
          description: taskData.description || '',
          pillar: pillar,
          completed: false,
          difficulty: difficulty,
          energyCost: baseEnergyCost,
          xpReward: baseXpReward,
          dueDate: taskData.dueDate,
          day: taskData.day,
          createdAt: Date.now(),
          order: maxOrder + 1,
          pages: taskData.pages,
          isBoss: isBoss,
          targetEnergy: isBoss ? taskData.targetEnergy : undefined,
          investedEnergy: isBoss ? (taskData.investedEnergy || 0) : undefined
        };
        return [...prev, newTask];
    });
    triggerFeedback('click');
    addToast(t('taskAdded' as any), 'success');
  }, [addToast, triggerFeedback]);

  const editTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const pillar = updates.pillar || t.pillar;
      const difficulty = updates.difficulty || t.difficulty;
      const baseRates = PILLAR_BASE_RATES[pillar];
      const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;
      const pages = updates.pages !== undefined ? updates.pages : t.pages;
      const isBoss = pillar === 'Quran' ? false : (updates.isBoss !== undefined ? updates.isBoss : t.isBoss);
      const targetEnergy = isBoss ? (updates.targetEnergy !== undefined ? updates.targetEnergy : t.targetEnergy) : undefined;

      const baseEnergyCost = pillar === 'Quran' ? -(pages || 1) * ENERGY_PER_QURAN_PAGE : Math.ceil(baseRates.energy * multiplier);
      let baseXpReward = pillar === 'Quran' ? Math.ceil(5 * multiplier * (pages || 1)) : Math.ceil(baseRates.xp * multiplier);

      if (isBoss && targetEnergy) {
          const investmentRatio = targetEnergy / Math.ceil(baseRates.energy * multiplier);
          baseXpReward = Math.ceil(baseXpReward * investmentRatio * 1.5);
      }

      return { 
          ...t, 
          ...updates,
          isBoss,
          targetEnergy,
          investedEnergy: isBoss ? (updates.investedEnergy !== undefined ? updates.investedEnergy : t.investedEnergy) : undefined,
          energyCost: baseEnergyCost,
          xpReward: baseXpReward
      };
    }));
    addToast(t('taskEdited' as any), 'success');
  }, [addToast]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    addToast(t('taskDeleted' as any), 'info');
  }, [addToast]);

  const reorderTasks = useCallback((reorderedTasks: Task[]) => {
      setTasks(reorderedTasks);
  }, []);

  const moveTask = useCallback((taskId: string, direction: 'up' | 'down') => {
      setTasks(prevTasks => {
        const sortedTasks = [...prevTasks].sort((a, b) => a.order - b.order);
        const sortedIndex = sortedTasks.findIndex(t => t.id === taskId);
        if (sortedIndex === -1) return prevTasks;
        if (direction === 'up' && sortedIndex > 0) {
            const tempOrder = sortedTasks[sortedIndex].order;
            sortedTasks[sortedIndex].order = sortedTasks[sortedIndex - 1].order;
            sortedTasks[sortedIndex - 1].order = tempOrder;
        } else if (direction === 'down' && sortedIndex < sortedTasks.length - 1) {
            const tempOrder = sortedTasks[sortedIndex].order;
            sortedTasks[sortedIndex].order = sortedTasks[sortedIndex + 1].order;
            sortedTasks[sortedIndex + 1].order = tempOrder;
        }
        return [...sortedTasks];
      });
      triggerFeedback('click');
  }, [triggerFeedback]);

  const setWeeklyChallenge = useCallback((title: string) => {
    setStats(prev => ({
        ...prev,
        weeklyChallenge: {
            id: generateId(),
            title: title,
            weekStart: getLocalDateString(),
            completed: false
        }
    }));
    triggerFeedback('click');
    addToast(t('challengeSet' as any), 'info');
  }, [addToast, triggerFeedback]);

  const completeWeeklyChallenge = useCallback(() => {
    const prev = statsRef.current;
    if (!prev.weeklyChallenge || prev.weeklyChallenge.completed) return;
    
    const bonusXP = Math.floor(prev.maxXp * 0.25);
    
    let currentXp = prev.currentXp + bonusXP;
    let weeklyXpAccumulated = (prev.weeklyXpAccumulated || 0) + bonusXP;

    let level = prev.level;
    let maxXp = prev.maxXp;
    let didLevelUp = false;
    let skillPointsGained = 0;

    while (currentXp >= maxXp) {
        currentXp -= maxXp;
        level += 1;
        skillPointsGained += 1;
        maxXp = Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_SCALING_FACTOR, level - 1));
        didLevelUp = true;
    }
    
    let newAttributes = { ...prev.hunterAttributes };
    if (didLevelUp) {
         newAttributes.strength += 1;
         newAttributes.intelligence += 1;
         newAttributes.vitality += 1;
         newAttributes.sense += 1;
         newAttributes.agility += 1;
    }

    if (didLevelUp) {
        setShowLevelUpModal(true);
    } else {
        addToast(t('challengeReward' as any).replace('{{xp}}', bonusXP.toString()), 'success');
        triggerFeedback('hard-success');
    }

    setStats({
        ...prev,
        weeklyChallenge: { ...prev.weeklyChallenge!, completed: true },
        currentXp, level, maxXp, weeklyXpAccumulated,
        hunterAttributes: newAttributes,
        skillPoints: (prev.skillPoints || 0) + skillPointsGained
    });
  }, [addToast, triggerFeedback]);

  const closeLevelUpModal = useCallback(() => {
    setShowLevelUpModal(false);
  }, []);

  const updateDailyQuest = useCallback((type: keyof Omit<DailyQuestProgress, 'isCompleted' | 'lastResetDate'>, amount: number) => {
      const prev = statsRef.current;
      const today = getLocalDateString();
      
      let currentDailyQuest = prev.dailyQuest;
      if (prev.lastLoginDate !== today) {
          currentDailyQuest = {
              pushups: 0, situps: 0, squats: 0, run: 0,
              isCompleted: false,
              lastResetDate: today
          };
      }

      if (!currentDailyQuest || currentDailyQuest.isCompleted) return;

      const newStats = { ...prev, lastLoginDate: today };
      newStats.dailyQuest = { ...currentDailyQuest, [type]: Math.min(DAILY_QUEST_TARGETS[type], amount) };

      const { pushups, situps, squats, run } = newStats.dailyQuest;
      const target = DAILY_QUEST_TARGETS;
      
      if (pushups >= target.pushups && situps >= target.situps && squats >= target.squats && run >= target.run) {
          if (!prev.dailyQuest.isCompleted) {
              newStats.dailyQuest.isCompleted = true;
              const recovered = newStats.maxEnergy - prev.energy;
              if (recovered > 0) {
                  newStats.weeklyEnergyRecovered = (prev.weeklyEnergyRecovered || 0) + recovered;
              }
              newStats.energy = newStats.maxEnergy;
              const dailyXpReward = Math.floor(prev.maxXp * 0.15);
              let currentXp = prev.currentXp + dailyXpReward;
              let level = prev.level;
              let maxXp = prev.maxXp;
              let didLevelUp = false;
              let skillPointsGained = 0;

              while (currentXp >= maxXp) {
                  currentXp -= maxXp;
                  level += 1;
                  skillPointsGained += 1;
                  maxXp = Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_SCALING_FACTOR, level - 1));
                  didLevelUp = true;
              }

              newStats.currentXp = currentXp;
              newStats.level = level;
              newStats.maxXp = maxXp;
              newStats.skillPoints = (prev.skillPoints || 0) + skillPointsGained;
              
              newStats.hunterAttributes = {
                  ...prev.hunterAttributes,
                  strength: prev.hunterAttributes.strength + 2,
                  vitality: prev.hunterAttributes.vitality + 1
              };

              if (didLevelUp) {
                  newStats.hunterAttributes.strength += 1;
                  newStats.hunterAttributes.intelligence += 1;
                  newStats.hunterAttributes.vitality += 1;
                  newStats.hunterAttributes.sense += 1;
                  newStats.hunterAttributes.agility += 1;
                  setShowLevelUpModal(true);
              }
              
              addToast(t('dailyQuestComplete' as any).replace('{{xp}}', dailyXpReward.toString()), 'success');
              triggerFeedback('hard-success');
          }
      }
      triggerFeedback('click');
      setStats(newStats);
  }, [addToast, triggerFeedback]);

  const checkAchievements = useCallback((currentStats: UserStats, currentTasks: Task[], currentAchievements: Achievement[]) => {
    let achievementsUpdated = false;
    let statsUpdated = false;
    let newStats = { ...currentStats };
    let didLevelUp = false;

    const newAchievements = currentAchievements.map(ach => {
      if (ach.isUnlocked) return ach;

      let newValue = ach.currentValue;
      let unlocked = false;

      switch (ach.condition) {
        case 'TASKS_1':
          newValue = currentTasks.filter(t => t.completed).length;
          break;
        case 'TASKS_100':
          newValue = currentTasks.filter(t => t.completed).length;
          break;
        case 'LEVEL_5':
          newValue = currentStats.level;
          break;
        case 'STREAK_7':
          newValue = currentStats.streak;
          break;
        case 'BOSS_1':
          newValue = currentTasks.filter(t => t.isBoss && t.completed).length;
          break;
        case 'EXERCISE_50':
          newValue = currentTasks.filter(t => t.pillar === 'Exercise' && t.completed).length;
          break;
      }

      if (newValue !== ach.currentValue) {
        achievementsUpdated = true;
      }

      if (newValue >= ach.targetValue && !ach.isUnlocked) {
        unlocked = true;
        achievementsUpdated = true;
        statsUpdated = true;
        const translatedTitle = t(`ach_${ach.id}_title` as any) || ach.title;
        addToast(t('achievementUnlocked' as any).replace('{{title}}', translatedTitle).replace('{{xp}}', ach.rewardXP.toString()), 'badge');
        triggerFeedback('levelup');
        
        // Grant XP
        newStats.currentXp += ach.rewardXP;
        let skillPointsGained = 0;
        while (newStats.currentXp >= newStats.maxXp) {
            newStats.currentXp -= newStats.maxXp;
            newStats.level += 1;
            skillPointsGained += 1;
            newStats.maxXp = Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_SCALING_FACTOR, newStats.level - 1));
            didLevelUp = true;
        }
        newStats.skillPoints = (newStats.skillPoints || 0) + skillPointsGained;
      }

      return {
        ...ach,
        currentValue: newValue,
        isUnlocked: ach.isUnlocked || unlocked,
        unlockedAt: unlocked ? Date.now() : ach.unlockedAt
      };
    });

    if (achievementsUpdated) {
      setAchievements(newAchievements);
    }
    
    if (statsUpdated) {
      if (didLevelUp) {
        newStats.hunterAttributes = {
            ...newStats.hunterAttributes,
            strength: newStats.hunterAttributes.strength + 1,
            intelligence: newStats.hunterAttributes.intelligence + 1,
            vitality: newStats.hunterAttributes.vitality + 1,
            sense: newStats.hunterAttributes.sense + 1,
            agility: newStats.hunterAttributes.agility + 1,
        };
        setShowLevelUpModal(true);
      }
      setStats(newStats);
    }
  }, [addToast, triggerFeedback]);

  useEffect(() => {
    if (isLoaded && playerProfile) {
      checkAchievements(stats, tasks, achievements);
    }
  }, [stats.level, stats.streak, tasks]);

  // Hidden Recovery Task Logic
  useEffect(() => {
    if (!isLoaded || !playerProfile) return;

    const energyPercentage = (stats.energy / stats.maxEnergy) * 100;
    if (energyPercentage < 20) {
      const today = new Date().toISOString().split('T')[0];
      const hasRecoveryTask = tasks.some(t => 
        t.isHiddenRecovery && 
        new Date(t.createdAt).toISOString().split('T')[0] === today &&
        !t.completed
      );

      if (!hasRecoveryTask) {
        const recoveryTasks = [
          { titleKey: 'recovery_nap_title', descKey: 'recovery_nap_desc', energy: -15 },
          { titleKey: 'recovery_water_title', descKey: 'recovery_water_desc', energy: -5 },
          { titleKey: 'recovery_stretch_title', descKey: 'recovery_stretch_desc', energy: -10 },
          { titleKey: 'recovery_breathe_title', descKey: 'recovery_breathe_desc', energy: -5 }
        ];
        const randomTask = recoveryTasks[Math.floor(Math.random() * recoveryTasks.length)];
        const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const newTask: Task = {
          id: Date.now().toString(),
          title: t(randomTask.titleKey as any),
          description: t(randomTask.descKey as any),
          pillar: 'Entertainment',
          completed: false,
          energyCost: randomTask.energy,
          xpReward: 5,
          difficulty: '1',
          createdAt: Date.now(),
          order: tasks.length,
          isHiddenRecovery: true,
          day: days[new Date().getDay()]
        };

        setTasks(prev => [...prev, newTask]);
        addToast(t('recovery_msg_spawn' as any), 'warning');
        if (soundEnabled) AudioService.playFailure(); // Use failure sound as warning
      }
    }
  }, [stats.energy, stats.maxEnergy, isLoaded, playerProfile, tasks, addToast, soundEnabled]);

  const completeTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed || task.isMissed) return;

    // Phase II: Dependency Chains
    if (task.prerequisiteTaskId) {
        const prereq = tasks.find(t => t.id === task.prerequisiteTaskId);
        if (prereq && !prereq.completed) {
            addToast(t('prerequisiteNotMet' as any), 'error');
            triggerFeedback('error');
            return;
        }
    }

    const prev = statsRef.current;
    
    const timeMod = getTimeModifier();
    const baseRates = PILLAR_BASE_RATES[task.pillar];
    const multiplier = DIFFICULTY_CONFIG[task.difficulty || '3'].multiplier;
    
    const today = getLocalDateString();

    // DDA Calculation
    const rank = Object.entries(RANK_THRESHOLDS).reverse().find(([_, threshold]) => prev.currentXp >= threshold)?.[0] || 'E';
    const ddaMultiplier = RANK_RESISTANCE_MULTIPLIER[rank] || { energy: 1.0, xp: 1.0 };
    
    // Skill Tree Calculation
    const ddaResistSkillLevel = prev.skills?.['dda_resist'] || 0;
    const ddaResistValue = ddaResistSkillLevel * 0.05; // 5% per level
    const finalDdaEnergyMult = Math.max(1.0, ddaMultiplier.energy - ddaResistValue);
    
    const energyDiscountSkillLevel = prev.skills?.['focus_work'] || 0; // Assuming focus_work is for Work, we should make it generic or check pillar
    let energyDiscountValue = 0;
    if (task.pillar === 'Work') {
        energyDiscountValue = energyDiscountSkillLevel * 0.05;
    }
    
    const xpBoostSkillLevel = prev.skills?.['xp_hunter'] || 0;
    let xpBoostValue = 0;
    if (task.pillar === 'Exercise') {
        xpBoostValue = xpBoostSkillLevel * 0.05;
    }
    
    // Fatigue calculation
    let currentDailyCount = prev.dailyPillarCount || defaultStats.dailyPillarCount;
    let currentDailyQuest = prev.dailyQuest;
    if (prev.lastLoginDate !== today) {
        currentDailyCount = { Learning: 0, Studying: 0, Exercise: 0, Work: 0, Entertainment: 0, Quran: 0 };
        currentDailyQuest = {
            pushups: 0, situps: 0, squats: 0, run: 0,
            isCompleted: false,
            lastResetDate: today
        };
    }

    let fatigueXpMult = 1;
    let fatigueEnergyMult = 1;
    if (currentDailyCount[task.pillar] >= FATIGUE_THRESHOLD) {
        const excess = currentDailyCount[task.pillar] - FATIGUE_THRESHOLD + 1;
        fatigueXpMult = Math.pow(FATIGUE_XP_MULTIPLIER, excess);
        fatigueEnergyMult = Math.pow(FATIGUE_ENERGY_MULTIPLIER, excess);
    }

    const rawEnergyCost = Math.ceil(baseRates.energy * multiplier * timeMod.energy * fatigueEnergyMult * finalDdaEnergyMult * (1 - energyDiscountValue));
    const finalEnergyCost = task.isHiddenRecovery || task.pillar === 'Quran' ? task.energyCost : (task.isBoss ? 0 : (baseRates.energy < 0 ? baseRates.energy * multiplier : rawEnergyCost)); 
    
    // Safety check for energy
    if (task.pillar !== 'Quran' && finalEnergyCost > 0 && prev.energy < finalEnergyCost) {
        addToast(t('insufficientEnergyToast' as any), 'error');
        triggerFeedback('error');
        return;
    }

    // Critical Hit Logic
    const isCritical = Math.random() < CRITICAL_HIT_CHANCE;
    
    setTasks(currentTasks => currentTasks.map(t => t.id === id ? { ...t, completed: true, completedAt: Date.now() } : t));

    let newStreak = prev.streak;
    let lastTaskDate = prev.lastTaskCompletionDate;

    if (lastTaskDate !== today) {
        const yesterdayObj = new Date();
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterdayObj);
        
        if (lastTaskDate === yesterdayStr) newStreak += 1;
        else newStreak = 1;
        lastTaskDate = today;
    }

    let weeklyTasks = (prev.weeklyTasksCompleted || 0) + 1;
    let weeklyStreak = Math.max((prev.weeklyMaxStreak || 0), newStreak);
    let weeklyExercise = (prev.weeklyExerciseCount || 0) + (task.pillar === 'Exercise' ? 1 : 0);

    let newStats = { 
        ...prev,
        streak: newStreak,
        lastLoginDate: today, // Update lastLoginDate in case app was left open overnight
        lastTaskCompletionDate: lastTaskDate,
        lastEnergyUpdate: Date.now(),
        weeklyTasksCompleted: weeklyTasks,
        weeklyMaxStreak: weeklyStreak,
        weeklyExerciseCount: weeklyExercise,
        hunterAttributes: { ...prev.hunterAttributes },
        dailyQuest: currentDailyQuest,
        dailyPillarCount: {
            ...currentDailyCount,
            [task.pillar]: (currentDailyCount[task.pillar] || 0) + 1
        },
        lastPillarActivity: {
            ...(prev.lastPillarActivity || defaultStats.lastPillarActivity),
            [task.pillar]: today
        }
    };

    const attrGain = 0.5 * multiplier;
    const attributeToUpdate = PILLAR_TO_ATTRIBUTE_MAP[task.pillar];
    if (attributeToUpdate) {
        newStats.hunterAttributes[attributeToUpdate] += attrGain;
    }

    let didLevelUp = false;

    if (task.pillar === 'Quran') {
        const pagesToAdd = task.pages || 1;
        newStats.quranPagesRead = (prev.quranPagesRead || 0) + pagesToAdd;
        if(soundEnabled) AudioService.playEnergyRestore();
    } 

    if (finalEnergyCost > 0) {
        const actualCost = Math.min(prev.energy, finalEnergyCost);
        newStats.weeklyEnergyConsumed = (prev.weeklyEnergyConsumed || 0) + actualCost;
    } else if (finalEnergyCost < 0) {
        const actualGain = Math.min(newStats.maxEnergy - prev.energy, Math.abs(finalEnergyCost));
        if (actualGain > 0) {
            newStats.weeklyEnergyRecovered = (prev.weeklyEnergyRecovered || 0) + actualGain;
        }
    }
    newStats.energy = Math.min(newStats.maxEnergy, Math.max(0, prev.energy - finalEnergyCost));
    
    let baseReward = Math.ceil(baseRates.xp * multiplier * timeMod.xp * fatigueXpMult * ddaMultiplier.xp * (1 + xpBoostValue));
    if (task.pillar === 'Quran') {
        baseReward = Math.ceil(5 * multiplier * (task.pages || 1) * timeMod.xp * fatigueXpMult * ddaMultiplier.xp * (1 + xpBoostValue));
    } else if (task.isHiddenRecovery) {
        baseReward = task.xpReward;
    } else if (task.isBoss && task.targetEnergy) {
        const investmentRatio = task.targetEnergy / task.energyCost;
        baseReward = Math.ceil(baseReward * investmentRatio * 1.5); // 1.5x bonus for boss tasks
    }
    
    // XP Booster Item
    if (prev.xpBoosterActiveUntil && prev.xpBoosterActiveUntil > Date.now()) {
        baseReward = Math.ceil(baseReward * 1.5);
    }
    
    // Awakening Multiplier (10% per awakening)
    const awakeningMultiplier = 1 + ((prev.awakenings || 0) * 0.1);
    baseReward = Math.ceil(baseReward * awakeningMultiplier);
    
    let finalXpReward = isCritical ? Math.ceil(baseReward * CRITICAL_HIT_MULTIPLIER) : baseReward;
    
    let currentXp = prev.currentXp + finalXpReward;
    newStats.weeklyXpAccumulated = (prev.weeklyXpAccumulated || 0) + finalXpReward;

    let level = prev.level;
    let maxXp = prev.maxXp;
    let skillPointsGained = 0;
    while (currentXp >= maxXp) {
        currentXp -= maxXp;
        level += 1;
        skillPointsGained += 1;
        maxXp = Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_SCALING_FACTOR, level - 1));
        didLevelUp = true;
    }
    
    newStats.skillPoints = (prev.skillPoints || 0) + skillPointsGained;

    if (!didLevelUp) {
        const energyMsg = finalEnergyCost > 0 ? `-${finalEnergyCost}⚡` : `+${Math.abs(finalEnergyCost)}⚡`;
        const critMsg = isCritical ? t('criticalHit' as any) : "";
        
        if (task.pillar === 'Quran') {
            addToast(`✅ ${task.pages || 1} ${t('page' as any)} | ${critMsg}+${finalXpReward} XP | ${energyMsg}`, isCritical ? 'hard-success' : 'success');
        } else {
            addToast(`${critMsg}+${finalXpReward} XP | ${energyMsg}`, isCritical ? 'hard-success' : 'success');
        }
        
        if (isCritical) {
            const actualGain = Math.min(newStats.maxEnergy - newStats.energy, 5);
            if (actualGain > 0) {
                newStats.weeklyEnergyRecovered = (newStats.weeklyEnergyRecovered || 0) + actualGain;
            }
            newStats.energy = Math.min(newStats.maxEnergy, newStats.energy + 5);
            triggerFeedback('hard-success');
        } else {
            const isHard = ['B', 'A', 'S'].includes(task.difficulty);
            if (isHard) triggerFeedback('hard-success');
            else triggerFeedback('success');
        }
    } else {
         if(soundEnabled) AudioService.playXpGain();
    }

    newStats.currentXp = currentXp;
    newStats.level = level;
    newStats.maxXp = maxXp;

    if (didLevelUp) {
        newStats.hunterAttributes.strength += 1;
        newStats.hunterAttributes.intelligence += 1;
        newStats.hunterAttributes.vitality += 1;
        newStats.hunterAttributes.sense += 1;
        newStats.hunterAttributes.agility += 1;

        setShowLevelUpModal(true);
    }

    setStats(newStats);
  }, [tasks, addToast, triggerFeedback, soundEnabled]);

  const investInBossTask = useCallback((id: string, energyAmount: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !task.isBoss || task.completed || task.isMissed) return;

    const prev = statsRef.current;
    if (prev.energy < energyAmount) {
        addToast(t('insufficientEnergyInvest' as any), 'error');
        triggerFeedback('error');
        return;
    }

    const newInvested = (task.investedEnergy || 0) + energyAmount;
    const target = task.targetEnergy || 100;

    const updatedStats = {
        ...prev,
        energy: prev.energy - energyAmount,
        weeklyEnergyConsumed: (prev.weeklyEnergyConsumed || 0) + energyAmount
    };
    setStats(updatedStats);
    statsRef.current = updatedStats; // Force update ref so completeTask sees it

    if (newInvested >= target) {
        // Boss task completed!
        setTasks(currentTasks => currentTasks.map(t => t.id === id ? { ...t, investedEnergy: target } : t));
        addToast(t('bossDefeated' as any), 'hard-success');
        
        // Phase II: Deterministic Loot
        const lootItems: ('ENERGY_POTION' | 'STREAK_SHIELD' | 'XP_BOOSTER')[] = ['ENERGY_POTION', 'STREAK_SHIELD', 'XP_BOOSTER'];
        const droppedItem = lootItems[Math.floor(Math.random() * lootItems.length)];
        
        setStats(s => ({
            ...s,
            inventory: {
                ...s.inventory,
                [droppedItem]: (s.inventory[droppedItem] || 0) + 1
            }
        }));
        addToast(t('lootAcquired' as any).replace('{{item}}', droppedItem.replace('_', ' ')), 'badge');
        
        completeTask(id);
    } else {
        setTasks(currentTasks => currentTasks.map(t => t.id === id ? { ...t, investedEnergy: newInvested } : t));
        addToast(t('bossInvested' as any).replace('{{amount}}', energyAmount.toString()), 'success');
        triggerFeedback('success');
    }
  }, [tasks, completeTask, addToast, triggerFeedback]);

  const awaken = useCallback(() => {
    setStats(prev => {
        if (prev.level < 100) return prev; // Must be level 100 to awaken
        
        triggerFeedback('levelup');
        addToast(t('systemAwakened' as any), 'badge');
        
        return {
            ...prev,
            level: 1,
            currentXp: 0,
            maxXp: BASE_XP_PER_LEVEL,
            awakenings: (prev.awakenings || 0) + 1,
            // We keep skills, inventory, and attributes as a reward for prestige
        };
    });
  }, [triggerFeedback, addToast]);

  const resetProgress = useCallback(() => {
    StorageService.clearAll();
    
    // Reset all local state
    setStats(defaultStats);
    setTasks([]);
    setWeeklyHistory([]);
    setMonthlyHistory([]);
    setWeeklyReports([]);
    setMonthlyReports([]);
    setWeeklyRewards([]);
    setMonthlyRewards([]);
    setPlayerProfile(null);
    
    // Force reload to ensure clean state
    window.location.reload();
    
    addToast(t('accountReset' as any), 'info');
    triggerFeedback('error');
  }, [addToast, triggerFeedback]);

  // --- EXPORT/IMPORT ---
  const exportSaveData = useCallback(() => {
      return StorageService.createBackup();
  }, []);

  const importSaveData = useCallback((jsonData: string) => {
      const success = StorageService.restoreBackup(jsonData);
      if (success) {
          addToast(t('backupRestored' as any), "success");
          setTimeout(() => window.location.reload(), 1500);
          return true;
      } else {
          addToast(t('backupFailed' as any), "error");
          return false;
      }
  }, [addToast]);

  // --- Phase II: Skills & Inventory ---
  const upgradeSkill = useCallback((skillId: string) => {
      setStats(prev => {
          if (prev.skillPoints <= 0) return prev;
          const currentLevel = prev.skills[skillId] || 0;
          if (currentLevel >= 3) return prev; // Max level is 3
          
          triggerFeedback('levelup');
          return {
              ...prev,
              skillPoints: prev.skillPoints - 1,
              skills: {
                  ...prev.skills,
                  [skillId]: currentLevel + 1
              }
          };
      });
  }, [triggerFeedback]);

  const useItem = useCallback((itemId: 'ENERGY_POTION' | 'STREAK_SHIELD' | 'XP_BOOSTER') => {
      setStats(prev => {
          if (!prev.inventory[itemId] || prev.inventory[itemId] <= 0) return prev;
          
          let newStats = { ...prev };
          newStats.inventory = { ...prev.inventory, [itemId]: prev.inventory[itemId] - 1 };
          
          if (itemId === 'ENERGY_POTION') {
              newStats.energy = Math.min(newStats.maxEnergy, newStats.energy + 50);
              addToast(t('energyRestored' as any), 'success');
              if(soundEnabled) AudioService.playEnergyRestore();
          } else if (itemId === 'STREAK_SHIELD') {
              newStats.activeShields = (newStats.activeShields || 0) + 1;
              addToast(t('streakShieldActivated' as any), 'success');
              triggerFeedback('boost');
          } else if (itemId === 'XP_BOOSTER') {
              newStats.xpBoosterActiveUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
              addToast(t('xpBoosterActivated' as any), 'success');
              triggerFeedback('boost');
          }
          
          return newStats;
      });
  }, [addToast, soundEnabled, triggerFeedback]);

  const value = useMemo(() => ({
    stats,
    tasks,
    playerProfile,
    isLoaded, // Added to context value
    weeklyHistory,
    monthlyHistory,
    weeklyReports,
    monthlyReports,
    weeklyRewards,
    monthlyRewards,
    achievements,
    createProfile,
    updateProfile,
    addTask,
    editTask,
    deleteTask,
    completeTask, 
    investInBossTask,
    reorderTasks,
    moveTask,
    resetProgress,
    setWeeklyChallenge,
    completeWeeklyChallenge,
    showLevelUpModal,
    closeLevelUpModal,
    updateDailyQuest,
    exportSaveData,
    importSaveData,
    upgradeSkill,
    useItem,
    awaken
  }), [stats, tasks, playerProfile, isLoaded, weeklyHistory, monthlyHistory, weeklyReports, monthlyReports, weeklyRewards, monthlyRewards, achievements, createProfile, updateProfile, addTask, editTask, deleteTask, completeTask, investInBossTask, reorderTasks, moveTask, resetProgress, setWeeklyChallenge, completeWeeklyChallenge, showLevelUpModal, closeLevelUpModal, updateDailyQuest, exportSaveData, importSaveData, upgradeSkill, useItem, awaken]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};
