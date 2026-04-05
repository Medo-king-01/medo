

export type PillarType = 'Learning' | 'Studying' | 'Exercise' | 'Work' | 'Entertainment' | 'Quran';

export type DayOfWeek = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

// New: Difficulty System
export type TaskDifficulty = '1' | '2' | '3' | '4' | '5';

// New: Hunter Rank System
export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';

// New: System Notification
export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'QUEST' | 'REWARD' | 'WARNING';
  timestamp: number;
}

// New: Exercise Specific Types
export type ExerciseCategory = 'Cardio' | 'Strength' | 'Flexibility';
export type ExerciseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

// New: Phase II - Inventory & Skills
export type ItemType = 'ENERGY_POTION' | 'STREAK_SHIELD' | 'XP_BOOSTER';
export type SkillEffect = 'ENERGY_DISCOUNT' | 'XP_BOOST' | 'RECOVERY_BOOST' | 'DDA_RESISTANCE';

export interface InventoryItem {
  id: ItemType;
  quantity: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;
  effectType: SkillEffect;
  pillarTarget: PillarType | 'ALL';
  valuePerLevel: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  pillar: PillarType;
  completed: boolean;
  energyCost: number;
  xpReward: number;
  difficulty: TaskDifficulty; // New field
  dueDate?: string;
  day?: DayOfWeek;
  createdAt: number;
  completedAt?: number; // New: Completion timestamp
  order: number;
  pages?: number; // Specific for Quran
  isMissed?: boolean; // New: Tracks failure
  
  // New: Milestone Boss Fights
  isBoss?: boolean;
  targetEnergy?: number;
  investedEnergy?: number;
  
  // New: Hidden Recovery
  isHiddenRecovery?: boolean;

  // New: Phase II - Questlines
  prerequisiteTaskId?: string;
}

// New: Achievements System
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string; // e.g., 'TASKS_100', 'LEVEL_10'
  targetValue: number;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  rewardXP: number;
}

export interface PlayerProfile {
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  createdAt: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string; 
  weekStart: string; 
  completed: boolean;
}

// 1️⃣ Weekly Snapshot Structure
export interface WeeklyHistory {
  weekId: string;             
  monthId: string;            
  weekIndexInMonth: number;   
  startDate: string;          
  endDate: string;            

  totalXP: number;
  tasksCompleted: number;
  streakMax: number;
  
  // New: Failure Tracking
  missedTasksCount: number;
  xpLost: number;

  // New: Deep Analytics
  balanceScore: number; // 0-100
  efficiencyRate: number; // Avg XP per Task
  energyConsumed: number;
  energyRecovered: number;

  statsSummary: {
    learning: number;
    studying: number;
    exercise: number;
    work: number;
    entertainment: number;
    quran: number;
  };
  
  // New: Full Record of Tasks for this week
  archivedTasks: Task[];

  rankScore: number;
  createdAt: number; 
}

// 2️⃣ Monthly Snapshot Structure
export interface MonthlyHistory {
  monthId: string;            
  startDate: string;          
  endDate: string;            

  weeksIncluded: string[];    

  totalXP: number;
  averageXP: number;
  totalTasks: number;
  energyConsumed: number;
  energyRecovered: number;

  bestWeekRankScore: number;
  worstWeekRankScore: number;

  statsSummary: {
    learning: number;
    studying: number;
    exercise: number;
    work: number;
    entertainment: number;
    quran: number;
  };

  streakRecord: number;
  consistencyRate: number;    
  monthRank: string;          
  createdAt: number;
}

// 3️⃣ Report Structures
export type WeeklyRating = "Excellent" | "Consistent" | "Unstable" | "Lazy";
export type MonthlyRating = "Legend" | "Grinder" | "Survivor" | "Falling";

export interface WeeklyReport {
  weekId: string; 
  comparison: {
    xpChangePercent: number | null; 
    tasksChange: number | null;
    streakTrend: "up" | "down" | "stable" | null;
  };
  bestPillar: PillarType;
  worstPillar: PillarType;
  rating: WeeklyRating;
  summaryText: string; 
  createdAt: number;
}

export interface MonthlyReport {
  monthId: string; 
  comparison: {
    xpChangePercent: number | null;
    consistencyChange: number | null;
  };
  bestWeekId: string;
  weakestWeekId: string;
  monthRating: MonthlyRating;
  summaryText: string;
  createdAt: number;
}

// 4️⃣ Reward System
export type BadgeTier = 'LEGENDARY' | 'GOLD' | 'SILVER' | 'BRONZE' | 'GRAY';
export type VisualCue = 'UP_ARROW' | 'RIGHT_ARROW' | 'WARNING' | 'DASH' | 'STAR_GOLD' | 'STAR_SILVER' | 'STAR_BRONZE' | 'GRAY_ICON';

