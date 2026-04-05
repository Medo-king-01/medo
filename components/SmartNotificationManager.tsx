
import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { NotificationService } from '../services/notifications';

/**
 * This component doesn't render UI. 
 * It acts as the "Brain" for triggering notifications based on game state.
 */
export const SmartNotificationManager: React.FC = () => {
  const { stats, tasks, playerProfile } = useGame();
  const { notificationsEnabled } = useSettings();
  const { addToast } = useToast();

  // Refs to track state without triggering re-renders loops
  const lastEnergyNotification = useRef<number>(0);
  const lastMorningBrief = useRef<string>('');
  const lastInactivityPing = useRef<number>(Date.now());
  const tasksRef = useRef(tasks); // Keep a ref to access inside closures/events

  // Update ref when tasks change
  useEffect(() => {
      tasksRef.current = tasks;
  }, [tasks]);

  // 1. Energy Full Notification
  useEffect(() => {
    if (!notificationsEnabled || !playerProfile) return;

    // Check if energy is full (or very close)
    if (stats.energy >= stats.maxEnergy) {
      const now = Date.now();
      // Only notify once every 3 hours about full energy to avoid spam
      if (now - lastEnergyNotification.current > 3 * 60 * 60 * 1000) {
        NotificationService.dispatch(
          "⚡ الطاقة مكتملة!",
          "لقد استعدت طاقتك بالكامل. لا تضيع وقت الاستشفاء، أنجز مهامك الآن!",
          addToast,
          'success'
        );
        lastEnergyNotification.current = now;
      }
    }
  }, [stats.energy, stats.maxEnergy, notificationsEnabled, addToast, playerProfile]);

  // 2. Daily Morning Briefing (Checks every time app mounts or hour changes)
  useEffect(() => {
    if (!notificationsEnabled || !playerProfile) return;

    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    const hour = d.getHours();
    
    // Trigger between 6 AM and 11 AM, only once per day
    if (hour >= 6 && hour <= 11 && lastMorningBrief.current !== today) {
      const pendingCount = tasks.filter(t => !t.completed).length;
      
      if (pendingCount > 0) {
        NotificationService.dispatch(
          `صباح الخير يا ${playerProfile.name} ☀️`,
          `لديك ${pendingCount} مهام جاهزة للإنجاز اليوم. لنبدأ الصيد!`,
          addToast,
          'info'
        );
      }
      lastMorningBrief.current = today;
    }
  }, [tasks, notificationsEnabled, playerProfile, addToast]);

  // 3. Periodic Reminder (While App is Open/Backgrounded in memory)
  useEffect(() => {
    if (!notificationsEnabled) return;

    const interval = setInterval(() => {
        const now = Date.now();
        // Check every 2 hours
        if (now - lastInactivityPing.current > 2 * 60 * 60 * 1000) {
            const pendingTasks = tasksRef.current.filter(t => !t.completed);
            
            if (pendingTasks.length > 0) {
                const randomTask = pendingTasks[Math.floor(Math.random() * pendingTasks.length)];
                
                NotificationService.dispatch(
                    "تذكير المهام ⏰",
                    `هل نسيت "${randomTask.title}"؟ الإنجاز ينتظرك.`,
                    addToast,
                    'shadow'
                );
            }
            lastInactivityPing.current = now;
        }
    }, 60000); // Heartbeat check every minute

    return () => clearInterval(interval);
  }, [notificationsEnabled, addToast]);

  // 4. Leave App Listener (Visibility Change)
  // Triggers when user switches tabs or minimizes app to home screen
  useEffect(() => {
    if (!notificationsEnabled) return;

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            const pendingTasks = tasksRef.current.filter(t => !t.completed);
            
            // If user leaves and has many pending tasks (e.g. > 3), send a quick nudge
            if (pendingTasks.length >= 3) {
                 // We force external because the user just hid the app
                 NotificationService.sendExternal(
                     "⚠️ مهام معلقة",
                     `لديك ${pendingTasks.length} مهام لم تنجزها بعد. لا تكسر السلسلة!`
                 );
            }
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [notificationsEnabled]);

  return null;
};
