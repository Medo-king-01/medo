import { WeeklyReport, MonthlyReport, WeeklyReward, MonthlyReward, BadgeTier, VisualCue } from '../types';

// Helper for safe UUID
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const RewardEngine = {
  
  /**
   * Calculate Weekly Reward based on Report Rating
   */
  generateWeeklyReward: (report: WeeklyReport): WeeklyReward => {
    let xpBonus = 0;
    let badge: BadgeTier = 'GRAY';
    let visualCue: VisualCue = 'DASH';
    let message = "";

    switch (report.rating) {
        case 'Excellent':
            xpBonus = 500;
            badge = 'GOLD';
            visualCue = 'UP_ARROW';
            message = "أداء ممتاز! مكافأة ذهبية.";
            break;
        case 'Consistent':
            xpBonus = 200;
            badge = 'SILVER'; // Using Silver for Consistent/Green context
            visualCue = 'RIGHT_ARROW';
            message = "استمرار جيد، حافظ على هذا النسق.";
            break;
        case 'Unstable':
            xpBonus = 50;
            badge = 'BRONZE'; // Using Bronze for Warning/Yellow context
            visualCue = 'WARNING';
            message = "أداء غير مستقر، حاول التركيز أكثر.";
            break;
        case 'Lazy':
        default:
            xpBonus = 0;
            badge = 'GRAY';
            visualCue = 'DASH';
            message = "لا تيأس، الأسبوع القادم فرصة جديدة.";
            break;
    }

    return {
        id: generateId(),
        reportId: report.weekId,
        xpBonus,
        badge,
        visualCue,
        message,
        createdAt: Date.now()
    };
  },

  /**
   * Calculate Monthly Reward based on Monthly Rating
   */
  generateMonthlyReward: (report: MonthlyReport): MonthlyReward => {
    let xpBonus = 0;
    let badge: BadgeTier = 'GRAY';
    let visualCue: VisualCue = 'GRAY_ICON';
    let message = "";

    switch (report.monthRating) {
        case 'Legend':
            xpBonus = 2000;
            badge = 'LEGENDARY';
            visualCue = 'STAR_GOLD';
            message = "أداء أسطوري! أنت في القمة.";
            break;
        case 'Grinder':
            xpBonus = 1000;
            badge = 'GOLD'; // Rare
            visualCue = 'STAR_SILVER';
            message = "مجهود جبار، مكافأة نادرة.";
            break;
        case 'Survivor':
            xpBonus = 300;
            badge = 'SILVER'; // Standard
            visualCue = 'STAR_BRONZE';
            message = "لقد نجوت هذا الشهر، استمر.";
            break;
        case 'Falling':
        default:
            xpBonus = 0;
            badge = 'GRAY';
            visualCue = 'GRAY_ICON';
            message = "راجع خططك، الشهر القادم أفضل.";
            break;
    }

    return {
        id: generateId(),
        reportId: report.monthId,
        xpBonus,
        badge,
        visualCue,
        message,
        createdAt: Date.now()
    };
  }
};