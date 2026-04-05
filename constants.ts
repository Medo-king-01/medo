
import { BookOpen, Brain, Dumbbell, Briefcase, Gamepad2, Scroll, LucideIcon } from 'lucide-react';
import { PillarType, DayOfWeek, TaskDifficulty, ExerciseCategory, ExerciseLevel, Achievement } from './types';

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'First Blood', description: 'Complete your first task.', icon: 'Sword', condition: 'TASKS_1', targetValue: 1, currentValue: 0, isUnlocked: false, rewardXP: 50 },
  { id: 'a2', title: 'Novice Hunter', description: 'Reach Level 5.', icon: 'Shield', condition: 'LEVEL_5', targetValue: 5, currentValue: 1, isUnlocked: false, rewardXP: 100 },
  { id: 'a3', title: 'Consistency is Key', description: 'Achieve a 7-day streak.', icon: 'Flame', condition: 'STREAK_7', targetValue: 7, currentValue: 0, isUnlocked: false, rewardXP: 200 },
  { id: 'a4', title: 'Task Master', description: 'Complete 100 tasks.', icon: 'Target', condition: 'TASKS_100', targetValue: 100, currentValue: 0, isUnlocked: false, rewardXP: 500 },
  { id: 'a5', title: 'Boss Slayer', description: 'Defeat your first Milestone Boss.', icon: 'Trophy', condition: 'BOSS_1', targetValue: 1, currentValue: 0, isUnlocked: false, rewardXP: 1000 },
  { id: 'a6', title: 'Iron Will', description: 'Complete 50 Exercise tasks.', icon: 'Dumbbell', condition: 'EXERCISE_50', targetValue: 50, currentValue: 0, isUnlocked: false, rewardXP: 300 },
];

export const PILLARS: { id: PillarType; label: string; icon: LucideIcon; color: string; hex: string }[] = [
  { id: 'Quran', label: 'القرآن', icon: Scroll, color: 'text-emerald-400', hex: '#34d399' },
  { id: 'Learning', label: 'التعلم', icon: BookOpen, color: 'text-blue-500', hex: '#3b82f6' },
  { id: 'Studying', label: 'الدراسة', icon: Brain, color: 'text-purple-500', hex: '#a855f7' },
  { id: 'Exercise', label: 'الرياضة', icon: Dumbbell, color: 'text-green-500', hex: '#22c55e' },
  { id: 'Work', label: 'العمل', icon: Briefcase, color: 'text-orange-500', hex: '#f97316' },
  { id: 'Entertainment', label: 'الترفيه', icon: Gamepad2, color: 'text-pink-500', hex: '#ec4899' },
];

export const DAYS_OF_WEEK: { id: DayOfWeek; label: string }[] = [
  { id: 'Saturday', label: 'السبت' },
  { id: 'Sunday', label: 'الأحد' },
  { id: 'Monday', label: 'الاثنين' },
  { id: 'Tuesday', label: 'الثلاثاء' },
  { id: 'Wednesday', label: 'الأربعاء' },
  { id: 'Thursday', label: 'الخميس' },
  { id: 'Friday', label: 'الجمعة' },
];

export const MAX_DAILY_ENERGY = 100;
// Buffed: Recover 8 Energy per hour (Full charge in ~12.5 hours instead of 20)
export const ENERGY_RECOVERY_RATE = 8; 
export const PAGES_PER_JUZ = 20;
export const ENERGY_PER_QURAN_PAGE = 3; 

// 1️⃣ XP Scaling - Smoother curve (was 1.35)
export const XP_SCALING_FACTOR = 1.25; 
// Nerfed Penalty: XP Penalty for Missed Tasks (30% instead of 40%)
export const XP_PENALTY_RATIO = 0.3;
// Nerfed Cap: Max daily XP loss capped at 15% of total (was 25%) - Prevents de-leveling too hard
export const MAX_DAILY_XP_LOSS_PERCENT = 0.15;

