
import { ToastType } from "../types";
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Debounce Tracking
const sentNotifications = new Map<string, number>();

export const NotificationService = {
  // Initialize Android Channel (Critical for Android 8+)
  init: async () => {
    if (Capacitor.isNativePlatform()) {
        try {
            await LocalNotifications.createChannel({
                id: 'solo_system_channel',
                name: 'System Alerts',
                description: 'Solo Task Leveling Updates',
                importance: 5, // High
                visibility: 1, // Public
                vibration: true,
                sound: 'default' 
            });
        } catch (e) {
            console.warn("Failed to create notification channel", e);
        }
    }
  },

  requestPermission: async (): Promise<boolean> => {
    // 1. Native Mobile (Capacitor)
    if (Capacitor.isNativePlatform()) {
        try {
            const result = await LocalNotifications.requestPermissions();
            if (result.display === 'granted') {
                await NotificationService.init(); // Ensure channel is created upon grant
                return true;
            }
            return false;
        } catch (e) {
            console.warn("Native notification permission failed", e);
            return false;
        }
    }

    // 2. Web Browser
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  /**
   * Sends a notification purely to the system (Browser/OS)
   * Uses Capacitor LocalNotifications for Mobile, and ServiceWorker/Notification API for Web.
   */
  sendExternal: async (title: string, body?: string, isCritical: boolean = false) => {
    // Debounce Check: Prevent duplicate messages within 30 seconds
    const key = `${title}:${body}`;
    const now = Date.now();
    const lastSent = sentNotifications.get(key);
    
    if (lastSent && (now - lastSent < 30000)) {
        return; // Skip duplicate
    }
    sentNotifications.set(key, now);

    // Generate unique ID using milliseconds + random int to prevent collision
    const uniqueId = Number(Date.now().toString().slice(-9)) + Math.floor(Math.random() * 1000);

    // --- Native Path ---
    if (Capacitor.isNativePlatform()) {
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title: title,
                    body: body || '',
                    id: uniqueId, 
                    schedule: { at: new Date(Date.now() + 100) }, // Immediate
                    sound: isCritical ? undefined : undefined, // Use default system sound
                    actionTypeId: "",
                    extra: null,
                    // Use the channel we created
                    channelId: 'solo_system_channel', 
                    smallIcon: "ic_stat_icon_config_sample", 
                    iconColor: "#dc2626"
                }]
            });
        } catch (e) {
            console.error("Native Notification Error:", e);
        }
        return;
    }

    // --- Web Path ---
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const options: any = {
        body: body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2991/2991195.png', // Solo Level Icon style
        badge: 'https://cdn-icons-png.flaticon.com/512/2991/2991195.png', // Badge
        tag: isCritical ? `solo-critical-${uniqueId}` : 'solo-level-game', 
        silent: false,
        vibrate: isCritical ? [500, 200, 500] : [200, 100, 200],
        requireInteraction: isCritical
      };

      try {
        // Try Service Worker (Best for PWA)
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.showNotification(title, options);
                return;
            }
        }

        // Standard Fallback
        new Notification(title, options);
      } catch (e) {
        console.error("Web Notification Error:", e);
      }
    }
  },

  /**
   * Smart Dispatch:
   * - If app is VISIBLE (User is looking at it) -> Show In-App Toast.
   * - If app is HIDDEN (Background/Minimized) -> Show System Notification.
   */
  dispatch: (
    title: string, 
    body: string, 
    addToast: (msg: string, type: ToastType, manualDismiss?: boolean) => void,
    type: ToastType = 'info',
    forceExternal: boolean = false
  ) => {
    // Determine Criticality
    const isCritical = type === 'error' || type === 'level-up' || type === 'shadow';

    // If strictly hidden, or forced external -> System Notification
    if (forceExternal || document.visibilityState === 'hidden') {
        NotificationService.sendExternal(title, body, isCritical);
        return;
    }

    // If Visible -> Use Toast
    addToast(`${title}: ${body}`, type, isCritical);
  }
};
