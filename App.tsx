
import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Dashboard } from './components/Dashboard';
import { PillarsView } from './components/PillarsView';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { AICoach } from './components/AICoach';
import { SettingsScreen } from './components/SettingsScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { StatisticsScreen } from './components/StatisticsScreen';
import { ToastSystem } from './components/ToastSystem';
import { AppTab, PillarType, StackScreen, Task, DayOfWeek } from './types';
import { Settings as SettingsIcon, ArrowRight, Loader2 } from 'lucide-react';
import { LearningScreen, StudyingScreen, ExerciseScreen, WorkScreen, EntertainmentScreen, QuranScreen } from './components/PillarScreens';
import { TaskFormModal } from './components/TaskFormModal';
import { LevelUpModal } from './components/LevelUpModal';
import { SmartNotificationManager } from './components/SmartNotificationManager';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { MotivationService } from './services/motivationService';
import { AudioService } from './services/audioService';
import { NotificationService } from './services/notifications';

// Helper to get current day name in English to match DayOfWeek type
const getCurrentDayOfWeek = (): DayOfWeek => {
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const AppContent: React.FC = () => {
  const { playerProfile, addTask, editTask, isLoaded } = useGame(); // Added isLoaded
  const { t, soundEnabled } = useSettings();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [currentStackScreen, setCurrentStackScreen] = useState<StackScreen>('ROOT');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultPillar, setModalDefaultPillar] = useState<PillarType>('Learning');
  
  const [modalDefaultDay, setModalDefaultDay] = useState<DayOfWeek>(getCurrentDayOfWeek());

  // Navigation Wrappers with Sound
  const handleTabChange = (tab: AppTab) => {
    if (tab !== activeTab) {
        if(soundEnabled) AudioService.playTabSwitch();
        setActiveTab(tab);
    }
  };

  const navigateToPillar = (pillar: PillarType) => {
    if(soundEnabled) AudioService.playTabSwitch();
    setActiveTab(AppTab.PILLARS); 
    setCurrentStackScreen(pillar);
  };

  const handleBack = () => {
    if(soundEnabled) AudioService.playTabSwitch();
    setCurrentStackScreen('ROOT');
    setActiveTab(AppTab.DASHBOARD);
  };

  const goHome = () => {
    if(soundEnabled) AudioService.playTabSwitch();
    setActiveTab(AppTab.DASHBOARD);
    setCurrentStackScreen('ROOT');
  };

  // Hardware Back Button & Lifecycle Handler
  useEffect(() => {
    let backListener: any;
    let stateListener: any;
    
    const setupListeners = async () => {
        // Back Button
        backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (isModalOpen) {
                setIsModalOpen(false);
            } else if (currentStackScreen !== 'ROOT') {
                handleBack();
            } else if (activeTab !== AppTab.DASHBOARD) {
                goHome();
            } else {
                CapacitorApp.exitApp();
            }
        });

        // App State (Resume/Suspend) - Critical for Android Audio
        stateListener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                AudioService.resumeContext();
                NotificationService.init(); // Re-ensure channels
            }
        });

        // Configure Edge-to-Edge Status Bar
        if (Capacitor.isNativePlatform()) {
            try {
                await StatusBar.setOverlaysWebView({ overlay: true });
                await StatusBar.setStyle({ style: Style.Dark });
            } catch (e) {
                console.warn('StatusBar config failed', e);
            }
        }
    };

    setupListeners();
    
    // Initial Channel Setup
    NotificationService.init();

    return () => {
        if (backListener) backListener.remove();
        if (stateListener) stateListener.remove();
    };
  }, [currentStackScreen, activeTab, isModalOpen]);

  // Daily Motivation Check
  useEffect(() => {
    if (playerProfile) {
        const dailyQuote = MotivationService.checkDailyQuote();
        if (dailyQuote) {
            setTimeout(() => {
                addToast(`💡 ${dailyQuote.text}`, 'info');
            }, 1500);
        }
    }
  }, [playerProfile, addToast]);

  const openAddTask = (pillar?: PillarType, day?: DayOfWeek) => {
    setEditingTask(null);
    setModalDefaultPillar(pillar || (currentStackScreen !== 'ROOT' ? (currentStackScreen as PillarType) : 'Learning'));
    setModalDefaultDay(day || getCurrentDayOfWeek());
    setIsModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
        editTask(editingTask.id, taskData);
    } else {
        addTask(taskData);
    }
    setIsModalOpen(false);
  };

  // ⚡ New: Prevent rendering logic until storage is loaded
  useEffect(() => {
      if (isLoaded) {
          SplashScreen.hide().catch(console.warn);
      }
  }, [isLoaded]);

  if (!isLoaded) {
      return (
          <div className="min-h-[100dvh] bg-game-bg text-game-text flex flex-col items-center justify-center font-mono">
              <Loader2 size={48} className="text-game-primary animate-spin mb-4" />
              <p className="text-sm font-bold tracking-[0.3em] uppercase opacity-80 animate-pulse">
                  System Initializing...
              </p>
          </div>
      );
  }

  if (!playerProfile) {
    return (
        <>
            <SignUpScreen />
            <ToastSystem />
        </>
    );
  }

  const renderContent = () => {
    if (currentStackScreen !== 'ROOT') {
        const props = { 
            onBack: handleBack, 
            onAddTask: () => openAddTask(currentStackScreen as PillarType),
            onEditTask: openEditTask
        };
        switch (currentStackScreen) {
            case 'Learning': return <LearningScreen {...props} />;
            case 'Studying': return <StudyingScreen {...props} />;
            case 'Exercise': return <ExerciseScreen {...props} />;
            case 'Work': return <WorkScreen {...props} />;
            case 'Entertainment': return <EntertainmentScreen {...props} />;
            case 'Quran': return <QuranScreen {...props} />;
        }
    }

    switch (activeTab) {
      case AppTab.DASHBOARD: 
        return <Dashboard 
                  onNavigateToPillar={navigateToPillar} 
                  onOpenSettings={() => handleTabChange(AppTab.SETTINGS)} 
                  onNavigateToTab={handleTabChange}
                  onQuickAdd={() => openAddTask()}
               />;
      case AppTab.PLANNER:
        return <WeeklyPlanner onAddTask={(day) => openAddTask(undefined, day)} onEditTask={openEditTask} />;
      case AppTab.PILLARS: 
        return <PillarsView onNavigate={navigateToPillar} />;
      case AppTab.COACH: 
        return <AICoach />;
      case AppTab.STATS:
        return <StatisticsScreen />;
      case AppTab.SETTINGS:
        return <SettingsScreen />;
      default: 
        return <Dashboard 
                  onNavigateToPillar={navigateToPillar} 
                  onOpenSettings={() => handleTabChange(AppTab.SETTINGS)} 
                  onNavigateToTab={handleTabChange}
                  onQuickAdd={() => openAddTask()}
               />;
    }
  };

  return (
    // Changed: Use 'bg-game-bg' and 'text-game-text' to respond to theme changes
    // Added: w-full and md:max-w-md for responsive behavior (full on mobile, centered on tablet)
    <div className="h-full bg-game-bg text-game-text flex justify-center font-sans overflow-hidden transition-colors duration-300">
      <div className="w-full md:max-w-md h-full flex flex-col relative bg-game-bg shadow-2xl overflow-hidden border-x border-game-border md:border-x-2">
        
        {currentStackScreen === 'ROOT' && (
            // Changed: Header uses 'pt-safe' for notch support
            <header className="px-4 pt-4 pb-2 flex justify-between items-end border-b border-game-border bg-game-bg/90 backdrop-blur-md sticky top-0 z-20 min-h-[80px]">
                <div className="flex items-center gap-3 mb-2">
                    {activeTab !== AppTab.DASHBOARD && (
                        <button onClick={goHome} className="text-game-text-muted hover:text-game-text">
                            <ArrowRight size={24} />
                        </button>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tighter leading-none italic select-none">
                            <span className="text-game-text drop-shadow-md">SOLO</span>
                            <span className="text-game-primary drop-shadow-md ml-1">TASK</span>
                        </h1>
                        <span className="text-[7px] font-mono text-game-text-muted tracking-[0.4em] uppercase opacity-80">
                            SYSTEM ACTIVE
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => handleTabChange(AppTab.SETTINGS)} 
                    className={`text-game-text-muted hover:text-game-primary transition-colors mb-2 ${activeTab === AppTab.SETTINGS ? 'text-game-primary' : ''}`}
                >
                    <SettingsIcon size={20} />
                </button>
            </header>
        )}

        <main className="flex-1 overflow-hidden relative w-full">
            {renderContent()}
        </main>

        <TaskFormModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSaveTask}
            initialData={editingTask}
            defaultPillar={modalDefaultPillar}
            defaultDay={modalDefaultDay}
        />
        
        <SmartNotificationManager />
        <ToastSystem />
        <LevelUpModal />

      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
        <ToastProvider>
            <GameProvider>
                <AppContent />
            </GameProvider>
        </ToastProvider>
    </SettingsProvider>
  );
};

export default App;
