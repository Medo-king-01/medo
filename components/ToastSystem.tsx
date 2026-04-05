
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { CheckCircle, AlertCircle, Info, Trophy, X, Medal, Ghost, ShieldAlert } from 'lucide-react';
import { ToastMessage, NotificationDuration } from '../types';

// Helper to get duration in ms
const getDuration = (setting: NotificationDuration): number => {
    switch (setting) {
        case 'short': return 3000;
        case 'medium': return 5000;
        case 'long': return 8000;
        case 'persistent': return 15000; // Very long but eventually dismisses if not critical
        default: return 5000;
    }
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void; durationSetting: NotificationDuration }> = ({ toast, onRemove, durationSetting }) => {
    const [isExiting, setIsExiting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const duration = getDuration(durationSetting);
    
    // Critical toasts do not respect the timer setting unless explicitly dismissed
    const isManual = toast.manualDismiss || durationSetting === 'persistent';

    const startTimer = () => {
        if (isManual) return; // Don't auto-dismiss critical or strictly persistent setting

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            triggerExit();
        }, duration);
    };

    const triggerExit = () => {
        setIsExiting(true);
        setTimeout(() => {
            onRemove(toast.id);
        }, 400); // Match animation duration
    };

    const handleMouseEnter = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        if (!isExiting) {
            startTimer();
        }
    };

    useEffect(() => {
        startTimer();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseEnter} // Pause on touch
            onTouchEnd={handleMouseLeave}
            className={`
                pointer-events-auto flex flex-col p-0 rounded-none shadow-2xl border backdrop-blur-md transition-all duration-500 transform relative overflow-hidden group
                ${isExiting ? 'opacity-0 translate-x-10 scale-95' : 'opacity-100 translate-x-0 scale-100 animate-slide-up'}
                ${toast.type === 'success' ? 'bg-black/90 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}
                ${toast.type === 'hard-success' ? 'bg-black/90 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : ''}
                ${toast.type === 'error' ? 'bg-black/90 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : ''}
                ${toast.type === 'info' ? 'bg-black/90 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}
                ${toast.type === 'level-up' ? 'bg-black/90 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.5)]' : ''}
                ${toast.type === 'badge' ? 'bg-black/90 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : ''}
                ${toast.type === 'shadow' ? 'bg-black/90 border-purple-900 shadow-[0_0_20px_rgba(88,28,135,0.5)]' : ''}
            `}
        >
            {/* System Header Line */}
            <div className={`
                w-full h-1 
                ${toast.type === 'success' ? 'bg-green-500' : ''}
                ${toast.type === 'hard-success' ? 'bg-emerald-400' : ''}
                ${toast.type === 'error' ? 'bg-red-600' : ''}
                ${toast.type === 'info' ? 'bg-red-500' : ''}
                ${toast.type === 'level-up' ? 'bg-yellow-500' : ''}
                ${toast.type === 'badge' ? 'bg-purple-500' : ''}
                ${toast.type === 'shadow' ? 'bg-purple-900' : ''}
            `}></div>

            <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                        {toast.type === 'success' && <CheckCircle className="text-green-500" size={20} />}
                        {toast.type === 'hard-success' && <CheckCircle className="text-emerald-400 animate-pulse" size={20} />}
                        {toast.type === 'error' && <ShieldAlert className="text-red-500 animate-pulse" size={20} />}
                        {toast.type === 'info' && <Info className="text-red-500" size={20} />}
                        {toast.type === 'level-up' && <Trophy className="text-yellow-500 animate-bounce" size={24} />}
                        {toast.type === 'badge' && <Medal className="text-purple-500 animate-pulse" size={24} />}
                        {toast.type === 'shadow' && <Ghost className="text-purple-700 animate-pulse" size={24} />}
                    </div>
                    
                    <div>
                        <p className={`text-[10px] font-mono uppercase tracking-widest mb-1 opacity-70
                            ${toast.type === 'error' ? 'text-red-400' : 'text-red-300'}
                        `}>
                            {toast.type === 'error' ? 'SYSTEM WARNING' : 'SYSTEM NOTIFICATION'}
                        </p>
                        <p className="font-bold text-sm leading-tight text-white font-sans">{toast.message}</p>
                    </div>
                </div>
                
                <button 
                    onClick={triggerExit} 
                    className="text-white/30 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Corner Accents */}
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r 
                ${toast.type === 'error' ? 'border-red-600' : 'border-red-500/50'}
            `}></div>
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l 
                 ${toast.type === 'error' ? 'border-red-600' : 'border-red-500/50'}
            `}></div>
        </div>
    );
};

export const ToastSystem: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const { notificationDuration } = useSettings();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem 
            key={toast.id} 
            toast={toast} 
            onRemove={removeToast} 
            durationSetting={notificationDuration}
        />
      ))}
    </div>
  );
};