export interface WeeklyReward {
  id: string;
  reportId: string; 
  xpBonus: number;
  badge: BadgeTier;
  visualCue: VisualCue;
  message: string;
  createdAt: number;
}

export interface MonthlyReward {
  id: string;
  reportId: string; 
  xpBonus: number;
  badge: BadgeTier;
  visualCue: VisualCue;
  message: string;
  createdAt: number;
}

// New: Solo Leveling Quest System
export interface DailyQuestProgress {
  pushups: number;
  situps: number;
  squats: number;
  run: number; // km
  isCompleted: boolean;
  lastResetDate: string;
}

export interface HunterAttributes {
  strength: number; 
  intelligence: number; 
  vitality: number; 
  sense: number; 
  agility: number; 
}

export const PILLAR_TO_ATTRIBUTE_MAP: Record<PillarType, keyof HunterAttributes> = {
  Exercise: 'strength',
  Studying: 'intelligence',
  Learning: 'intelligence',
  Entertainment: 'vitality',
  Quran: 'sense',
  Work: 'agility'
};

export interface UserStats {
  level: number;
  currentXp: number;
  maxXp: number;
  energy: number;
  maxEnergy: number;
  streak: number;
  lastLoginDate: string;
  lastTaskCompletionDate?: string;
  lastEnergyUpdate: number;
  // Quran Specific Stats
  quranPagesRead: number;
  quranBadges: number;
  // New: Weekly Challenge
  weeklyChallenge?: WeeklyChallenge;
  
  // 3️⃣ New: Tracking for Current Week (Resets weekly)
  currentWeekStart: string; 
  weeklyXpAccumulated: number;
  weeklyTasksCompleted: number;
  weeklyMaxStreak: number;
  weeklyExerciseCount: number;
  
  // New: Failure Tracking
  weeklyMissedTasks: number;
  weeklyXpLost: number;
  
  // New: Energy Tracking
  weeklyEnergyConsumed: number;
  weeklyEnergyRecovered: number;

  // New: Fatigue & Atrophy Tracking
  dailyPillarCount: Record<PillarType, number>;
  lastPillarActivity: Record<PillarType, string>;

  // New: Daily Quest & Hunter Stats
  dailyQuest: DailyQuestProgress;
  hunterAttributes: HunterAttributes;

  // New: Phase II - Skills & Inventory
  skillPoints: number;
  skills: Record<string, number>; // skillId -> currentLevel
  inventory: Record<ItemType, number>;
  activeShields: number;
  xpBoosterActiveUntil: number; // timestamp
  
  // New: Phase III - Awakening
  awakenings: number;
}

export interface GameState {
  stats: UserStats;
  tasks: Task[];
  playerProfile: PlayerProfile | null;
  weeklyHistory: WeeklyHistory[];
  monthlyHistory: MonthlyHistory[];
  weeklyReports: WeeklyReport[];
  monthlyReports: MonthlyReport[];
  weeklyRewards: WeeklyReward[]; 
  monthlyRewards: MonthlyReward[]; 
  achievements: Achievement[];
}

export interface PillarsData {
  Learning: Task[];
  Studying: Task[];
  Exercise: Task[];
  Work: Task[];
  Entertainment: Task[];
  Quran: Task[];
}

// Increased Base XP to make leveling harder
export const BASE_XP_PER_LEVEL = 300; 

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  PILLARS = 'PILLARS',
  PLANNER = 'PLANNER',
  COACH = 'COACH',
  SETTINGS = 'SETTINGS',
  STATS = 'STATS'
}

export type StackScreen = 'ROOT' | PillarType;

export type Language = 'ar' | 'en';
export type ThemeColor = 'red-black' | 'blue-dark' | 'green-matrix' | 'purple-royal' | 'pink-white';
export type NotificationDuration = 'short' | 'medium' | 'long' | 'persistent';

export interface AppSettings {
  language: Language;
  themeColor: ThemeColor;
  darkMode: boolean;
  notificationsEnabled: boolean;
  notificationDuration: NotificationDuration;
  allowDeleteCompleted: boolean;
  soundEnabled: boolean;
  soundVolume: number; // New Field: 0.0 to 1.0
  hapticsEnabled: boolean; 
  storagePermissionGranted: boolean;
  backupEnabled: boolean;
  timeSyncEnabled: boolean;
}

export type ToastType = 'success' | 'hard-success' | 'error' | 'info' | 'level-up' | 'badge' | 'shadow';
export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  manualDismiss?: boolean;
}
