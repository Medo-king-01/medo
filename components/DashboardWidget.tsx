import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { CircularProgress } from './CircularProgress';

interface DashboardWidgetProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  iconColor: string;
  progress?: {
    current: number;
    max: number;
    colorClass: string;
  };
  variant?: 'linear' | 'circular';
  borderColor?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = React.memo(({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor,
  progress,
  variant = 'linear',
  borderColor = 'border-red-500/30'
}) => {
  return (
    <div className={`bg-black/80 backdrop-blur-sm border ${borderColor} p-4 rounded-none shadow-lg flex flex-col justify-between h-full relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:border-red-500/50`}>
      {/* Background Icon */}
      <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-red-500">
        <Icon size={80} />
      </div>
      
      <div className="flex items-center justify-between mb-2 z-10">
        <span className="text-red-500/70 text-[10px] font-black uppercase tracking-widest">{label}</span>
        <Icon className={iconColor} size={18} />
      </div>

      <div className="z-10 flex-1 flex flex-col justify-end">
        {variant === 'circular' && progress ? (
            <div className="flex justify-center py-2 relative">
                {/* Circular Progress Placeholder - In a real implementation we'd update the component too */}
                <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-red-900/30">
                    <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin-slow" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${progress.current/progress.max * 100}%, 0 ${progress.current/progress.max * 100}%)`}}></div>
                    <div className="text-center z-10">
                        <p className="text-3xl font-black text-white leading-none drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">{value}</p>
                        {subValue && <span className="text-[12px] text-red-400 font-bold uppercase tracking-wider block">{subValue}</span>}
                    </div>
                </div>
                
                <div className="absolute bottom-0 right-0 text-[9px] text-red-500/70 font-mono bg-black/80 px-1 border border-red-500/20">
                    {progress.current}/{progress.max} XP
                </div>
            </div>
        ) : (
            <>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{value}</p>
                    {subValue && <span className="text-sm font-medium text-red-400">{subValue}</span>}
                </div>
                
                {progress && (
                    <div className="mt-3">
                        <div className="h-2 w-full bg-red-900/20 rounded-none overflow-hidden border border-red-500/20">
                            <div 
                                className={`h-full ${progress.colorClass} shadow-[0_0_10px_currentColor] transition-all duration-500`} 
                                style={{ width: `${(progress.current / progress.max) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-right mt-1 text-red-500/70 font-mono">
                            {progress.current} / {progress.max}
                        </p>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
});