// Critical Hit Chance (10%)
export const CRITICAL_HIT_CHANCE = 0.1;
export const CRITICAL_HIT_MULTIPLIER = 1.5;

// New: Fatigue & Atrophy Protocols
export const FATIGUE_THRESHOLD = 3; // Tasks per pillar per day
export const FATIGUE_XP_MULTIPLIER = 0.85;
export const FATIGUE_ENERGY_MULTIPLIER = 1.20;
export const ATROPHY_DAYS_THRESHOLD = 3;
export const ATROPHY_PENALTY = 2; // Stat points lost

// New: Phase II - DDA (Dynamic Difficulty Adjustment)
export const RANK_RESISTANCE_MULTIPLIER: Record<string, { energy: number, xp: number }> = {
  'E': { energy: 1.0, xp: 1.0 },
  'D': { energy: 1.05, xp: 0.95 },
  'C': { energy: 1.10, xp: 0.90 },
  'B': { energy: 1.15, xp: 0.85 },
  'A': { energy: 1.20, xp: 0.80 },
  'S': { energy: 1.25, xp: 0.75 },
  'SS': { energy: 1.30, xp: 0.70 }
};

// New: Phase II - Skill Tree
import { Skill } from './types';
export const SKILL_TREE: Skill[] = [
  { id: 'focus_work', name: 'Deep Focus', description: 'Reduces Work energy cost by 5% per level', maxLevel: 3, currentLevel: 0, effectType: 'ENERGY_DISCOUNT', pillarTarget: 'Work', valuePerLevel: 0.05 },
  { id: 'vitality_boost', name: 'Fast Recovery', description: 'Increases daily energy recovery by 5% per level', maxLevel: 3, currentLevel: 0, effectType: 'RECOVERY_BOOST', pillarTarget: 'ALL', valuePerLevel: 0.05 },
  { id: 'xp_hunter', name: 'XP Hunter', description: 'Increases XP gained from Exercise by 5% per level', maxLevel: 3, currentLevel: 0, effectType: 'XP_BOOST', pillarTarget: 'Exercise', valuePerLevel: 0.05 },
  { id: 'dda_resist', name: 'System Override', description: 'Reduces System Resistance (DDA) by 5% per level', maxLevel: 3, currentLevel: 0, effectType: 'DDA_RESISTANCE', pillarTarget: 'ALL', valuePerLevel: 0.05 },
];

// 2️⃣ Base Economy (Per Difficulty Tier)
// Adjusted multipliers for better risk/reward balance
export const DIFFICULTY_CONFIG: Record<TaskDifficulty, { label: string; multiplier: number; color: string }> = {
    '1': { label: 'مستوى 1 (سهل جداً)', multiplier: 0.8, color: 'text-neutral-500' },
    '2': { label: 'مستوى 2 (سهل)', multiplier: 1.0, color: 'text-green-500' },
    '3': { label: 'مستوى 3 (متوسط)', multiplier: 1.5, color: 'text-blue-500' },
    '4': { label: 'مستوى 4 (صعب)', multiplier: 2.2, color: 'text-purple-500' },
    '5': { label: 'مستوى 5 (شاق)', multiplier: 3.5, color: 'text-red-500' },
};

// 3️⃣ Base Rates Per Pillar (Base D-Rank Values)
export const PILLAR_BASE_RATES: Record<PillarType, { energy: number; xp: number }> = {
  Learning: { energy: 8, xp: 15 },       // Increased XP reward
  Studying: { energy: 10, xp: 18 },      // Increased XP reward
  Exercise: { energy: 12, xp: 25 },      // Reduced energy cost (was 15), Increased XP
  Work: { energy: 10, xp: 20 },          // Reduced energy cost (was 12)
  Entertainment: { energy: -5, xp: 5 },  
  Quran: { energy: -2, xp: 0 },          
};

