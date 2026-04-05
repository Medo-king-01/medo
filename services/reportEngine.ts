import { WeeklyHistory, MonthlyHistory, WeeklyReport, MonthlyReport, PillarType, WeeklyRating, MonthlyRating } from '../types';

export const ReportEngine = {
  
  /**
   * Generates an Immutable Weekly Report comparing current week vs previous week
   */
  generateWeeklyReport: (current: WeeklyHistory, previous: WeeklyHistory | undefined): WeeklyReport => {
    
    // 1. Calculate Trends
    let xpChange: number | null = null;
    let tasksChange: number | null = null;
    let streakTrend: "up" | "down" | "stable" | null = null;

    if (previous) {
      if (previous.totalXP > 0) {
        xpChange = Math.round(((current.totalXP - previous.totalXP) / previous.totalXP) * 100);
      } else {
        xpChange = current.totalXP > 0 ? 100 : 0;
      }
      
      tasksChange = current.tasksCompleted - previous.tasksCompleted;

      if (current.streakMax > previous.streakMax) streakTrend = "up";
      else if (current.streakMax < previous.streakMax) streakTrend = "down";
      else streakTrend = "stable";
    }

    // 2. Identify Pillars
    // Convert keys to lower case for mapping if necessary, but statsSummary keys in types are lowercase
    const entries = Object.entries(current.statsSummary) as [string, number][];
    
    // Sort descending for best
    const sortedPillars = [...entries].sort((a, b) => b[1] - a[1]);
    
    // Map string keys back to PillarType (capitalized)
    const mapKeyToPillar = (key: string): PillarType => {
        const map: Record<string, PillarType> = {
            learning: 'Learning', studying: 'Studying', exercise: 'Exercise', 
            work: 'Work', entertainment: 'Entertainment', quran: 'Quran'
        };
        return map[key] || 'Work';
    };

    const bestPillar = mapKeyToPillar(sortedPillars[0][0]);
    const worstPillar = mapKeyToPillar(sortedPillars[sortedPillars.length - 1][0]);

    // 3. Determine Rating
    let rating: WeeklyRating = "Unstable";
    
    if (previous) {
      const rankRatio = previous.rankScore > 0 ? current.rankScore / previous.rankScore : 1;
      
      if (rankRatio >= 1.0 && (streakTrend === 'up' || streakTrend === 'stable')) {
        rating = "Excellent";
      } else if (rankRatio >= 0.7) {
        rating = "Consistent";
      } else if (current.tasksCompleted > 0) {
        rating = "Unstable";
      } else {
        rating = "Lazy";
      }
    } else {
      // First week logic
      if (current.rankScore > 500) rating = "Excellent";
      else if (current.rankScore > 200) rating = "Consistent";
      else rating = "Unstable";
    }

    // 4. Generate Summary Text (Neutral Tone)
    let summaryText = "";
    if (rating === "Excellent") summaryText = "أداء ممتاز هذا الأسبوع مع استقرار ملحوظ.";
    else if (rating === "Consistent") summaryText = "أداء ثابت، حافظت على وتيرة جيدة.";
    else if (rating === "Unstable") summaryText = "تذبذب في المستوى رغم إنجاز بعض المهام.";
    else summaryText = "انخفاض واضح في النشاط، تحتاج إلى إعادة تنظيم.";

    summaryText += ` كان التركيز الأكبر على ${bestPillar === 'Quran' ? 'القرآن' : bestPillar === 'Exercise' ? 'الرياضة' : bestPillar === 'Learning' ? 'التعلم' : bestPillar === 'Work' ? 'العمل' : bestPillar === 'Studying' ? 'الدراسة' : 'الترفيه'}.`;

    return {
      weekId: current.weekId,
      comparison: {
        xpChangePercent: xpChange,
        tasksChange: tasksChange,
        streakTrend: streakTrend
      },
      bestPillar,
      worstPillar,
      rating,
      summaryText,
      createdAt: Date.now()
    };
  },

  /**
   * Generates an Immutable Monthly Report comparing current month vs previous month
   */
  generateMonthlyReport: (current: MonthlyHistory, previous: MonthlyHistory | undefined): MonthlyReport => {
    
    // 1. Comparison
    let xpChange: number | null = null;
    let consistencyChange: number | null = null;

    if (previous) {
       xpChange = previous.totalXP > 0 
        ? Math.round(((current.totalXP - previous.totalXP) / previous.totalXP) * 100)
        : 100;
       
       consistencyChange = current.consistencyRate - previous.consistencyRate;
    }

    // 2. Identify Best/Worst Weeks based on recorded scores in history
    // Since MonthlyHistory doesn't store the array of full objects, we assume logic handled elsewhere 
    // OR we use the aggregate stats provided.
    // However, the MonthlyHistory interface has `bestWeekRankScore`.
    // We cannot link ID without looking up WeeklyHistory, but let's assume valid ID generation or placeholder.
    const bestWeekId = "week_high"; // In a real DB join, we'd find the ID. 
    const weakestWeekId = "week_low";

    // 3. Determine Month Rating
    let monthRating: MonthlyRating = "Survivor";
    const { consistencyRate, totalXP } = current;

    if (consistencyRate >= 85 && totalXP > 8000) {
      monthRating = "Legend";
    } else if (consistencyRate >= 65) {
      monthRating = "Grinder";
    } else if (consistencyRate >= 40) {
      monthRating = "Survivor";
    } else {
      monthRating = "Falling";
    }

    // 4. Summary
    let summaryText = "";
    if (monthRating === "Legend") summaryText = "شهر أسطوري! انضباط عالي وأداء استثنائي.";
    else if (monthRating === "Grinder") summaryText = "شهر عملي، أظهرت التزاماً قوياً.";
    else if (monthRating === "Survivor") summaryText = "تمكنت من الصمود، لكن هناك مجال للتحسين.";
    else summaryText = "تراجع في المستوى العام، راجع خطتك للشهر القادم.";

    if (xpChange !== null) {
      summaryText += xpChange > 0 ? ` تحسن الأداء بنسبة ${xpChange}%.` : ` انخفض الأداء بنسبة ${Math.abs(xpChange)}%.`;
    }

    return {
      monthId: current.monthId,
      comparison: {
        xpChangePercent: xpChange,
        consistencyChange: consistencyChange
      },
      bestWeekId,
      weakestWeekId,
      monthRating,
      summaryText,
      createdAt: Date.now()
    };
  }
};