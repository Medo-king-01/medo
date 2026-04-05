
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { User, Ruler, Weight, ArrowRight, Activity, Cpu, Shield, Zap, Fingerprint } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { AudioService } from '../services/audioService';

export const SignUpScreen: React.FC = () => {
  const { createProfile } = useGame();
  const { t, soundEnabled } = useSettings();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
    weight: ''
  });

  const [isScanned, setIsScanned] = useState(false);

  useEffect(() => {
      // Intro Animation Trigger
      setTimeout(() => setIsScanned(true), 500);
  }, []);

  const handleInput = (key: string, value: string) => {
      if(soundEnabled && value.length > formData[key as keyof typeof formData].length) {
          // Play subtle blip on type (simulated by toggle for now or skipped to avoid spam)
      }
      setFormData({...formData, [key]: value});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if(soundEnabled) AudioService.playLevelUp(); // Epic sound for registration

    createProfile({
      name: formData.name,
      age: Number(formData.age) || 0,
      height: Number(formData.height) || 0,
      weight: Number(formData.weight) || 0,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-game-bg p-6 relative overflow-hidden font-sans text-game-text selection:bg-game-primary selection:text-white">
      
      {/* --- SYSTEM BACKGROUND LAYER --- */}
      <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--color-primary),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--color-primary),0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-game-primary/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-game-accent/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      {/* --- MAIN INTERFACE --- */}
      <div className={`
          relative z-10 w-full max-w-md transition-all duration-1000 ease-out
          ${isScanned ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}
      `}>
        
        {/* System Notification Header */}
        <div className="mb-8 text-center relative group cursor-default">
            <div className="inline-flex items-center gap-2 border border-game-primary/30 bg-game-surface/80 backdrop-blur-md px-4 py-1.5 rounded-none mb-4 shadow-[0_0_15px_rgba(var(--color-primary),0.2)] animate-pulse">
                <div className="w-2 h-2 bg-game-primary rounded-none"></div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-game-primary uppercase">{t('systemAlert')}</span>
            </div>
            
            <h1 className="text-5xl font-black text-white mb-1 tracking-tighter drop-shadow-xl uppercase italic">
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-game-text-muted">{t('awaken')}</span>
            </h1>
            <p className="text-game-primary font-mono text-xs tracking-[0.4em] uppercase opacity-80">
                {t('playerRegistration')}
            </p>
        </div>

        {/* The "Window" */}
        <div className="bg-game-surface/90 backdrop-blur-xl border border-game-border p-1 rounded-none shadow-2xl relative overflow-hidden">
            
            {/* Window Decor Lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-game-primary to-transparent opacity-50"></div>
            
            <div className="bg-game-bg/50 border border-game-border/50 rounded-none p-6 sm:p-8 relative">
                
                {/* Holographic Corner Accents */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-game-primary opacity-60"></div>
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-game-primary opacity-60"></div>
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-game-primary opacity-60"></div>
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-game-primary opacity-60"></div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Name Input (The Key Parameter) */}
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-bold text-game-text-muted uppercase tracking-widest flex items-center gap-2 group-focus-within:text-game-primary transition-colors">
                            <Shield size={12} /> {t('playerName')}
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => handleInput('name', e.target.value)}
                                className="w-full bg-game-surface/40 border-b-2 border-game-border rounded-none px-4 py-4 text-game-text text-lg font-mono placeholder:text-game-text-muted/30 focus:border-game-primary focus:bg-game-primary/5 outline-none transition-all"
                                placeholder={t('enterName')}
                                autoFocus
                                required
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                <span className="text-[9px] bg-game-primary text-game-bg px-1 rounded-none font-mono animate-pulse">{t('editing')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Age */}
                        <div className="space-y-1 group">
                            <label className="text-[9px] font-bold text-game-text-muted uppercase tracking-wider flex justify-center items-center gap-1 group-focus-within:text-game-primary transition-colors">
                                <Activity size={10} /> {t('age')}
                            </label>
                            <input 
                                type="number" 
                                value={formData.age}
                                onChange={(e) => handleInput('age', e.target.value)}
                                className="w-full bg-game-surface/40 border border-game-border rounded-none p-2 text-center font-mono text-game-text focus:border-game-primary focus:shadow-[0_0_10px_rgba(var(--color-primary),0.2)] outline-none transition-all"
                                placeholder="00"
                            />
                        </div>
                        {/* Height */}
                        <div className="space-y-1 group">
                            <label className="text-[9px] font-bold text-game-text-muted uppercase tracking-wider flex justify-center items-center gap-1 group-focus-within:text-game-primary transition-colors">
                                <Ruler size={10} /> {t('height')}
                            </label>
                            <input 
                                type="number" 
                                value={formData.height}
                                onChange={(e) => handleInput('height', e.target.value)}
                                className="w-full bg-game-surface/40 border border-game-border rounded-none p-2 text-center font-mono text-game-text focus:border-game-primary focus:shadow-[0_0_10px_rgba(var(--color-primary),0.2)] outline-none transition-all"
                                placeholder="CM"
                            />
                        </div>
                        {/* Weight */}
                        <div className="space-y-1 group">
                            <label className="text-[9px] font-bold text-game-text-muted uppercase tracking-wider flex justify-center items-center gap-1 group-focus-within:text-game-primary transition-colors">
                                <Weight size={10} /> {t('weight')}
                            </label>
                            <input 
                                type="number" 
                                value={formData.weight}
                                onChange={(e) => handleInput('weight', e.target.value)}
                                className="w-full bg-game-surface/40 border border-game-border rounded-none p-2 text-center font-mono text-game-text focus:border-game-primary focus:shadow-[0_0_10px_rgba(var(--color-primary),0.2)] outline-none transition-all"
                                placeholder="KG"
                            />
                        </div>
                    </div>

                    {/* Accept Button */}
                    <button 
                        type="submit" 
                        disabled={!formData.name}
                        className={`
                            group w-full relative overflow-hidden py-4 rounded-none font-black text-sm uppercase tracking-[0.2em] transition-all duration-300
                            ${formData.name 
                                ? 'bg-game-primary text-white shadow-[0_0_20px_rgba(var(--color-primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--color-primary),0.6)] hover:scale-[1.02] active:scale-[0.98]' 
                                : 'bg-game-border text-game-text-muted cursor-not-allowed grayscale'}
                        `}
                    >
                        {/* Button Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_linear_infinite] opacity-0 group-hover:opacity-100"></div>
                        
                        <div className="relative flex items-center justify-center gap-3">
                            <span>{t('createAccount')}</span>
                            {formData.name && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </div>
                    </button>

                </form>
            </div>
        </div>
        
        {/* Footer Info */}
        <div className="flex justify-between items-center px-4 mt-6 opacity-60">
            <div className="flex items-center gap-1.5">
                <Cpu size={12} className="text-game-primary" />
                <span className="text-[9px] font-mono text-game-text-muted">{t('localDbConnected')}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Fingerprint size={12} className="text-game-primary" />
                <span className="text-[9px] font-mono text-game-text-muted">{t('secureId')}: {Math.floor(Math.random() * 9000) + 1000}</span>
            </div>
        </div>

      </div>
    </div>
  );
};