// 4️⃣ Hunter Rank System
export const RANK_THRESHOLDS: Record<string, number> = {
  'E': 0,
  'D': 1000,
  'C': 3000,
  'B': 6000,
  'A': 10000,
  'S': 15000,
  'SS': 25000
};

export const HUNTER_TITLES: Record<string, { en: string; ar: string; color: string }> = {
  'E': { en: 'E-Rank Hunter', ar: 'صياد مبتدئ', color: 'text-gray-400' },
  'D': { en: 'D-Rank Fighter', ar: 'مقاتل متدرب', color: 'text-green-400' },
  'C': { en: 'C-Rank Pro', ar: 'صياد محترف', color: 'text-blue-400' },
  'B': { en: 'B-Rank Elite', ar: 'قائد نخبة', color: 'text-purple-400' },
  'A': { en: 'A-Rank Knight', ar: 'فارس الظلام', color: 'text-red-400' },
  'S': { en: 'S-Rank Slayer', ar: 'قاهر الذئاب', color: 'text-yellow-400' },
  'SS': { en: 'Shadow Monarch', ar: 'ملك الظلال', color: 'text-purple-500 text-glow-purple' }
};

// --- 🏋️‍♂️ EXERCISE DATABASE V2.0 ---

export interface ExerciseDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  category: ExerciseCategory;
  unit: 'Reps' | 'Time'; // Whether it's counted by repetitions or time
}

export const EXERCISE_DB: ExerciseDefinition[] = [
  // 1. Cardio & Endurance
  { id: 'c_walk', nameEn: 'Walking Fast', nameAr: 'مشي سريع', category: 'Cardio', unit: 'Time' },
  { id: 'c_brisk', nameEn: 'Brisk Walking', nameAr: 'مشي سريع جداً', category: 'Cardio', unit: 'Time' },
  { id: 'c_stairs', nameEn: 'Climbing Stairs', nameAr: 'صعود الدرج', category: 'Cardio', unit: 'Time' },
  { id: 'c_rope', nameEn: 'Rope Jump', nameAr: 'نط الحبل', category: 'Cardio', unit: 'Time' },
  { id: 'c_jacks', nameEn: 'Jumping Jacks', nameAr: 'قفزات التمدد', category: 'Cardio', unit: 'Time' }, // Can be reps but usually timed for cardio flow
  { id: 'c_knees', nameEn: 'High Knees', nameAr: 'رفع الركبتين', category: 'Cardio', unit: 'Time' },
  { id: 'c_mount', nameEn: 'Mountain Climbers', nameAr: 'تسلق الجبل', category: 'Cardio', unit: 'Time' },
  { id: 'c_burpee', nameEn: 'Burpees', nameAr: 'بيربي', category: 'Cardio', unit: 'Reps' }, // Exception: Reps usually
  { id: 'c_box', nameEn: 'Shadow Boxing', nameAr: 'ملاكمة الظل', category: 'Cardio', unit: 'Time' },
  { id: 'c_dance', nameEn: 'Zumba / Dancing', nameAr: 'رقص / زومبا', category: 'Cardio', unit: 'Time' },

  // 2. Strength
  { id: 's_squat', nameEn: 'Squats', nameAr: 'قرفصاء', category: 'Strength', unit: 'Reps' },
  { id: 's_pushup', nameEn: 'Push-Ups', nameAr: 'ضغط', category: 'Strength', unit: 'Reps' },
  { id: 's_bridge', nameEn: 'Glute Bridge', nameAr: 'جسر الحوض', category: 'Strength', unit: 'Reps' },
  { id: 's_plank', nameEn: 'Plank', nameAr: 'تمرين البلانك', category: 'Strength', unit: 'Time' }, // Static hold
  { id: 's_wallsit', nameEn: 'Wall Sit', nameAr: 'الجلوس على الحائط', category: 'Strength', unit: 'Time' },

  // 3. Flexibility
  { id: 'f_hip', nameEn: 'Hip Stretch', nameAr: 'تمدد الورك', category: 'Flexibility', unit: 'Time' },
  { id: 'f_back', nameEn: 'Lower Back Stretch', nameAr: 'تمدد أسفل الظهر', category: 'Flexibility', unit: 'Time' },
  { id: 'f_shoulder', nameEn: 'Shoulder Stretch', nameAr: 'تمدد الكتف', category: 'Flexibility', unit: 'Time' },
  { id: 'f_ankle', nameEn: 'Ankle Stretch', nameAr: 'تمدد الكاحل', category: 'Flexibility', unit: 'Time' },
];

