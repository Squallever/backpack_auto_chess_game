import React from 'react';
import { UnitStats } from '../types';
import { Heart, Timer, Swords, Zap } from 'lucide-react';

interface StatPanelProps {
  stats: UnitStats;
  className?: string;
  label?: string;
}

const StatPanel: React.FC<StatPanelProps> = ({ stats, className = "", label = "Your Stats" }) => {
  return (
    <div className={`bg-slate-900/80 p-3 rounded-xl border border-slate-700 ${className}`}>
      <h4 className="text-slate-400 text-[10px] uppercase font-bold mb-2 tracking-wider">{label}</h4>
      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-500/20 rounded-lg text-red-400">
            <Swords size={16} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Attack</div>
            <div className="font-bold text-sm text-red-200">{stats.attack}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
            <Timer size={16} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Atk Spd</div>
            <div className="font-bold text-sm text-blue-200">{stats.attackSpeed}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-500/20 rounded-lg text-green-400">
            <Heart size={16} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Health</div>
            <div className="font-bold text-sm text-green-200">{stats.hp} / {stats.maxHp}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500/20 rounded-lg text-yellow-400">
            <Zap size={16} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Speed</div>
            <div className="font-bold text-sm text-yellow-200">{stats.speed}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatPanel;