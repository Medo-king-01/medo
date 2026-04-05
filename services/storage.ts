
import { UserStats, Task, BASE_XP_PER_LEVEL, PillarType, AppSettings, PlayerProfile, WeeklyHistory, MonthlyHistory, WeeklyReport, MonthlyReport, WeeklyReward, MonthlyReward } from '../types';
import { MAX_DAILY_ENERGY } from '../constants';

const STORAGE_PREFIX = 'game_';
const KEYS = {
  STATS: `${STORAGE_PREFIX}stats`,
  TASKS: `${STORAGE_PREFIX}tasks_v2`, // Changed key to avoid conflict with old structure
  SETTINGS: `${STORAGE_PREFIX}settings`,
  PLAYER: `${STORAGE_PREFIX}player`,
  HISTORY_WEEKLY: `${STORAGE_PREFIX}history_weeks`,
  HISTORY_MONTHLY: `${STORAGE_PREFIX}history_months`,
  REPORTS_WEEKLY: `${STORAGE_PREFIX}reports_weekly`,
  REPORTS_MONTHLY: `${STORAGE_PREFIX}reports_monthly`,
  REWARDS_WEEKLY: `${STORAGE_PREFIX}rewards_weekly`,
  REWARDS_MONTHLY: `${STORAGE_PREFIX}rewards_monthly`,
  ACHIEVEMENTS: `${STORAGE_PREFIX}achievements`,
  VERSION: `${STORAGE_PREFIX}version`
};

const CURRENT_SCHEMA_VERSION = 2;

const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const defaultStats: UserStats = {
  level: 1,
  currentXp: 0,
  maxXp: BASE_XP_PER_LEVEL,
  energy: MAX_DAILY_ENERGY,
  maxEnergy: MAX_DAILY_ENERGY,
  streak: 0,
  lastLoginDate: getLocalDateString(),
  lastTaskCompletionDate: '',
  lastEnergyUpdate: Date.now(),
  quranPagesRead: 0,
  quranBadges: 0,
  currentWeekStart: getLocalDateString(),
  weeklyXpAccumulated: 0,
  weeklyTasksCompleted: 0,
  weeklyMaxStreak: 0,
  weeklyExerciseCount: 0,
  weeklyMissedTasks: 0,
  weeklyXpLost: 0,
  weeklyEnergyConsumed: 0,
  weeklyEnergyRecovered: 0,
  dailyPillarCount: {
    Learning: 0, Studying: 0, Exercise: 0, Work: 0, Entertainment: 0, Quran: 0
  },
  lastPillarActivity: {
    Learning: getLocalDateString(), Studying: getLocalDateString(), Exercise: getLocalDateString(), Work: getLocalDateString(), Entertainment: getLocalDateString(), Quran: getLocalDateString()
  },
  dailyQuest: {
    pushups: 0,
    situps: 0,
    squats: 0,
    run: 0,
    isCompleted: false,
    lastResetDate: getLocalDateString()
  },
  hunterAttributes: {
    strength: 10,
    intelligence: 10,
    vitality: 10,
    sense: 10,
    agility: 10
  },
  skillPoints: 0,
  skills: {},
  inventory: {},
  activeShields: 0,
  xpBoosterActiveUntil: 0,
  awakenings: 0
};

export const defaultSettings: AppSettings = {
  language: 'ar',
  themeColor: 'red-black',
  darkMode: true,
  notificationsEnabled: false,
  notificationDuration: 'medium',
  allowDeleteCompleted: false,
  soundEnabled: true,
  soundVolume: 0.5,
  hapticsEnabled: true,
  storagePermissionGranted: false,
  backupEnabled: false,
  timeSyncEnabled: true,
};