// Logic for calculating Stats based on Difficulty Level
export const EXERCISE_PRESETS: Record<ExerciseCategory, Record<ExerciseLevel, { sets: number; value: number; rest: number; rank: TaskDifficulty }>> = {
  Cardio: {
    Beginner: { sets: 2, value: 30, rest: 30, rank: '2' },     // 30s Work
    Intermediate: { sets: 3, value: 45, rest: 15, rank: '3' }, // 45s Work
    Advanced: { sets: 4, value: 60, rest: 10, rank: '5' }      // 60s Work
  },
  Strength: {
    Beginner: { sets: 2, value: 10, rest: 60, rank: '2' },     // 10 Reps
    Intermediate: { sets: 3, value: 15, rest: 45, rank: '3' }, // 15 Reps
    Advanced: { sets: 4, value: 20, rest: 30, rank: '5' }      // 20 Reps
  },
  Flexibility: {
    Beginner: { sets: 2, value: 20, rest: 10, rank: '1' },     // 20s Hold
    Intermediate: { sets: 2, value: 45, rest: 10, rank: '2' }, // 45s Hold
    Advanced: { sets: 3, value: 60, rest: 10, rank: '3' }      // 60s Hold
  }
};

// Solo Leveling Daily Quest Targets
export const DAILY_QUEST_TARGETS = {
  pushups: 100,
  situps: 100,
  squats: 100,
  run: 10, // 10km
};

