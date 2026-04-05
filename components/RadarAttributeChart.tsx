import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useSettings } from '../context/SettingsContext';

interface Props {
  stats: {
    strength: number;
    vitality: number;
    agility: number;
    intelligence: number;
    sense: number;
  };
}

export const RadarAttributeChart: React.FC<Props> = ({ stats }) => {
  const { t } = useSettings();

  const data = [
    {
      subject: t('str'),
      A: stats.strength,
      fullMark: Math.max(stats.strength, 100),
    },
    {
      subject: t('vit'),
      A: stats.vitality,
      fullMark: Math.max(stats.vitality, 100),
    },
    {
      subject: t('agi'),
      A: stats.agility,
      fullMark: Math.max(stats.agility, 100),
    },
    {
      subject: t('int'),
      A: stats.intelligence,
      fullMark: Math.max(stats.intelligence, 100),
    },
    {
      subject: t('sense'),
      A: stats.sense,
      fullMark: Math.max(stats.sense, 100),
    },
  ];

  return (
    <div className="w-full h-64 bg-game-surface/20 rounded-xl border border-game-primary/20 flex items-center justify-center p-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(var(--color-primary), 0.3)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'rgba(var(--color-text), 0.8)', fontSize: 10, fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 'dataMax + 10']} 
            tick={false} 
            axisLine={false} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(var(--color-bg), 0.9)', 
              borderColor: 'rgba(var(--color-primary), 0.5)',
              borderRadius: '8px',
              color: 'rgba(var(--color-text), 1)'
            }}
            itemStyle={{ color: 'rgba(var(--color-primary), 1)', fontWeight: 'bold' }}
          />
          <Radar 
            name="Attributes" 
            dataKey="A" 
            stroke="rgba(var(--color-primary), 1)" 
            fill="rgba(var(--color-primary), 0.5)" 
            fillOpacity={0.6} 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
