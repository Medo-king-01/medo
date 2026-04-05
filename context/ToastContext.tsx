
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../types';

interface ToastContextType {
  addToast: (message: string, type?: ToastType, manualDismiss?: boolean) => void;
  removeToast: (id: string) => void;
  toasts: ToastMessage[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', manualDismiss: boolean = false) => {
    // If critical types, force manual dismiss
    const isCritical = type === 'level-up' || type === 'error' || type === 'shadow';
    const shouldManualDismiss = manualDismiss || isCritical;

    const id = crypto.randomUUID();
    
    // Prevent too many toasts (Queue Limit: 3)
    setToasts(prev => {
        if (prev.length >= 3) {
            return [...prev.slice(1), { id, message, type, manualDismiss: shouldManualDismiss }];
        }
        return [...prev, { id, message, type, manualDismiss: shouldManualDismiss }];
    });
    
    // Note: Auto-dismiss logic is now handled in the ToastSystem component
    // to allow for pause-on-hover interaction.
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};