export const MOTIVATIONAL_QUOTES = [
  // --- Original Classics ---
  { id: 1, text: "النجاح لا يبدأ بالقوة، بل بالاستمرار.", category: "consistency" },
  { id: 2, text: "ما تفعله كل يوم أهم بكثير مما تفعله أحيانًا.", category: "habits" },
  { id: 3, text: "الانضباط هو الجسر بين الهدف والإنجاز.", category: "discipline" },
  { id: 4, text: "لا تنتظر الدافع، اصنعه بالفعل.", category: "action" },
  { id: 5, text: "التغيير الصغير المتكرر يصنع تحولًا ضخمًا.", category: "growth" },
  { id: 6, text: "أنت لست أفكارك، أنت من يختارها.", category: "mindset" },
  { id: 7, text: "الألم مؤقت، لكن التراجع يترك أثرًا طويلًا.", category: "resilience" },
  { id: 8, text: "السيطرة على وقتك تعني السيطرة على حياتك.", category: "control" },
  { id: 9, text: "العقل يتبع ما تركز عليه باستمرار.", category: "focus" },
  { id: 10, text: "الفشل ليس عكس النجاح، بل جزء منه.", category: "learning" },
  { id: 11, text: "كل عادة تبنيها هي تصويت على الشخص الذي تريد أن تصبحه.", category: "identity" },
  { id: 12, text: "الخوف إشارة، وليس عائقًا.", category: "courage" },
  { id: 13, text: "لا تبحث عن الراحة، بل عن المعنى.", category: "purpose" },
  { id: 14, text: "ما تقاومه يسيطر عليك، وما تفهمه يضعف.", category: "wisdom" },
  { id: 15, text: "العمل في صمت يجعل النتائج تتكلم عنك.", category: "humility" },
  { id: 16, text: "العظمة تبدأ بقرار بسيط: الاستمرار.", category: "consistency" },
  { id: 17, text: "التقدم البطيء أفضل من الثبات.", category: "progress" },
  { id: 18, text: "لا يمكنك التحكم في كل شيء، لكن يمكنك التحكم في رد فعلك.", category: "stoicism" },
  { id: 19, text: "التفكير الواضح أقوى من الموهبة.", category: "clarity" },
  { id: 20, text: "النجاح هو تراكم محاولات لم يراها أحد.", category: "persistence" },
  { id: 21, text: "لا تسمح لعقلك أن يكون عدوك.", category: "mental_health" },
  { id: 22, text: "التركيز هو العملة الحقيقية في عصر التشتت.", category: "focus" },
  { id: 23, text: "الشخص الذي تصبحه أهم من الهدف الذي تحققه.", category: "growth" },
  { id: 24, text: "التغيير الحقيقي يبدأ عندما تتحمل المسؤولية كاملة.", category: "responsibility" },
  { id: 25, text: "الفكرة بلا تنفيذ مجرد وهم جميل.", category: "action" },
  { id: 26, text: "الراحة تسرق الإمكانيات ببطء.", category: "ambition" },
  { id: 27, text: "لا تقارن بدايتك بنهاية غيرك.", category: "focus" },
  { id: 28, text: "ما تكرره داخلك يتحول إلى واقعك.", category: "mindset" },
  { id: 29, text: "الشجاعة ليست غياب الخوف، بل التقدم رغم وجوده.", category: "courage" },
  { id: 30, text: "كل يوم تلتزم فيه، أنت تقترب حتى لو لم تشعر.", category: "faith" },

  // --- 🌟 New System & Hunter Themed Quotes ---
  { id: 31, text: "تحذير النظام: الكسل يؤدي إلى عقوبات في المستقبل.", category: "system" },
  { id: 32, text: "الصياد الحقيقي لا يخشى الوحوش، بل يخشى الركود.", category: "hunter" },
  { id: 33, text: "ألم الانضباط يزن أونصات، بينما ألم الندم يزن أطنانًا.", category: "discipline" },
  { id: 34, text: "لا تتوقف عندما تتعب، توقف عندما تنتهي.", category: "resilience" },
  { id: 35, text: "انهض. (Arise)", category: "power" },
  { id: 36, text: "كل مستوى جديد يتطلب نسخة جديدة منك.", category: "growth" },
  { id: 37, text: "أنت اللاعب الوحيد في قصتك. لا تكن شخصية جانبية.", category: "identity" },
  { id: 38, text: "الوقت لا ينتظر أحدًا. عدّاد حياتك يعمل الآن.", category: "urgency" },
  { id: 39, text: "الفوضى تخلق الفرص للأقوياء فقط.", category: "stoicism" },
  { id: 40, text: "لا تخبر الناس بخططك. أرهم النتائج.", category: "silence" },
  { id: 41, text: "ما زرعته اليوم، ستحصده غدًا كـ XP.", category: "grind" },
  { id: 42, text: "الراحة للموتى. الأحياء يبنون.", category: "legacy" },
  { id: 43, text: "نظامك العقلي هو السلاح الأقوى. طوّره باستمرار.", category: "mindset" },
  { id: 44, text: "الظلام ليس عدوك، إنه المكان الذي يلمع فيه ضوؤك.", category: "hope" },
  { id: 45, text: "اسحق الأعذار قبل أن تسحق أحلامك.", category: "action" },
  { id: 46, text: "تنبيه: طاقتك محدودة، لا تهدرها على التوافه.", category: "system" },
  { id: 47, text: "اليوم هو يوم جيد لتصبح أقوى.", category: "optimism" },
  { id: 48, text: "لن يأتي أحد لإنقاذك. أنت بطلك الوحيد.", category: "responsibility" },
  { id: 49, text: "لا يهم كم تسقط، المهم كم مرة تنهض.", category: "persistence" },
  { id: 50, text: "الوحش الذي تهرب منه اليوم، سيكبر غدًا. واجهه.", category: "courage" }
];
