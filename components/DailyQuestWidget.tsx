import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";
import { DAILY_QUEST_TARGETS } from "../constants";
import {
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DailyQuestProgress } from "../types";

export const DailyQuestWidget: React.FC = () => {
  const { stats, updateDailyQuest } = useGame();
  const { t } = useSettings();
  const quest = stats.dailyQuest;
  const [isOpen, setIsOpen] = useState(true);

  if (!quest) return null;

  const renderRow = (
    label: string,
    key: keyof Omit<DailyQuestProgress, "isCompleted" | "lastResetDate">,
    target: number,
  ) => {
    const current = quest[key];
    const isDone = current >= target;

    const increment = (amount: number) => {
      if (isDone || quest.isCompleted) return;
      updateDailyQuest(key, current + amount);
    };

    const incrementAmount = key === 'run' ? 1 : 10;

    return (
      <div className="flex items-center justify-between py-3 border-b border-game-primary/20 last:border-0 group hover:bg-game-primary/5 transition-colors px-2 rounded-none">
        <div className="flex items-center gap-4">
          {!isDone ? (
            <button
              onClick={() => increment(incrementAmount)}
              className="bg-game-primary-dim/50 hover:bg-game-primary-dim/60 border border-game-primary/50 text-game-text text-[10px] font-bold px-2 py-1 rounded-none transition-all active:scale-95 min-w-[32px]"
            >
              +{incrementAmount}
            </button>
          ) : (
            <div className="w-[32px] flex justify-center">
              <Check
                size={16}
                className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]"
              />
            </div>
          )}
          <span
            className={`font-mono text-xs ${isDone ? "text-green-400 text-glow-green" : "text-game-accent"}`}
          >
            [{current}/{target}]
          </span>
        </div>
        <span className="text-game-text font-bold text-xs tracking-wider uppercase font-mono">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="relative mx-4 mt-4 mb-6 perspective-1000">
      {/* System Window Frame */}
      <div
        className={`
            bg-game-surface/80 border border-game-primary/30 rounded-none transition-all duration-500 overflow-hidden
            ${isOpen ? "max-h-[500px]" : "max-h-[50px]"}
        `}
      >
        {/* Header */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 flex items-center justify-between cursor-pointer border-b border-game-primary/30"
        >
          {isOpen ? (
            <ChevronUp className="text-game-accent" size={16} />
          ) : (
            <ChevronDown className="text-game-accent" size={16} />
          )}
          <div className="flex items-center gap-2">
            <h3 className="text-game-text font-black tracking-[0.2em] uppercase text-xs">
              {t('questInfo')}
            </h3>
            <AlertTriangle size={16} className="text-yellow-500" />
          </div>
        </div>

        {/* Content Area */}
        <div
          className={`p-4 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        >
          {/* Quest Title */}
          <div className="text-center mb-6 relative">
            <h2 className="text-xl font-black text-game-text uppercase tracking-widest font-sans drop-shadow-md">
              {t('dailyQuest')}
            </h2>
            <div className="w-full h-px bg-game-primary/30 my-2"></div>
            <p className="text-[9px] text-game-accent uppercase tracking-[0.2em] font-bold">
              {t('difficulty')}: {t('rank_e')}
            </p>
          </div>

          {!quest.isCompleted ? (
            <>
              <div className="text-[10px] text-game-text-muted mb-6 text-center font-mono bg-game-surface/40 p-3 rounded-none border border-game-border/5">
                <span className="text-game-primary font-bold block mb-1">
                  [{t('goal')}]
                </span>
                {t('completeDaily')}
                <br />
                .status
              </div>

              <div className="space-y-1">
                {renderRow(t('pushups'), "pushups", DAILY_QUEST_TARGETS.pushups)}
                {renderRow(t('situps'), "situps", DAILY_QUEST_TARGETS.situps)}
                {renderRow(t('squats'), "squats", DAILY_QUEST_TARGETS.squats)}
                {renderRow(t('run'), "run", DAILY_QUEST_TARGETS.run)}
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="inline-block p-3 rounded-none bg-green-500/10 border border-green-500/50 mb-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <Check size={32} className="text-green-400" />
              </div>
              <h3 className="text-lg font-black text-green-400 uppercase tracking-widest mb-1 text-glow-green">
                {t('questCompleted')}
              </h3>
              <p className="text-[10px] text-game-accent font-mono">
                {t('rewardsDelivered')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decorative "Hologram" Corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-game-accent"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-game-accent"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-game-accent"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-game-accent"></div>
    </div>
  );
};
