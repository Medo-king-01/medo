
import { Task, UserStats, WeeklyHistory, MonthlyHistory, PillarType, WeeklyReport, WeeklyReward, MonthlyReport, MonthlyReward } from '../types';
import { ReportEngine } from './reportEngine';
import { RewardEngine } from './rewardEngine';

// Helper for safe UUID
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const HistoryEngine = {
  /**
   * Calculates the Rank Score based on the formula:
   * (totalXP * 0.4) + (tasksCompleted * 0.3) + (streakMax * 0.2) + (exerciseConsistency * 0.1)
   */
  calculateRankScore: (xp: number, tasks: number, streak: number, exerciseCount: number): number => {
    // Normalize exercise consistency (assuming 5 times a week is "perfect" for score)
    const exerciseScore = Math.min(exerciseCount * 20, 100); 
    
    // Simple normalization for others to keep score readable (approx 0-1000 range usually)
    const score = (xp * 0.4) + (tasks * 10 * 0.3) + (streak * 10 * 0.2) + (exerciseScore * 0.1);
    return Math.floor(score);
  },

  /**
   * Calculates "Balance Score" (0-100) using Standard Deviation of pillar distribution.
   * Higher score = Better balance.
   */
  calculateBalanceScore: (summary: Record<string, number>): number => {
      const values = Object.values(summary);
      const sum = values.reduce((a, b) => a + b, 0);
      if (sum === 0) return 0;
      
      const mean = sum / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Coefficient of Variation (CV) = StdDev / Mean
      // Lower CV means more uniform distribution.
      // We invert it to get a score where higher is better.
      // Max expected imbalance is roughly when 1 pillar has everything (CV approx sqrt(N-1) -> sqrt(5) ~ 2.23)
      const cv = stdDev / mean;
      
      // Normalized Score: 100 * (1 - (CV / 2.5)) clamped to 0-100
      const score = Math.max(0, Math.min(100, 100 * (1 - (cv / 2.5))));
      return Math.round(score);
  },

  /**
   * Creates a Weekly Snapshot from current stats and tasks
   */
  createWeeklySnapshot: (stats: UserStats, tasks: Task[]): WeeklyHistory => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const endDate = `${year}-${month}-${day}`;
    const startDate = stats.currentWeekStart || endDate;
    const monthId = startDate.substring(0, 7); // YYYY-MM
    
    const totalCompletedEver = tasks.filter(t => t.completed).length || 1;
    // Ratio calculation is an approximation if we don't strictly separate tasks by creation date in stats
    // But now we will snapshot specific tasks, so we can be more precise if needed.
    
    const getPillarCount = (p: PillarType) => tasks.filter(t => t.pillar === p && t.completed).length;

    const statsSummary = {
        learning: getPillarCount('Learning'),
        studying: getPillarCount('Studying'),
        exercise: getPillarCount('Exercise'),
        work: getPillarCount('Work'),
        entertainment: getPillarCount('Entertainment'),
        quran: getPillarCount('Quran'),
    };

    const balanceScore = HistoryEngine.calculateBalanceScore(statsSummary);
    const efficiencyRate = stats.weeklyTasksCompleted > 0 
        ? Math.round(stats.weeklyXpAccumulated / stats.weeklyTasksCompleted) 
        : 0;

    const snapshot: WeeklyHistory = {
        weekId: generateId(),
        monthId: monthId,
        weekIndexInMonth: Math.ceil(new Date(startDate).getDate() / 7),
        startDate,
        endDate,
        
        totalXP: stats.weeklyXpAccumulated,
        tasksCompleted: stats.weeklyTasksCompleted,
        streakMax: stats.weeklyMaxStreak,
        
        // Failure Tracking
        missedTasksCount: stats.weeklyMissedTasks || 0,
        xpLost: stats.weeklyXpLost || 0,
        
        // Analytics Metrics
        balanceScore,
        efficiencyRate,
        energyConsumed: stats.weeklyEnergyConsumed || 0,
        energyRecovered: stats.weeklyEnergyRecovered || 0,
        
        statsSummary,
        
        // SAVE ALL TASKS TO HISTORY (Deep Copy)
        archivedTasks: JSON.parse(JSON.stringify(tasks)),

        rankScore: HistoryEngine.calculateRankScore(
            stats.weeklyXpAccumulated, 
            stats.weeklyTasksCompleted, 
            stats.weeklyMaxStreak, 
            stats.weeklyExerciseCount
        ),
        createdAt: Date.now()
    };

    return snapshot;
  },

  /**
   * Aggregates 4 weeks into a Monthly Snapshot
   */
  createMonthlySnapshot: (monthId: string, weeks: WeeklyHistory[]): MonthlyHistory => {
    if (weeks.length === 0) throw new Error("No weeks to aggregate");

    const totalXP = weeks.reduce((sum, w) => sum + w.totalXP, 0);
    const totalTasks = weeks.reduce((sum, w) => sum + w.tasksCompleted, 0);
    const energyConsumed = weeks.reduce((sum, w) => sum + (w.energyConsumed || 0), 0);
    const energyRecovered = weeks.reduce((sum, w) => sum + (w.energyRecovered || 0), 0);
    const rankScores = weeks.map(w => w.rankScore);
    const bestScore = Math.max(...rankScores);
    const worstScore = Math.min(...rankScores);
    const maxStreak = Math.max(...weeks.map(w => w.streakMax));

    const consistencyRate = bestScore > 0 
        ? Math.round((weeks.reduce((sum, w) => sum + w.rankScore, 0) / weeks.length) / bestScore * 100) 
        : 0;

    // Determine Rank
    let monthRank = 'Novice';
    if (totalXP > 10000) monthRank = 'Legend';
    else if (totalXP > 5000) monthRank = 'Elite Hunter';
    else if (totalXP > 2000) monthRank = 'Grinder';
    else monthRank = 'Survivor';

    // Aggregate Pillar Stats
    const summary = {
        learning: 0, studying: 0, exercise: 0, work: 0, entertainment: 0, quran: 0
    };
    weeks.forEach(w => {
        summary.learning += w.statsSummary.learning;
        summary.studying += w.statsSummary.studying;
        summary.exercise += w.statsSummary.exercise;
        summary.work += w.statsSummary.work;
        summary.entertainment += w.statsSummary.entertainment;
        summary.quran += w.statsSummary.quran;
    });

    const snapshot: MonthlyHistory = {
        monthId,
        startDate: weeks[0].startDate,
        endDate: weeks[weeks.length - 1].endDate,
        weeksIncluded: weeks.map(w => w.weekId),
        
        totalXP,
        averageXP: Math.round(totalXP / weeks.length),
        totalTasks,
        energyConsumed,
        energyRecovered,
        
        bestWeekRankScore: bestScore,
        worstWeekRankScore: worstScore,
        
        statsSummary: summary,
        streakRecord: maxStreak,
        consistencyRate,
        monthRank,
        createdAt: Date.now()
    };

    return snapshot;
  },

  /**
   * ⚡ PROCESS TIME SKIP (The Engine Core)
   * Handles catching up on missed weeks/months when the user opens the app after a long time.
   */
  processTimeSkip: (
    stats: UserStats, 
    tasks: Task[], 
    weeklyHistory: WeeklyHistory[],
    monthlyHistory: MonthlyHistory[],
    weeklyReports: WeeklyReport[],
    monthlyReports: MonthlyReport[],
    weeklyRewards: WeeklyReward[],
    monthlyRewards: MonthlyReward[],
    calculatedWeekStart: string
  ) => {
    const now = new Date();
    
    // Copies to modify
    let newStats = { ...stats };
    let newWeeklyHistory = [...weeklyHistory];
    let newMonthlyHistory = [...monthlyHistory];
    let newWeeklyReports = [...weeklyReports];
    let newMonthlyReports = [...monthlyReports];
    let newWeeklyRewards = [...weeklyRewards];
    let newMonthlyRewards = [...monthlyRewards];
    
    // Flag to determine if we should reset tasks (Start new week)
    let shouldResetTasks = false;
    let reportsGenerated = 0;

    // If the calculated start of the current week is different from the saved one, a new week has started
    if (calculatedWeekStart !== stats.currentWeekStart) {
        // 1. Close the active week (the one stored in stats)
        // This archives CURRENT tasks into history
        const newSnapshot = HistoryEngine.createWeeklySnapshot(newStats, tasks);
        newWeeklyHistory.push(newSnapshot);
        
        const previousWeek = weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1] : undefined;
        const report = ReportEngine.generateWeeklyReport(newSnapshot, previousWeek);
        newWeeklyReports.push(report);
        newWeeklyRewards.push(RewardEngine.generateWeeklyReward(report));
        reportsGenerated++;

        // Mark that a reset is needed because we archived the week
        shouldResetTasks = true;

        // 2. Reset Stats for new week
        newStats.currentWeekStart = calculatedWeekStart;
        newStats.weeklyXpAccumulated = 0;
        newStats.weeklyTasksCompleted = 0;
        newStats.weeklyMaxStreak = 0;
        newStats.weeklyExerciseCount = 0;
        newStats.weeklyMissedTasks = 0;
        newStats.weeklyXpLost = 0;
        newStats.weeklyEnergyConsumed = 0;
        newStats.weeklyEnergyRecovered = 0;
        newStats.weeklyChallenge = undefined;

        // 3. Check for Monthly Closure
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const currentMonthId = `${year}-${month}`;
        const snapshotMonthId = newSnapshot.monthId;
        
        const weeksInSnapshotMonth = newWeeklyHistory.filter(w => w.monthId === snapshotMonthId);
        const isMonthDifferent = snapshotMonthId !== currentMonthId;

        if (weeksInSnapshotMonth.length >= 4 || isMonthDifferent) {
             if (!newMonthlyHistory.find(m => m.monthId === snapshotMonthId)) {
                 const newMonthlySnapshot = HistoryEngine.createMonthlySnapshot(snapshotMonthId, weeksInSnapshotMonth);
                 newMonthlyHistory.push(newMonthlySnapshot);

                 const previousMonth = monthlyHistory.length > 0 ? monthlyHistory[monthlyHistory.length - 1] : undefined;
                 const monthlyReport = ReportEngine.generateMonthlyReport(newMonthlySnapshot, previousMonth);
                 newMonthlyReports.push(monthlyReport);
                 newMonthlyRewards.push(RewardEngine.generateMonthlyReward(monthlyReport));
                 reportsGenerated++;
             }
        }
    }

    // Task Reset Logic:
    // If we started a new week, we clear the schedule (Tasks with 'day' property are for the planner).
    // General backlog tasks (no day) might be kept, but for simplicity and strict weekly cycles, we clear all "Planner Tasks".
    // We retain Shadow tasks if they are still relevant (handled by GameContext logic anyway), 
    // but usually, a new week means a fresh start.
    let nextActiveTasks = [...tasks];
    if (shouldResetTasks) {
        // Keep only tasks that do NOT have a specific day assigned (Backlog)
        // OR clear everything. Based on request "re-initialize days for new tasks", we clear daily tasks.
        nextActiveTasks = tasks.filter(t => !t.day); 
    }

    return {
        stats: newStats,
        tasks: nextActiveTasks,
        weeklyHistory: newWeeklyHistory,
        monthlyHistory: newMonthlyHistory,
        weeklyReports: newWeeklyReports,
        monthlyReports: newMonthlyReports,
        weeklyRewards: newWeeklyRewards,
        monthlyRewards: newMonthlyRewards,
        reportsGenerated,
        shouldResetTasks
    };
  }
};
