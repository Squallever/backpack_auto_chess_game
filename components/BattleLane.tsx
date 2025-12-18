import React from 'react';
import { Unit } from '../types';

interface BattleLaneProps {
  units: Unit[];
  laneLength: number;
}

const BattleLane: React.FC<BattleLaneProps> = ({ units, laneLength }) => {
  return (
    <div className="relative flex-1 h-full bg-slate-900 border-y-2 border-slate-700 overflow-hidden mx-2 rounded-lg bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(90deg, transparent 49%, #fff 50%, transparent 51%)', backgroundSize: '50px 100%' }}></div>
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600/30 dashed"></div>

      {units.map((unit) => {
        const leftPercent = (unit.x / laneLength) * 100;
        
        return (
          <div
            key={unit.id}
            className={`
              absolute top-1/2 -translate-y-1/2 transition-transform duration-75
              flex flex-col items-center
              ${unit.team === 'ENEMY' ? '-scale-x-100' : ''}
            `}
            style={{ 
              left: `${leftPercent}%`,
              width: '40px',
              height: '40px',
              marginLeft: '-20px',
              zIndex: Math.floor(unit.x)
            }}
          >
            <div className={`w-8 h-1.5 bg-slate-700 rounded-full mb-1 overflow-hidden border border-black/50 ${unit.team === 'ENEMY' ? 'scale-x-[-1]' : ''}`}>
              <div 
                className={`h-full ${unit.team === 'PLAYER' ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${(unit.currentHp / unit.stats.maxHp) * 100}%` }}
              />
            </div>

            <div className={`
              w-10 h-10 flex items-center justify-center filter drop-shadow-lg select-none
              ${unit.state === 'ATTACK' ? 'animate-bounce-short' : ''}
              ${unit.state === 'WALK' ? 'animate-pulse-fast' : ''}
            `}>
              <span className="text-3xl">{unit.emoji}</span>
            </div>

            {unit.state === 'ATTACK' && (
              <div className="absolute top-0 -right-4 text-xl animate-ping">💥</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BattleLane;