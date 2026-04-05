
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { User, Activity, Brain, TrendingUp, History, Shield, Sword, Eye, Wind, ChevronDown, ChevronUp, Calendar, Trophy, Award, Zap, Target, Scale, BarChart3, List, Battery, BatteryCharging } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { HumanBodyStats } from './HumanBodyStats';
import { RadarAttributeChart } from './RadarAttributeChart';
import { WeeklyRating, MonthlyRating, WeeklyHistory } from '../types';
import { SKILL_TREE } from '../constants';
import { AudioService } from '../services/audioService';
import { HistoryLogViewer } from './HistoryLogViewer';

export const StatisticsScreen: React.FC = () => {
  const { stats, playerProfile, weeklyHistory, monthlyHistory, weeklyReports, monthlyReports, achievements, upgradeSkill } = useGame();
  const { t, soundEnabled } = useSettings();
  const [activeTab, setActiveTab] = useState<'STATUS' | 'HISTORY' | 'RECORD' | 'SKILLS'>('STATUS');
  const [historyView, setHistoryView] = useState<'WEEKS' | 'MONTHS'>('WEEKS');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [showRadar, setShowRadar] = useState(false);
  
  // Interactive Chart State
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);

  // Audio Ambience
  useEffect(() => {
      if (soundEnabled) {
          AudioService.startAmbient();
      }
      return () => {
          AudioService.stopAmbient();
      };
  }, [soundEnabled]);

  // --- Data Preparation for Charts ---
  const weeklyChartData = useMemo(() => {
    return weeklyHistory.map((w, index) => ({
        id: w.weekId,
        index: index, // To map back to original array
        name: `W${w.weekIndexInMonth}`,
        xp: w.totalXP,
        tasks: w.tasksCompleted,
        balance: w.balanceScore || 0, // Fallback for old data
        efficiency: w.efficiencyRate || 0,
        fullDate: w.startDate
    })).slice(-8); // Last 8 weeks
  }, [weeklyHistory]);

  const monthlyChartData = useMemo(() => {
    return monthlyHistory.map((m, index) => ({
        index: index,
        name: m.monthId.split('-')[1], // Month number
        xp: m.totalXP,
        consistency: m.consistencyRate
    })).slice(-6); // Last 6 months
  }, [monthlyHistory]);

  const getRankTitle = (level: number) => {
      if (level >= 100) return t('rank_ss');
      if (level >= 80) return t('rank_s');
      if (level >= 60) return t('rank_a');
      if (level >= 40) return t('rank_b');
      if (level >= 20) return t('rank_c');
      if (level >= 10) return t('rank_d');
      return t('rank_e');
  };

  const getRatingColor = (rating: WeeklyRating | MonthlyRating) => {
      switch(rating) {
          case 'Excellent': case 'Legend': return 'text-yellow-500 border-yellow-500/50 bg-yellow-900/10';
          case 'Consistent': case 'Grinder': return 'text-emerald-500 border-emerald-500/50 bg-emerald-900/10';
          case 'Unstable': case 'Survivor': return 'text-orange-500 border-orange-500/50 bg-orange-900/10';
          default: return 'text-neutral-500 border-neutral-700 bg-neutral-900';
      }
  };

  const handleChartClick = (data: any) => {
      if (data && data.activePayload && data.activePayload[0]) {
          const clickedData = data.activePayload[0].payload;
          if (soundEnabled) AudioService.playClick();
          setSelectedHistoryIndex(clickedData.index);
      }
  };

  // --- Render Functions ---

  const renderStatusTab = () => (
    <div className="space-y-4 animate-slide-up pb-6">
        {/* Hunter ID Card */}
        <div className="bg-game-bg border-2 border-game-primary/50 rounded-none overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 bg-game-primary-dim/20 px-3 py-1 rounded-bl-none border-b border-l border-game-primary/30">
                <span className="text-[10px] font-mono text-game-primary">{t('hunterAssociation')}</span>
            </div>

            <div className="p-6 flex flex-col items-center border-b border-game-primary/30 relative z-10">
                <div className="w-24 h-24 bg-game-bg rounded-full border-2 border-game-primary flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(var(--color-primary),0.4)] relative">
                    <User size={40} className="text-game-primary" />
                    {/* Level Badge */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-game-bg rounded-full border border-game-primary flex items-center justify-center">
                        <span className="text-xs font-black text-game-text">{stats.level}</span>
                    </div>
                </div>
                <h2 className="text-2xl font-black text-game-text uppercase tracking-tighter">{playerProfile?.name}</h2>
                <span className="text-xs text-game-primary font-bold uppercase tracking-[0.2em]">{t('jobTitle')}</span>
                <div className="mt-2 px-3 py-1 bg-game-bg rounded-none text-xs font-bold text-game-accent border border-game-primary/30">
                    {getRankTitle(stats.level)}
                </div>
            </div>
             
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-game-primary via-transparent to-transparent" />

            <div className="p-4 grid grid-cols-2 gap-4 text-sm bg-game-surface/50">
                 <div>
                    <span className="text-[10px] text-game-primary/70 block uppercase font-bold">{t('level')}</span>
                    <span className="font-mono text-xl text-game-text font-black">{stats.level}</span>
                 </div>
                 <div>
                    <span className="text-[10px] text-game-primary/70 block uppercase font-bold">{t('job')}</span>
                    <span className="font-mono text-sm text-game-text font-bold">{t('player')}</span>
                 </div>
                 <div className="col-span-2">
                    <ProgressBar 
                        current={stats.currentXp} 
                        max={stats.maxXp} 
                        colorClass="bg-game-primary" 
                        label="XP PROGRESS" 
                        height="h-3"
                    />
                 </div>
                 <div className="col-span-2">
                    <ProgressBar 
                        current={stats.energy} 
                        max={stats.maxEnergy} 
                        colorClass="bg-blue-600" 
                        label="HP (ENERGY)" 
                        height="h-3"
                    />
                 </div>
                 <div className="col-span-2 flex justify-between mt-1 border-t border-game-primary/20 pt-2">
                     <div className="flex items-center gap-1">
                         <Battery size={12} className="text-red-500" />
                         <span className="text-[10px] text-game-text-muted uppercase font-bold">{t('energyConsumed' as any)}: <span className="text-game-text">{stats.weeklyEnergyConsumed || 0}</span></span>
                     </div>
                     <div className="flex items-center gap-1">
                         <BatteryCharging size={12} className="text-green-500" />
                         <span className="text-[10px] text-game-text-muted uppercase font-bold">{t('energyRecovered' as any)}: <span className="text-game-text">{stats.weeklyEnergyRecovered || 0}</span></span>
                     </div>
                 </div>
            </div>
        </div>

        {/* 3D Human Body Stats / Radar Chart */}
        <div className="bg-game-bg border border-game-primary/30 rounded-none p-4 relative overflow-hidden shadow-lg">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-purple-500">
                    <Brain size={18} />
                    <h3 className="font-bold text-sm uppercase tracking-widest">{t('hunterStats')}</h3>
                </div>
                <button 
                    onClick={() => setShowRadar(!showRadar)}
                    className="text-xs text-game-primary border border-game-primary/30 px-2 py-1 hover:bg-game-primary/10 transition-colors"
                >
                    {showRadar ? t('showBody') || 'Show Body' : t('showRadar') || 'Show Radar'}
                </button>
            </div>
            
            {showRadar ? (
                <RadarAttributeChart stats={stats.hunterAttributes} />
            ) : (
                <HumanBodyStats stats={stats.hunterAttributes} />
            )}

            {/* Stat Details Grid */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                    { label: t('str'), icon: Sword, color: 'text-red-400', val: stats.hunterAttributes.strength },
                    { label: t('vit'), icon: Shield, color: 'text-yellow-400', val: stats.hunterAttributes.vitality },
                    { label: t('agi'), icon: Wind, color: 'text-green-400', val: stats.hunterAttributes.agility },
                    { label: t('int'), icon: Brain, color: 'text-blue-400', val: stats.hunterAttributes.intelligence },
                    { label: t('sense'), icon: Eye, color: 'text-purple-400', val: stats.hunterAttributes.sense, full: true }
                ].map((s, i) => (
                    <div key={i} className={`bg-game-surface/40 p-2 rounded-none flex items-center justify-between border border-game-primary/20 ${s.full ? 'col-span-2' : ''}`}>
                        <div className="flex items-center gap-2">
                            <s.icon size={12} className={s.color}/>
                            <span className="text-xs text-game-text-muted font-bold">{s.label}</span>
                        </div>
                        <span className="font-mono font-bold text-game-text">{Math.floor(s.val)}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-game-bg border border-game-primary/30 rounded-none p-4 relative overflow-hidden shadow-lg mt-4">
            <div className="flex items-center gap-2 text-yellow-500 mb-4">
                <Trophy size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('achievements')}</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {achievements.map((ach) => (
                    <div key={ach.id} className={`p-3 border rounded-none flex items-center gap-3 transition-all ${ach.isUnlocked ? 'bg-game-primary/10 border-game-primary/50' : 'bg-game-surface/40 border-game-border opacity-60'}`}>
                        <div className={`text-2xl ${ach.isUnlocked ? '' : 'grayscale'}`}>
                            {ach.icon === 'Sword' && '🗡️'}
                            {ach.icon === 'Shield' && '🛡️'}
                            {ach.icon === 'Flame' && '🔥'}
                            {ach.icon === 'Target' && '🎯'}
                            {ach.icon === 'Trophy' && '🏆'}
                            {ach.icon === 'Dumbbell' && '🏋️'}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className={`font-bold text-sm ${ach.isUnlocked ? 'text-game-text' : 'text-game-text-muted'}`}>{t(`ach_${ach.id}_title` as any) || ach.title}</h4>
                                {ach.isUnlocked && <span className="text-[10px] text-game-primary font-mono bg-game-primary/20 px-1 rounded">+{ach.rewardXP}XP</span>}
                            </div>
                            <p className="text-[10px] text-game-text-muted mt-1">{t(`ach_${ach.id}_desc` as any) || ach.description}</p>
                            {!ach.isUnlocked && (
                                <div className="mt-2">
                                    <ProgressBar 
                                        current={ach.currentValue} 
                                        max={ach.targetValue} 
                                        colorClass="bg-game-primary/50" 
                                        height="h-1" 
                                    />
                                    <div className="text-[8px] text-right mt-1 text-game-text-muted font-mono">
                                        {ach.currentValue} / {ach.targetValue}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderSelectedWeekDetails = () => {
      if (selectedHistoryIndex === null || !weeklyHistory[selectedHistoryIndex]) return null;
      const weekData = weeklyHistory[selectedHistoryIndex];
      
      // Calculate max for bar scaling
      const maxVal = Math.max(...(Object.values(weekData.statsSummary) as number[]));

      return (
          <div className="bg-game-surface/50 border border-game-border rounded-xl p-4 mt-4 animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h4 className="font-black text-game-text text-lg">{t('weekAnalysis')}</h4>
                      <p className="text-[10px] text-game-text-muted font-mono">{weekData.startDate}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedHistoryIndex(null)}
                    className="text-game-text-muted hover:text-game-text"
                  >
                      <ChevronUp size={18} />
                  </button>
              </div>

              {/* Advanced Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('balanceScore')}</span>
                      <div className="flex items-center gap-2">
                          <Scale size={14} className={weekData.balanceScore > 70 ? 'text-green-500' : 'text-yellow-500'} />
                          <span className="text-lg font-black text-game-text">{weekData.balanceScore || 0}</span>
                          <span className="text-[9px] text-game-text-muted">/100</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('efficiency')}</span>
                      <div className="flex items-center gap-2">
                          <Zap size={14} className="text-blue-500" />
                          <span className="text-lg font-black text-game-text">{weekData.efficiencyRate || 0}</span>
                          <span className="text-[9px] text-game-text-muted">{t('xpPerTask')}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('energyConsumed' as any)}</span>
                      <div className="flex items-center gap-2">
                          <Battery size={14} className="text-red-500" />
                          <span className="text-lg font-black text-game-text">{weekData.energyConsumed || 0}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('energyRatio' as any)}</span>
                      <div className="flex items-center gap-2">
                          <Activity size={14} className="text-orange-400" />
                          <span className="text-lg font-black text-game-text">
                              {weekData.energyRecovered > 0 
                                  ? (weekData.energyConsumed / weekData.energyRecovered).toFixed(1) 
                                  : weekData.energyConsumed}
                          </span>
                          <span className="text-[9px] text-game-text-muted">{t('cr')}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('avgDailyXp' as any)}</span>
                      <div className="flex items-center gap-2">
                          <TrendingUp size={14} className="text-purple-500" />
                          <span className="text-lg font-black text-game-text">{Math.round((weekData.totalXP || 0) / 7)}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('planAdherence' as any)}</span>
                      <div className="flex items-center gap-2">
                          <Target size={14} className="text-blue-400" />
                          <span className="text-lg font-black text-game-text">
                              {weekData.tasksCompleted + (weekData.missedTasksCount || 0) > 0 
                                  ? Math.round((weekData.tasksCompleted / (weekData.tasksCompleted + (weekData.missedTasksCount || 0))) * 100) 
                                  : 0}%
                          </span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('missedTasks' as any)}</span>
                      <div className="flex items-center gap-2">
                          <History size={14} className="text-red-400" />
                          <span className="text-lg font-black text-game-text">{weekData.missedTasksCount || 0}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('mostLeastActive' as any)}</span>
                      <div className="flex flex-col">
                          <span className="text-xs font-bold text-green-400">
                              ↑ {(Object.entries(weekData.statsSummary) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                          </span>
                          <span className="text-xs font-bold text-red-400">
                              ↓ {(Object.entries(weekData.statsSummary) as [string, number][]).sort((a, b) => a[1] - b[1])[0]?.[0] || 'N/A'}
                          </span>
                      </div>
                  </div>
              </div>

              {/* Mini Heatmap of Pillars */}
              <div className="space-y-2">
                  <span className="text-[9px] font-bold text-game-text-muted uppercase">{t('focusDistribution')}</span>
                  <div className="flex items-end justify-between h-20 gap-1">
                      {(Object.entries(weekData.statsSummary) as [string, number][]).map(([key, val]) => (
                          <div key={key} className="flex-1 flex flex-col items-center justify-end h-full group">
                              <div 
                                className="w-full bg-game-border rounded-t-sm transition-all group-hover:bg-game-red relative"
                                style={{ height: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%` }}
                              >
                                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-game-text opacity-0 group-hover:opacity-100 transition-opacity">
                                      {val}
                                  </span>
                              </div>
                              <span className="text-[8px] text-game-text-muted uppercase mt-1 truncate w-full text-center">
                                  {key.slice(0, 3)}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const renderSelectedMonthDetails = () => {
      if (selectedHistoryIndex === null || !monthlyHistory[selectedHistoryIndex]) return null;
      const monthData = monthlyHistory[selectedHistoryIndex];
      
      // Calculate max for bar scaling
      const maxVal = Math.max(...(Object.values(monthData.statsSummary) as number[]));

      return (
          <div className="bg-game-surface/50 border border-game-border rounded-xl p-4 mt-4 animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h4 className="font-black text-game-text text-lg">{t('monthAnalysis' as any)}</h4>
                      <p className="text-[10px] text-game-text-muted font-mono">{monthData.monthId}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedHistoryIndex(null)}
                    className="text-game-text-muted hover:text-game-text"
                  >
                      <ChevronUp size={18} />
                  </button>
              </div>

              {/* Advanced Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('consistency' as any)}</span>
                      <div className="flex items-center gap-2">
                          <Scale size={14} className={monthData.consistencyRate > 70 ? 'text-green-500' : 'text-yellow-500'} />
                          <span className="text-lg font-black text-game-text">{monthData.consistencyRate || 0}</span>
                          <span className="text-[9px] text-game-text-muted">/100</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('avgXp' as any)}</span>
                      <div className="flex items-center gap-2">
                          <Zap size={14} className="text-blue-500" />
                          <span className="text-lg font-black text-game-text">{Math.round(monthData.averageXP) || 0}</span>
                          <span className="text-[9px] text-game-text-muted">{t('xpPerTask')}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('energyConsumed' as any)}</span>
                      <div className="flex items-center gap-2">
                          <Battery size={14} className="text-red-500" />
                          <span className="text-lg font-black text-game-text">{monthData.energyConsumed || 0}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('energyRatio' as any)}</span>
                      <div className="flex items-center gap-2">
                          <Activity size={14} className="text-orange-400" />
                          <span className="text-lg font-black text-game-text">
                              {monthData.energyRecovered > 0 
                                  ? (monthData.energyConsumed / monthData.energyRecovered).toFixed(1) 
                                  : monthData.energyConsumed}
                          </span>
                          <span className="text-[9px] text-game-text-muted">{t('cr')}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('avgDailyXp' as any)}</span>
                      <div className="flex items-center gap-2">
                          <TrendingUp size={14} className="text-purple-500" />
                          <span className="text-lg font-black text-game-text">{Math.round((monthData.totalXP || 0) / 30)}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('totalTasks')}</span>
                      <div className="flex items-center gap-2">
                          <Target size={14} className="text-blue-400" />
                          <span className="text-lg font-black text-game-text">{monthData.totalTasks || 0}</span>
                      </div>
                  </div>
                  <div className="bg-game-bg/40 p-2 rounded border border-game-border">
                      <span className="text-[9px] text-game-text-muted uppercase block mb-1">{t('mostLeastActive' as any)}</span>
                      <div className="flex flex-col">
                          <span className="text-xs font-bold text-green-400">
                              ↑ {(Object.entries(monthData.statsSummary) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                          </span>
                          <span className="text-xs font-bold text-red-400">
                              ↓ {(Object.entries(monthData.statsSummary) as [string, number][]).sort((a, b) => a[1] - b[1])[0]?.[0] || 'N/A'}
                          </span>
                      </div>
                  </div>
              </div>

              {/* Mini Heatmap of Pillars */}
              <div className="space-y-2">
                  <span className="text-[9px] font-bold text-game-text-muted uppercase">{t('focusDistribution')}</span>
                  <div className="flex items-end justify-between h-20 gap-1">
                      {(Object.entries(monthData.statsSummary) as [string, number][]).map(([key, val]) => (
                          <div key={key} className="flex-1 flex flex-col items-center justify-end h-full group">
                              <div 
                                className="w-full bg-game-border rounded-t-sm transition-all group-hover:bg-game-red relative"
                                style={{ height: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%` }}
                              >
                                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-game-text opacity-0 group-hover:opacity-100 transition-opacity">
                                      {val}
                                  </span>
                              </div>
                              <span className="text-[8px] text-game-text-muted uppercase mt-1 truncate w-full text-center">
                                  {key.slice(0, 3)}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const renderHistoryTab = () => (
    <div className="space-y-6 animate-slide-up pb-6">
        
        {/* 1. Career Summary Header */}
        <div className="bg-game-surface rounded-xl p-4 border border-game-border flex justify-between items-center shadow-lg mb-4">
            <div className="text-center flex-1 border-l border-game-border first:border-0">
                <span className="text-[10px] text-game-text-muted uppercase tracking-wider block mb-1">{t('totalXp')}</span>
                <span className="text-lg font-black text-game-text">{stats.currentXp + (weeklyHistory.reduce((acc, w) => acc + w.totalXP, 0))}</span>
            </div>
            <div className="text-center flex-1 border-l border-game-border">
                <span className="text-[10px] text-game-text-muted uppercase tracking-wider block mb-1">{t('totalTasks')}</span>
                <span className="text-lg font-black text-game-text">{(weeklyHistory.reduce((acc, w) => acc + w.tasksCompleted, 0)) + stats.weeklyTasksCompleted}</span>
            </div>
            <div className="text-center flex-1 border-l border-game-border">
                <span className="text-[10px] text-game-text-muted uppercase tracking-wider block mb-1">{t('maxStreak')}</span>
                <span className="text-lg font-black text-game-red">{Math.max(stats.streak, ...weeklyHistory.map(w => w.streakMax))}</span>
            </div>
        </div>
        
        {/* Energy Summary Header */}
        <div className="bg-game-surface rounded-xl p-4 border border-game-border flex justify-between items-center shadow-lg">
            <div className="text-center flex-1 border-l border-game-border first:border-0">
                <span className="text-[10px] text-game-text-muted uppercase tracking-wider block mb-1">{t('energyConsumed' as any)}</span>
                <div className="flex items-center justify-center gap-1">
                    <Battery size={12} className="text-red-500" />
                    <span className="text-lg font-black text-game-text">{stats.weeklyEnergyConsumed + (weeklyHistory.reduce((acc, w) => acc + (w.energyConsumed || 0), 0))}</span>
                </div>
            </div>
            <div className="text-center flex-1 border-l border-game-border">
                <span className="text-[10px] text-game-text-muted uppercase tracking-wider block mb-1">{t('energyRecovered' as any)}</span>
                <div className="flex items-center justify-center gap-1">
                    <BatteryCharging size={12} className="text-green-500" />
                    <span className="text-lg font-black text-game-text">{stats.weeklyEnergyRecovered + (weeklyHistory.reduce((acc, w) => acc + (w.energyRecovered || 0), 0))}</span>
                </div>
            </div>
        </div>

        {/* 2. Interactive Charts Section */}
        <div className="bg-game-surface border border-game-border rounded-xl p-4 overflow-hidden">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-game-red">
                    <TrendingUp size={18} />
                    <h3 className="font-bold text-sm uppercase tracking-widest">{t('trend')}</h3>
                </div>
                {/* View Toggle */}
                <div className="flex bg-game-bg rounded-lg p-0.5 border border-game-border">
                    <button 
                        onClick={() => {
                            if(soundEnabled) AudioService.playClick();
                            setHistoryView('WEEKS');
                            setSelectedHistoryIndex(null);
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${historyView === 'WEEKS' ? 'bg-game-surface-highlight text-game-text' : 'text-game-text-muted'}`}
                    >
                        Weeks
                    </button>
                    <button 
                        onClick={() => {
                            if(soundEnabled) AudioService.playClick();
                            setHistoryView('MONTHS');
                            setSelectedHistoryIndex(null);
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${historyView === 'MONTHS' ? 'bg-game-surface-highlight text-game-text' : 'text-game-text-muted'}`}
                    >
                        Months
                    </button>
                </div>
            </div>

            <div className="h-48 w-full -ml-4 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    {historyView === 'WEEKS' ? (
                        weeklyChartData.length > 0 ? (
                            <AreaChart data={weeklyChartData} onClick={handleChartClick}>
                                <defs>
                                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <Tooltip 
                                    cursor={{ stroke: '#dc2626', strokeWidth: 1 }}
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="xp" 
                                    stroke="#dc2626" 
                                    fillOpacity={1} 
                                    fill="url(#colorXp)" 
                                    strokeWidth={2} 
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                />
                            </AreaChart>
                        ) : (
                             <div className="flex items-center justify-center h-full text-neutral-600 text-xs">{t('noData')}</div>
                        )
                    ) : (
                        monthlyChartData.length > 0 ? (
                                <BarChart data={monthlyChartData} onClick={handleChartClick}>
                                <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                <Bar dataKey="xp" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-600 text-xs">{t('noData')}</div>
                        )
                    )}
                </ResponsiveContainer>
            </div>

            {/* Drill Down Detail View */}
            {historyView === 'WEEKS' ? renderSelectedWeekDetails() : renderSelectedMonthDetails()}
        </div>

        {/* 3. Archives List */}
        <div>
            <h3 className="text-xs font-black text-game-text-muted uppercase tracking-widest mb-3 px-1">
                {historyView === 'WEEKS' ? t('weeklyReport') : t('monthlyReport')} Archives
            </h3>
            
            <div className="space-y-3">
                {historyView === 'WEEKS' ? (
                    weeklyReports.length === 0 ? (
                         <div className="text-center py-8 opacity-50 border-2 border-dashed border-game-border rounded-xl">
                            <History size={32} className="mx-auto mb-2 text-game-text-muted" />
                            <p className="text-sm text-game-text-muted">{t('archiveEmpty')}</p>
                        </div>
                    ) : (
                        weeklyReports.slice().reverse().map(report => {
                            const style = getRatingColor(report.rating);
                            const isExpanded = expandedReportId === report.weekId;
                            
                            return (
                                <div key={report.weekId} className={`rounded-xl overflow-hidden border transition-all duration-300 ${style}`}>
                                    <div 
                                        onClick={() => {
                                            if(soundEnabled) AudioService.playClick();
                                            setExpandedReportId(isExpanded ? null : report.weekId);
                                        }}
                                        className="p-4 flex items-center justify-between cursor-pointer active:bg-game-bg/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center w-12">
                                                 <span className="text-[10px] font-bold text-game-text-muted uppercase">{t('week')}</span>
                                                 {/* Extract week number from ID or index if available, else standard icon */}
                                                 <span className="text-xl font-black">{new Date(report.createdAt).getDate()}</span>
                                            </div>
                                            
                                            <div className="h-8 w-px bg-game-border/50"></div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm uppercase tracking-wider">{t(report.rating.toLowerCase() as any)}</h4>
                                                    {report.rating === 'Excellent' && <Trophy size={12} className="text-yellow-500"/>}
                                                </div>
                                                <p className="text-[10px] opacity-70 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 pt-0 border-t border-game-border/10 bg-game-bg/20">
                                            <div className="py-3">
                                                <p className="text-xs leading-relaxed opacity-90 font-medium">
                                                    "{report.summaryText}"
                                                </p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div className="bg-game-bg/30 p-2 rounded flex items-center gap-2">
                                                    <Target size={14} className="text-blue-400" />
                                                    <div>
                                                        <span className="text-[9px] block opacity-50 uppercase">{t('focus')}</span>
                                                        <span className="text-xs font-bold">{t(report.bestPillar.toLowerCase() as any)}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-game-bg/30 p-2 rounded flex items-center gap-2">
                                                    <Zap size={14} className="text-yellow-400" />
                                                    <div>
                                                        <span className="text-[9px] block opacity-50 uppercase">{t('totalXp')}</span>
                                                        <span className="text-xs font-bold">
                                                            {/* Check against null specifically, as 0 is falsey */}
                                                            {report.comparison.xpChangePercent !== null 
                                                                ? `${report.comparison.xpChangePercent > 0 ? '+' : ''}${report.comparison.xpChangePercent}%` 
                                                                : 'N/A'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )
                ) : (
                    // Monthly View Logic (Simplified for brevity, follows same pattern)
                    monthlyReports.length === 0 ? (
                         <div className="text-center py-8 opacity-50 border-2 border-dashed border-game-border rounded-xl">
                            <Award size={32} className="mx-auto mb-2 text-game-text-muted" />
                            <p className="text-sm text-game-text-muted">{t('archiveEmpty')}</p>
                        </div>
                    ) : (
                        monthlyReports.slice().reverse().map(report => (
                            <div key={report.monthId} className={`p-4 rounded-xl border mb-2 ${getRatingColor(report.monthRating)}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-bold block opacity-60">{report.monthId}</span>
                                        <span className="font-black text-lg uppercase">{t(report.monthRating.toLowerCase() as any)}</span>
                                    </div>
                                    <Award size={24} />
                                </div>
                                <p className="text-xs mt-2 opacity-80">{report.summaryText}</p>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    </div>
  );

  const renderRecordTab = () => (
      <div className="space-y-4 animate-slide-up pb-6">
           <div className="bg-game-surface border border-game-border rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                    <List size={20} />
                    <h3 className="font-black text-game-text uppercase tracking-wider">{t('detailedHistory')}</h3>
                </div>
                <p className="text-xs text-game-text-muted">
                    {t('historyDesc')}
                </p>
           </div>
           
           <HistoryLogViewer />
      </div>
  );

  const renderSkillsTab = () => {
      return (
          <div className="space-y-4 animate-slide-up pb-6">
              <div className="bg-game-surface border border-game-border rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-game-accent">
                          <Zap size={20} />
                          <h3 className="font-black text-game-text uppercase tracking-wider">{t('skillTree')}</h3>
                      </div>
                      <div className="text-sm font-bold text-game-primary">
                          {t('sp')} {stats.skillPoints}
                      </div>
                  </div>
                  <p className="text-xs text-game-text-muted">
                      {t('upgradeSkillsDesc')}
                  </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                  {SKILL_TREE.map((skillDef) => {
                      const skillId = skillDef.id;
                      const currentLevel = stats.skills[skillId] || 0;
                      const isMaxLevel = currentLevel >= skillDef.maxLevel;
                      const canUpgrade = stats.skillPoints > 0 && !isMaxLevel;

                      return (
                          <div key={skillId} className="bg-game-surface/40 border border-game-primary/20 p-3 rounded-none relative overflow-hidden">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h4 className="font-bold text-sm text-game-text">{t(skillDef.name as any) || skillDef.name}</h4>
                                      <p className="text-[10px] text-game-text-muted mt-1">{t(skillDef.description as any) || skillDef.description}</p>
                                  </div>
                                  <div className="text-xs font-mono text-game-primary">
                                      {t('lv')} {currentLevel}/{skillDef.maxLevel}
                                  </div>
                              </div>
                              
                              <div className="mt-3 flex justify-between items-center">
                                  <div className="text-[10px] text-game-accent">
                                      {skillDef.effectType === 'XP_BOOST' && `+${skillDef.valuePerLevel * 100}% ${t('xpBoost')}`}
                                      {skillDef.effectType === 'ENERGY_DISCOUNT' && `-${skillDef.valuePerLevel * 100}% ${t('energyDiscount')}`}
                                      {skillDef.effectType === 'RECOVERY_BOOST' && `+${skillDef.valuePerLevel * 100}% ${t('recovery')}`}
                                      {skillDef.effectType === 'DDA_RESISTANCE' && `-${skillDef.valuePerLevel * 100}% ${t('resistance')}`}
                                      {` ${t('perLevel')}`}
                                  </div>
                                  <button
                                      onClick={() => upgradeSkill(skillId)}
                                      disabled={!canUpgrade}
                                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-none transition-all ${canUpgrade ? 'bg-game-primary text-game-bg hover:bg-game-accent' : 'bg-game-surface text-game-text-muted cursor-not-allowed border border-game-border'}`}
                                  >
                                      {isMaxLevel ? t('maxLevel') : t('upgrade')}
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 animate-fade-in bg-game-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-game-bg/90 backdrop-blur-md p-4 border-b border-game-border">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-game-red" size={24} />
            <h2 className="text-2xl font-black text-game-text uppercase tracking-tighter">{t('statistics')}</h2>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-game-surface p-1 rounded-xl shadow-inner">
             <button 
                onClick={() => {
                    if(soundEnabled) AudioService.playClick();
                    setActiveTab('STATUS');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'STATUS' ? 'bg-game-surface-highlight text-game-text shadow ring-1 ring-white/10' : 'text-game-text-muted hover:text-game-text'}`}
             >
                {t('tabStatus')}
             </button>
             <button 
                onClick={() => {
                    if(soundEnabled) AudioService.playClick();
                    setActiveTab('HISTORY');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-game-surface-highlight text-game-text shadow ring-1 ring-white/10' : 'text-game-text-muted hover:text-game-text'}`}
             >
                {t('tabHistory')}
             </button>
             <button 
                onClick={() => {
                    if(soundEnabled) AudioService.playClick();
                    setActiveTab('RECORD');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'RECORD' ? 'bg-game-surface-highlight text-game-text shadow ring-1 ring-white/10' : 'text-game-text-muted hover:text-game-text'}`}
             >
                {t('tabRecord')}
             </button>
             <button 
                onClick={() => {
                    if(soundEnabled) AudioService.playClick();
                    setActiveTab('SKILLS');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'SKILLS' ? 'bg-game-surface-highlight text-game-text shadow ring-1 ring-white/10' : 'text-game-text-muted hover:text-game-text'}`}
             >
                Skills
             </button>
          </div>
      </div>

      <div className="p-4">
        {activeTab === 'STATUS' ? renderStatusTab() : activeTab === 'HISTORY' ? renderHistoryTab() : activeTab === 'RECORD' ? renderRecordTab() : renderSkillsTab()}
      </div>
    </div>
  );
};
