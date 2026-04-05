
import React, { useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';
import { useToast } from '../context/ToastContext';
import { Globe, Palette, AlertTriangle, Check, RotateCcw, Bell, Lock, User, Volume2, Smartphone, Monitor, ChevronRight, Edit2, Shield, Activity, Save, X, Clock, VolumeX, Download, Upload, FileText, Database } from 'lucide-react';
import { ThemeColor, NotificationDuration } from '../types';
import { AudioService } from '../services/audioService';
import { NotificationService } from '../services/notifications';
import { BatteryOptimization } from '@capawesome-team/capacitor-android-battery-optimization';
import { Capacitor } from '@capacitor/core';

export const SettingsScreen: React.FC = () => {
  const { language, themeColor, darkMode, notificationsEnabled, notificationDuration, soundEnabled, soundVolume, hapticsEnabled, storagePermissionGranted, backupEnabled, timeSyncEnabled, updateSettings, toggleNotifications, t } = useSettings();
  const { playerProfile, updateProfile, resetProgress, exportSaveData, importSaveData } = useGame();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importDataContent, setImportDataContent] = useState<string | null>(null);
  const [tempProfile, setTempProfile] = useState({
      name: playerProfile?.name || '',
      age: playerProfile?.age || 0,
      height: playerProfile?.height || 0,
      weight: playerProfile?.weight || 0
  });
  const [isBatteryOptimized, setIsBatteryOptimized] = useState(false);

  React.useEffect(() => {
      const checkBattery = async () => {
          if (Capacitor.isNativePlatform()) {
              try {
                  const { isIgnoringBatteryOptimizations } = await BatteryOptimization.isIgnoringBatteryOptimizations();
                  setIsBatteryOptimized(!isIgnoringBatteryOptimizations);
              } catch (e) {
                  console.warn('Battery optimization check failed', e);
              }
          }
      };
      checkBattery();
  }, []);

  const handleBatteryOptimization = async () => {
      if (Capacitor.isNativePlatform()) {
          try {
              await BatteryOptimization.requestIgnoreBatteryOptimizations();
              const { isIgnoringBatteryOptimizations } = await BatteryOptimization.isIgnoringBatteryOptimizations();
              setIsBatteryOptimized(!isIgnoringBatteryOptimizations);
              if (isIgnoringBatteryOptimizations) {
                  addToast(t('batteryOptDisabled' as any) || 'Battery optimization disabled', 'success');
              }
          } catch (e) {
              console.warn('Battery optimization request failed', e);
          }
      }
  };

  const themes: { id: ThemeColor; color: string; label: string }[] = [
    { id: 'red-black', color: '#ef4444', label: 'Red & Black' },
    { id: 'blue-dark', color: '#3b82f6', label: 'Blue & Dark' },
    { id: 'green-matrix', color: '#00f763', label: 'Matrix Green' },
    { id: 'purple-royal', color: '#d946ef', label: 'Royal Purple' },
    { id: 'pink-white', color: '#ff4d8d', label: 'Pink & White' },
  ];

  const handleNotificationClick = async () => {
    const targetState = !notificationsEnabled;
    if(soundEnabled) AudioService.playToggle(targetState);
    
    if (targetState) {
        const granted = await NotificationService.requestPermission();
        if (granted) {
            updateSettings({ notificationsEnabled: true });
            NotificationService.sendExternal("Solo Level", "System Online: Notifications Active");
            addToast("تم تفعيل الإشعارات", 'success');
        } else {
            addToast("تم رفض الإذن", 'error');
            updateSettings({ notificationsEnabled: false });
        }
    } else {
        updateSettings({ notificationsEnabled: false });
        addToast("تم إيقاف الإشعارات", 'info');
    }
  };

  const handleDurationChange = (duration: NotificationDuration) => {
      if(soundEnabled) AudioService.playClick();
      updateSettings({ notificationDuration: duration });
      setTimeout(() => addToast(`Updated duration to ${duration}`, 'info'), 100);
  };

  const handleHapticsToggle = () => {
      if(soundEnabled) AudioService.playToggle(!hapticsEnabled);
      updateSettings({ hapticsEnabled: !hapticsEnabled });
  };

  const saveProfileChanges = () => {
      if(soundEnabled) AudioService.playClick();
      updateProfile(tempProfile);
      setIsEditingProfile(false);
  };

  const toggleEditProfile = (edit: boolean) => {
      if(soundEnabled) AudioService.playClick();
      setIsEditingProfile(edit);
  };

  const changeTheme = (id: ThemeColor) => {
      if(soundEnabled) AudioService.playClick();
      updateSettings({ themeColor: id });
  };

  const changeLanguage = (lang: 'ar' | 'en') => {
      if(soundEnabled) AudioService.playClick();
      updateSettings({ language: lang });
  };

  const handleExport = () => {
      const data = exportSaveData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      link.download = `solotask_backup_${year}-${month}-${day}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if(soundEnabled) AudioService.playClick();
      addToast("تم حفظ النسخة في التنزيلات", "success");
  };

  const handleImportClick = () => {
      if(fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              setImportDataContent(content);
              setShowImportConfirm(true);
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleStoragePermission = async () => {
      if (soundEnabled) AudioService.playClick();
      if (navigator.storage && navigator.storage.persist) {
          const isPersisted = await navigator.storage.persist();
          updateSettings({ storagePermissionGranted: isPersisted });
          if (isPersisted) {
              addToast("تم منح إذن التخزين الدائم بنجاح", "success");
          } else {
              addToast("لم يتم منح إذن التخزين الدائم من قبل المتصفح", "error");
          }
      } else {
          addToast("ميزة التخزين الدائم غير مدعومة في هذا المتصفح", "info");
      }
  };

  const handleBackupToggle = () => {
      if (soundEnabled) AudioService.playToggle(!backupEnabled);
      updateSettings({ backupEnabled: !backupEnabled });
      if (!backupEnabled) {
          addToast("تم تفعيل النسخ الاحتياطي التلقائي", "success");
      } else {
          addToast("تم إيقاف النسخ الاحتياطي التلقائي", "info");
      }
  };

  const handleTimeSyncToggle = () => {
      if (soundEnabled) AudioService.playToggle(!timeSyncEnabled);
      updateSettings({ timeSyncEnabled: !timeSyncEnabled });
      if (!timeSyncEnabled) {
          addToast("تم تفعيل مزامنة الوقت مع النظام", "success");
      } else {
          addToast("تم إيقاف مزامنة الوقت", "info");
      }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 animate-fade-in bg-game-bg text-game-text">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-game-bg/90 backdrop-blur-md p-4 border-b border-game-primary/30 flex items-center gap-3">
          <Monitor className="text-game-primary" size={24} />
          <h2 className="text-2xl font-black text-game-text uppercase tracking-tighter">{t('settingsScreen')}</h2>
      </div>

      <div className="p-4 space-y-6">

        {/* 1. Profile Section */}
        <div className="bg-game-surface border border-game-primary/30 rounded-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield size={100} className="text-game-primary" />
            </div>
            
            <div className="p-4 border-b border-game-primary/30 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-game-primary">
                    <User size={18} />
                    <h3 className="font-bold text-sm uppercase tracking-widest">{t('profileSettings')}</h3>
                </div>
                {!isEditingProfile ? (
                    <button onClick={() => toggleEditProfile(true)} className="p-2 bg-game-primary-dim/10 rounded-none hover:text-game-text text-game-text-muted transition-colors">
                        <Edit2 size={16} />
                    </button>
                ) : (
                     <div className="flex gap-2">
                        <button onClick={() => toggleEditProfile(false)} className="p-2 bg-game-primary-dim/10 rounded-none text-game-primary hover:bg-game-primary-dim/20">
                            <X size={16} />
                        </button>
                        <button onClick={saveProfileChanges} className="p-2 bg-green-900/50 rounded-none text-green-400 hover:bg-green-900/80 border border-green-800">
                            <Save size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="p-4 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-game-primary-dim/20 to-game-bg rounded-full border-2 border-game-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--color-primary),0.3)]">
                        <User size={32} className="text-game-primary" />
                    </div>
                    <div className="flex-1">
                        {isEditingProfile ? (
                            <input 
                                type="text" 
                                value={tempProfile.name}
                                onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                                className="bg-game-bg border border-game-primary/30 rounded-none px-2 py-1 text-game-text font-bold w-full focus:border-game-primary outline-none"
                            />
                        ) : (
                            <h2 className="text-xl font-black text-game-text">{playerProfile?.name}</h2>
                        )}
                        <p className="text-xs text-game-primary font-mono uppercase tracking-widest">{t('jobTitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-game-bg/40 p-2 rounded-none border border-game-primary/30 text-center">
                        <span className="text-[10px] text-game-text-muted uppercase block mb-1">{t('age')}</span>
                        {isEditingProfile ? (
                            <input 
                                type="number" 
                                value={tempProfile.age}
                                onChange={(e) => setTempProfile({...tempProfile, age: Number(e.target.value)})}
                                className="bg-game-bg w-full text-center text-sm font-bold text-game-text outline-none rounded-none"
                            />
                        ) : (
                            <span className="text-lg font-bold text-game-text">{playerProfile?.age}</span>
                        )}
                    </div>
                    <div className="bg-game-bg/40 p-2 rounded-none border border-game-primary/30 text-center">
                        <span className="text-[10px] text-game-text-muted uppercase block mb-1">{t('height')}</span>
                        {isEditingProfile ? (
                             <input 
                                type="number" 
                                value={tempProfile.height}
                                onChange={(e) => setTempProfile({...tempProfile, height: Number(e.target.value)})}
                                className="bg-game-bg w-full text-center text-sm font-bold text-game-text outline-none rounded-none"
                            />
                        ) : (
                             <span className="text-lg font-bold text-game-text">{playerProfile?.height} <span className="text-[10px]">{t('cm')}</span></span>
                        )}
                    </div>
                    <div className="bg-game-bg/40 p-2 rounded-none border border-game-primary/30 text-center">
                        <span className="text-[10px] text-game-text-muted uppercase block mb-1">{t('weight')}</span>
                        {isEditingProfile ? (
                             <input 
                                type="number" 
                                value={tempProfile.weight}
                                onChange={(e) => setTempProfile({...tempProfile, weight: Number(e.target.value)})}
                                className="bg-game-bg w-full text-center text-sm font-bold text-game-text outline-none rounded-none"
                            />
                        ) : (
                            <span className="text-lg font-bold text-game-text">{playerProfile?.weight} <span className="text-[10px]">{t('kg')}</span></span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* 2. System Settings */}
        <div className="bg-game-surface border border-game-primary/30 rounded-none overflow-hidden">
             <div className="p-4 border-b border-game-primary/30 flex items-center gap-2 text-game-primary">
                <Activity size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('systemSettings')}</h3>
            </div>

            <div className="divide-y divide-game-primary/30">
                {/* Notifications */}
                <button 
                    onClick={handleNotificationClick}
                    className="w-full p-4 flex items-center justify-between hover:bg-game-primary-dim/10 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-none ${notificationsEnabled ? 'bg-green-900/20 text-green-500' : 'bg-game-primary-dim/10 text-game-text-muted'}`}>
                            <Bell size={18} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-sm text-game-text">{t('notifications')}</p>
                            <p className="text-[10px] text-game-text-muted">{t('notificationsDesc')}</p>
                        </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${notificationsEnabled ? 'bg-green-600' : 'bg-game-primary-dim/30'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notificationsEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                    </div>
                </button>

                {/* Notification Duration */}
                <div className="p-4 flex flex-col gap-3 bg-game-bg/20">
                     <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-none bg-game-primary-dim/10 text-game-text-muted">
                            <Clock size={18} />
                        </div>
                        <p className="font-bold text-sm text-game-text">{t('alertDuration')}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {(['short', 'medium', 'long', 'persistent'] as NotificationDuration[]).map(d => (
                            <button
                                key={d}
                                onClick={() => handleDurationChange(d)}
                                className={`
                                    py-2 rounded-none text-[10px] font-bold uppercase transition-all border
                                    ${notificationDuration === d 
                                        ? 'bg-game-primary-dim/20 text-game-text border-game-primary' 
                                        : 'bg-game-bg text-game-text-muted border-game-primary/30 hover:border-game-primary/50'}
                                `}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                 {/* Volume Control */}
                 <div className="w-full p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-none bg-game-primary-dim/10 text-game-text-muted">
                                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </div>
                            <p className="font-bold text-sm text-game-text">{t('soundEffects')}</p>
                        </div>
                        <span className="text-xs font-mono text-game-text-muted">{(soundVolume * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                if(soundEnabled) AudioService.playToggle(!soundEnabled);
                                updateSettings({ soundEnabled: !soundEnabled });
                            }}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${soundEnabled ? 'bg-game-primary' : 'bg-game-primary-dim/30'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${soundEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                        </button>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05"
                            value={soundVolume}
                            onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value), soundEnabled: true })}
                            className="flex-1 h-2 bg-game-primary-dim/30 rounded-lg appearance-none cursor-pointer accent-game-primary"
                        />
                    </div>
                </div>

                {/* Haptics */}
                 <button 
                    onClick={handleHapticsToggle}
                    className="w-full p-4 flex items-center justify-between hover:bg-game-primary-dim/10 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-none bg-game-primary-dim/10 text-game-text-muted">
                            <Smartphone size={18} />
                        </div>
                        <p className="font-bold text-sm text-game-text">{t('hapticFeedback')}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${hapticsEnabled ? 'bg-game-primary' : 'bg-game-primary-dim/30'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${hapticsEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                    </div>
                </button>

                {/* Language */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-none bg-game-primary-dim/10 text-game-text-muted">
                            <Globe size={18} />
                        </div>
                        <p className="font-bold text-sm text-game-text">{t('language')}</p>
                    </div>
                    <div className="flex bg-game-bg rounded-none p-1 border border-game-primary/30">
                        <button 
                            onClick={() => changeLanguage('ar')}
                            className={`px-3 py-1 rounded-none text-xs font-bold transition-colors ${language === 'ar' ? 'bg-game-primary text-game-text' : 'text-game-text-muted hover:text-game-text'}`}
                        >
                            AR
                        </button>
                        <button 
                             onClick={() => changeLanguage('en')}
                             className={`px-3 py-1 rounded-none text-xs font-bold transition-colors ${language === 'en' ? 'bg-game-primary text-game-text' : 'text-game-text-muted hover:text-game-text'}`}
                        >
                            EN
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. System Permissions */}
        <div className="bg-game-surface border border-game-primary/30 rounded-none overflow-hidden p-4">
             <div className="flex items-center gap-2 mb-4 text-green-500">
                <Shield size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('systemPermissions')}</h3>
            </div>
            
            <div className="space-y-4">
                {/* Notifications Permission */}
                <div className="flex items-start justify-between bg-game-bg/40 p-3 rounded-none border border-game-primary/30">
                    <div className="flex gap-3">
                        <Bell size={18} className="text-game-text-muted mt-1" />
                        <div>
                            <h4 className="text-xs font-bold text-game-text">{t('notifications')}</h4>
                            <p className="text-[10px] text-game-text-muted leading-tight mt-1 max-w-[200px]">
                                {t('notificationsDesc')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleNotificationClick}
                        className={`text-[9px] font-bold px-3 py-1.5 rounded-none border uppercase transition-colors ${notificationsEnabled ? 'text-green-400 border-green-900 bg-green-900/20 hover:bg-green-900/40' : 'text-game-primary border-game-primary-dim bg-game-primary-dim/20 hover:bg-game-primary-dim/40'}`}
                    >
                        {notificationsEnabled ? t('enabled') : t('enable')}
                    </button>
                </div>

                {/* Battery Optimization (Android Only) */}
                {Capacitor.isNativePlatform() && (
                    <div className="flex items-start justify-between bg-game-bg/40 p-3 rounded-none border border-game-primary/30">
                        <div className="flex gap-3">
                            <Activity size={18} className="text-game-text-muted mt-1" />
                            <div>
                                <h4 className="text-xs font-bold text-game-text">{t('batteryOptimization' as any) || 'Battery Optimization'}</h4>
                                <p className="text-[10px] text-game-text-muted leading-tight mt-1 max-w-[200px]">
                                    {t('batteryOptimizationDesc' as any) || 'Disable to ensure notifications arrive exactly on time.'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleBatteryOptimization}
                            className={`text-[9px] font-bold px-3 py-1.5 rounded-none border uppercase transition-colors ${!isBatteryOptimized ? 'text-green-400 border-green-900 bg-green-900/20 hover:bg-green-900/40' : 'text-yellow-400 border-yellow-900 bg-yellow-900/20 hover:bg-yellow-900/40'}`}
                        >
                            {!isBatteryOptimized ? (t('disabled' as any) || 'DISABLED') : (t('disable' as any) || 'DISABLE')}
                        </button>
                    </div>
                )}

                {/* Storage Permission */}
                <div className="flex items-start justify-between bg-game-bg/40 p-3 rounded-none border border-game-primary/30">
                    <div className="flex gap-3">
                        <Database size={18} className="text-game-text-muted mt-1" />
                        <div>
                            <h4 className="text-xs font-bold text-game-text">{t('persistentStorage')}</h4>
                            <p className="text-[10px] text-game-text-muted leading-tight mt-1 max-w-[200px]">
                                {t('persistentStorageDesc')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleStoragePermission}
                        className={`text-[9px] font-bold px-3 py-1.5 rounded-none border uppercase transition-colors ${storagePermissionGranted ? 'text-green-400 border-green-900 bg-green-900/20 hover:bg-green-900/40' : 'text-yellow-400 border-yellow-900 bg-yellow-900/20 hover:bg-yellow-900/40'}`}
                    >
                        {storagePermissionGranted ? t('granted') : t('requestPerm')}
                    </button>
                </div>

                {/* Time Sync Permission */}
                <div className="flex items-start justify-between bg-game-bg/40 p-3 rounded-none border border-game-primary/30">
                    <div className="flex gap-3">
                        <Clock size={18} className="text-game-text-muted mt-1" />
                        <div>
                            <h4 className="text-xs font-bold text-game-text">{t('permTimeSync')}</h4>
                            <p className="text-[10px] text-game-text-muted leading-tight mt-1 max-w-[200px]">
                                {t('permTimeSyncDesc')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleTimeSyncToggle}
                        className={`text-[9px] font-bold px-3 py-1.5 rounded-none border uppercase transition-colors ${timeSyncEnabled ? 'text-green-400 border-green-900 bg-green-900/20 hover:bg-green-900/40' : 'text-game-text-muted border-game-primary/30 bg-game-bg hover:bg-game-primary-dim/10'}`}
                    >
                        {timeSyncEnabled ? t('enabled') : t('enable')}
                    </button>
                </div>

                {/* Auto Backup Permission */}
                <div className="flex items-start justify-between bg-game-bg/40 p-3 rounded-none border border-game-primary/30">
                    <div className="flex gap-3">
                        <Save size={18} className="text-game-text-muted mt-1" />
                        <div>
                            <h4 className="text-xs font-bold text-game-text">{t('permAutoBackup')}</h4>
                            <p className="text-[10px] text-game-text-muted leading-tight mt-1 max-w-[200px]">
                                {t('permAutoBackupDesc')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleBackupToggle}
                        className={`text-[9px] font-bold px-3 py-1.5 rounded-none border uppercase transition-colors ${backupEnabled ? 'text-green-400 border-green-900 bg-green-900/20 hover:bg-green-900/40' : 'text-game-text-muted border-game-primary/30 bg-game-bg hover:bg-game-primary-dim/10'}`}
                    >
                        {backupEnabled ? t('enabled') : t('enable')}
                    </button>
                </div>
            </div>
        </div>

        {/* 4. Visuals */}
        <div className="bg-game-surface border border-game-primary/30 rounded-none overflow-hidden p-4">
             <div className="flex items-center gap-2 mb-4 text-game-primary">
                <Palette size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('theme')}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {themes.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => changeTheme(theme.id)}
                        className={`
                            relative h-16 rounded-none overflow-hidden transition-all border-2
                            ${themeColor === theme.id ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}
                        `}
                        style={{ backgroundColor: theme.color }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                             <span className="text-white font-bold text-xs">{theme.label}</span>
                             {themeColor === theme.id && <Check size={14} className="ml-auto text-white" />}
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* 5. Backup & Data */}
        <div className="bg-game-surface border border-game-primary/30 rounded-none overflow-hidden p-4">
             <div className="flex items-center gap-2 mb-4 text-blue-400">
                <Save size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('dataManagement')}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleExport}
                    className="flex flex-col items-center justify-center gap-2 bg-game-primary-dim/10 p-4 rounded-none hover:bg-game-bg border border-game-primary/30 transition-colors"
                >
                    <Download size={20} className="text-blue-400" />
                    <span className="text-xs font-bold text-game-text">{t('exportBackup')}</span>
                </button>
                
                <button
                    onClick={handleImportClick}
                    className="flex flex-col items-center justify-center gap-2 bg-game-primary-dim/10 p-4 rounded-none hover:bg-game-bg border border-game-primary/30 transition-colors"
                >
                    <Upload size={20} className="text-yellow-400" />
                    <span className="text-xs font-bold text-game-text">{t('importBackup')}</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".json"
                />
            </div>
        </div>

        {/* 6. Danger Zone */}
         <div className="bg-red-950/20 border border-red-900/50 rounded-none overflow-hidden p-4">
             <div className="flex items-center gap-2 mb-4 text-red-500">
                <AlertTriangle size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('dangerZone')}</h3>
            </div>
             <button 
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-900/20 text-red-500 p-3 rounded-none border border-red-900/50 hover:bg-red-900/40 transition-colors"
            >
                <RotateCcw size={16} />
                <span className="font-bold text-sm">{t('resetProgress')}</span>
            </button>
         </div>

         <div className="text-center">
            <p className="text-[10px] text-game-text-muted font-mono">{t('systemVersion')}</p>
         </div>

      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-game-surface border border-red-900/50 rounded-none w-full max-w-sm overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <div className="p-4 border-b border-red-900/30 bg-red-950/20 flex items-center gap-3">
                    <AlertTriangle className="text-red-500" size={24} />
                    <h3 className="font-black text-red-500 uppercase tracking-widest">تحذير النظام</h3>
                </div>
                <div className="p-6">
                    <p className="text-game-text text-sm leading-relaxed mb-6 font-mono">
                        هل أنت متأكد من حذف الحساب وإعادة البدء؟ سيتم مسح جميع البيانات بشكل نهائي.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowResetConfirm(false)}
                            className="flex-1 py-3 bg-game-bg border border-game-primary/30 text-game-text-muted font-bold uppercase tracking-widest hover:bg-game-primary-dim/10 hover:text-game-text transition-colors rounded-none"
                        >
                            إلغاء
                        </button>
                        <button 
                            onClick={() => {
                                setShowResetConfirm(false);
                                resetProgress();
                            }}
                            className="flex-1 py-3 bg-red-900/20 border border-red-900 text-red-500 font-bold uppercase tracking-widest hover:bg-red-900/40 transition-colors rounded-none"
                        >
                            تأكيد الحذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showImportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-game-surface border border-yellow-900/50 rounded-none w-full max-w-sm overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                <div className="p-4 border-b border-yellow-900/30 bg-yellow-950/20 flex items-center gap-3">
                    <AlertTriangle className="text-yellow-500" size={24} />
                    <h3 className="font-black text-yellow-500 uppercase tracking-widest">تحذير الاستعادة</h3>
                </div>
                <div className="p-6">
                    <p className="text-game-text text-sm leading-relaxed mb-6 font-mono">
                        تحذير: استعادة النسخة الاحتياطية ستقوم بحذف بياناتك الحالية واستبدالها. هل أنت متأكد؟
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                setShowImportConfirm(false);
                                setImportDataContent(null);
                            }}
                            className="flex-1 py-3 bg-game-bg border border-game-primary/30 text-game-text-muted font-bold uppercase tracking-widest hover:bg-game-primary-dim/10 hover:text-game-text transition-colors rounded-none"
                        >
                            إلغاء
                        </button>
                        <button 
                            onClick={() => {
                                setShowImportConfirm(false);
                                if (importDataContent) {
                                    importSaveData(importDataContent);
                                    setImportDataContent(null);
                                }
                            }}
                            className="flex-1 py-3 bg-yellow-900/20 border border-yellow-900 text-yellow-500 font-bold uppercase tracking-widest hover:bg-yellow-900/40 transition-colors rounded-none"
                        >
                            تأكيد
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
