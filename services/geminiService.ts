
import { UserStats, Task, PlayerProfile } from "../types";

/**
 * DEPRECATED: AI Service has been removed for Offline Mode.
 * This file is kept as a placeholder to prevent import errors if any exist,
 * but the logic is now handled by MotivationService (Local).
 */

export const getCoachAdvice = async (stats: UserStats, tasks: Task[], profile: PlayerProfile | null): Promise<string> => {
  return "نظام التحفيز المحلي نشط. راجع قسم 'منشط الحافز' للحصول على رسائل يومية.";
};