export const StorageService = {
  
  // --- MIGRATION & INIT ---
  init: () => {
    const savedVersion = parseInt(localStorage.getItem(KEYS.VERSION) || '0');
    
    if (savedVersion < CURRENT_SCHEMA_VERSION) {
        console.log(`Migrating data from version ${savedVersion} to ${CURRENT_SCHEMA_VERSION}...`);
        StorageService.migrate(savedVersion);
        localStorage.setItem(KEYS.VERSION, CURRENT_SCHEMA_VERSION.toString());
    }
  },

  migrate: (oldVersion: number) => {
      // Migration from v0/v1 to v2 (Flatten Tasks)
      if (oldVersion < 2) {
          try {
              // Try to read old tasks format (PillarsData object)
              const oldData = localStorage.getItem('game_pillars'); // Old key
              if (oldData) {
                  const pillarsData = JSON.parse(oldData);
                  let allTasks: Task[] = [];
                  // Flatten structure
                  Object.values(pillarsData).forEach((tasksArray: any) => {
                      if (Array.isArray(tasksArray)) {
                          allTasks = [...allTasks, ...tasksArray];
                      }
                  });
                  // Save to new key
                  StorageService.saveTasks(allTasks);
                  // Remove old key to clean up
                  localStorage.removeItem('game_pillars');
                  console.log("Migration V2: Tasks flattened successfully.");
              }
          } catch (e) {
              console.error("Migration V2 Failed:", e);
          }
      }
  },

  // --- GENERIC GET/SET ---
  save: <T>(key: string, data: T): boolean => {
      try {
          localStorage.setItem(key, JSON.stringify(data));
          return true;
      } catch (e) {
          console.error(`Storage Save Error (${key}):`, e);
          return false;
      }
  },

  load: <T>(key: string, fallback: T | null = null): T | null => {
      try {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : fallback;
      } catch (e) {
          console.error(`Storage Load Error (${key}):`, e);
          return fallback;
      }
  },

  // --- ENTITY METHODS ---

  saveProfile: (profile: PlayerProfile) => StorageService.save(KEYS.PLAYER, profile),
  loadProfile: () => StorageService.load<PlayerProfile>(KEYS.PLAYER),

  saveStats: (stats: UserStats) => StorageService.save(KEYS.STATS, stats),
  loadStats: () => {
      const loaded = StorageService.load<UserStats>(KEYS.STATS);
      if (!loaded) return null;
      // Deep merge with default to ensure new fields exist
      return { 
          ...defaultStats, 
          ...loaded, 
          dailyQuest: { ...defaultStats.dailyQuest, ...(loaded.dailyQuest || {}) },
          hunterAttributes: { ...defaultStats.hunterAttributes, ...(loaded.hunterAttributes || {}) }
      };
  },

  // Improved Task Storage: Direct Array
  saveTasks: (tasks: Task[]) => StorageService.save(KEYS.TASKS, tasks),
  loadTasks: () => {
      const tasks = StorageService.load<Task[]>(KEYS.TASKS, []);
      if (!tasks) return [];
      // Ensure order and basic integrity
      return tasks.map((t, i) => ({ ...t, order: t.order ?? i })).sort((a, b) => a.order - b.order);
  },

  saveWeeklyHistory: (h: WeeklyHistory[]) => StorageService.save(KEYS.HISTORY_WEEKLY, h),
  loadWeeklyHistory: () => StorageService.load<WeeklyHistory[]>(KEYS.HISTORY_WEEKLY, []) || [],

  saveMonthlyHistory: (h: MonthlyHistory[]) => StorageService.save(KEYS.HISTORY_MONTHLY, h),
  loadMonthlyHistory: () => StorageService.load<MonthlyHistory[]>(KEYS.HISTORY_MONTHLY, []) || [],

  saveWeeklyReports: (r: WeeklyReport[]) => StorageService.save(KEYS.REPORTS_WEEKLY, r),
  loadWeeklyReports: () => StorageService.load<WeeklyReport[]>(KEYS.REPORTS_WEEKLY, []) || [],

  saveMonthlyReports: (r: MonthlyReport[]) => StorageService.save(KEYS.REPORTS_MONTHLY, r),
  loadMonthlyReports: () => StorageService.load<MonthlyReport[]>(KEYS.REPORTS_MONTHLY, []) || [],

  saveWeeklyRewards: (r: WeeklyReward[]) => StorageService.save(KEYS.REWARDS_WEEKLY, r),
  loadWeeklyRewards: () => StorageService.load<WeeklyReward[]>(KEYS.REWARDS_WEEKLY, []) || [],

  saveMonthlyRewards: (r: MonthlyReward[]) => StorageService.save(KEYS.REWARDS_MONTHLY, r),
  loadMonthlyRewards: () => StorageService.load<MonthlyReward[]>(KEYS.REWARDS_MONTHLY, []) || [],

  saveAchievements: (a: any[]) => StorageService.save(KEYS.ACHIEVEMENTS, a),
  loadAchievements: () => StorageService.load<any[]>(KEYS.ACHIEVEMENTS, []) || [],

  saveSettings: (s: AppSettings) => StorageService.save(KEYS.SETTINGS, s),
  loadSettings: () => {
      const s = StorageService.load<AppSettings>(KEYS.SETTINGS);
      return s ? { ...defaultSettings, ...s } : defaultSettings;
  },

  // --- UTILITY ---

  clearAll: () => {
      Object.values(KEYS).forEach(key => localStorage.removeItem(key));
      // Also clear potential old keys
      localStorage.removeItem('game_pillars'); 
  },

  initializeNewAccount: (profile: PlayerProfile) => {
      StorageService.clearAll();
      StorageService.saveProfile(profile);
      StorageService.saveStats(defaultStats);
      StorageService.saveTasks([]);
      StorageService.saveSettings(defaultSettings);
      localStorage.setItem(KEYS.VERSION, CURRENT_SCHEMA_VERSION.toString());
  },

  // --- BACKUP & RESTORE SYSTEM ---

  createBackup: (): string => {
      const backupData: Record<string, any> = {};
      Object.values(KEYS).forEach(key => {
          const raw = localStorage.getItem(key);
          if (raw) backupData[key] = JSON.parse(raw);
      });
      // Add metadata
      backupData['_backup_date'] = new Date().toISOString();
      backupData['_backup_date_local'] = new Date().toLocaleString();
      backupData['_app_version'] = '1.1.0';
      
      return JSON.stringify(backupData, null, 2);
  },

  restoreBackup: (jsonString: string): boolean => {
      try {
          const data = JSON.parse(jsonString);
          
          // Basic validation
          if (!data[KEYS.PLAYER] || !data[KEYS.STATS]) {
              throw new Error("Invalid backup file: Missing core data.");
          }

          // Clear current data first to avoid conflicts
          StorageService.clearAll();

          // Restore keys
          Object.values(KEYS).forEach(key => {
              if (data[key]) {
                  localStorage.setItem(key, JSON.stringify(data[key]));
              }
          });
          
          return true;
      } catch (e) {
          console.error("Restore failed:", e);
          return false;
      }
  }
};
