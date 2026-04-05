
import { MOTIVATIONAL_QUOTES } from "../constants";
import { UserStats, Task } from "../types";

const STORAGE_KEY_LAST_SHOWN = 'motivation_last_shown_date';
const STORAGE_KEY_LAST_QUOTE_ID = 'motivation_last_quote_id';

export interface MotivationalQuote {
    id: number;
    text: string;
    category: string;
}

export const MotivationService = {
    /**
     * CORE LOGIC ENGINE:
     * Analyzes the user's current state (Stats, Time, Tasks) and returns a mathematically relevant quote.
     * No AI, just strict conditional logic.
     */
    getSmartAdvice: (stats: UserStats, tasks: Task[]): MotivationalQuote => {
        const hour = new Date().getHours();
        const pendingTasks = tasks.filter(t => !t.completed).length;
        
        // 1. Critical Energy State (< 20%)
        if (stats.energy <= 20) {
            return MotivationService.getByCategory(['resilience', 'system', 'rest']);
        }

        // 2. High Momentum (Streak > 5)
        if (stats.streak >= 5) {
            return MotivationService.getByCategory(['hunter', 'consistency', 'power']);
        }

        // 3. Broken Streak (Streak 0 but had history)
        // (Logic handled in GameContext mostly, but here we encourage restart)
        if (stats.streak === 0 && stats.level > 1) {
            return MotivationService.getByCategory(['discipline', 'persistence']);
        }

        // 4. Overwhelmed (Many pending tasks)
        if (pendingTasks > 5) {
            return MotivationService.getByCategory(['focus', 'action', 'stoicism']);
        }

        // 5. Time-Based Logic
        // Morning (5 AM - 9 AM) -> Action/Focus
        if (hour >= 5 && hour < 9) {
            return MotivationService.getByCategory(['action', 'focus', 'urgency']);
        }
        // Night (10 PM - 4 AM) -> Reflection/Rest
        if (hour >= 22 || hour < 4) {
            return MotivationService.getByCategory(['wisdom', 'stoicism', 'legacy']);
        }

        // Default: General Growth
        return MotivationService.getRandomQuote();
    },

    /**
     * Helper to filter quotes by specific categories
     */
    getByCategory: (categories: string[]): MotivationalQuote => {
        const pool = MOTIVATIONAL_QUOTES.filter(q => categories.includes(q.category));
        if (pool.length === 0) return MotivationService.getRandomQuote();
        
        const randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
    },

    /**
     * Fallback: Get a random quote avoiding immediate repetition.
     */
    getRandomQuote: (): MotivationalQuote => {
        const lastId = Number(localStorage.getItem(STORAGE_KEY_LAST_QUOTE_ID) || -1);
        const availableQuotes = MOTIVATIONAL_QUOTES.filter(q => q.id !== lastId);
        const randomIndex = Math.floor(Math.random() * availableQuotes.length);
        const selectedQuote = availableQuotes[randomIndex];
        localStorage.setItem(STORAGE_KEY_LAST_QUOTE_ID, selectedQuote.id.toString());
        return selectedQuote;
    },

    /**
     * Daily System Check (First open of the day).
     */
    checkDailyQuote: (): MotivationalQuote | null => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        const lastShownDate = localStorage.getItem(STORAGE_KEY_LAST_SHOWN);

        if (lastShownDate !== today) {
            const quote = MotivationService.getRandomQuote(); // Keep daily random for variety
            localStorage.setItem(STORAGE_KEY_LAST_SHOWN, today);
            return quote;
        }
        return null;
    }
};
