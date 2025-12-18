import React from 'react';
import { PlacedItem, ItemType } from '../types';
import { BACKPACK_COLS, BACKPACK_ROWS } from '../constants';
import { Grip, Zap, RotateCw, Trash2, PackageMinus } from 'lucide-react';

interface BackpackProps {
  items: PlacedItem[];
  onCellClick: (x: number, y: number) => void;
  onItemClick: (item: PlacedItem) => void;
  selectedItemId: string | null;
  onRotate?: (item: PlacedItem) => void;
  onSell?: (item: PlacedItem) => void;
  onStore?: (item: PlacedItem) => void;
  className?: string;
  readOnly?: boolean;
  isBattling?: boolean;
}

const CELL_SIZE = 36;

const Backpack: React.FC<BackpackProps> = ({ 
  items, 
  onCellClick, 
  onItemClick,
  selectedItemId,
  onRotate,
  onSell,
  onStore,
  className = "",
  readOnly = false,
  isBattling = false
}) => {
  
  const cells = [];
  for (let y = 0; y < BACKPACK_ROWS; y++) {
    for (let x = 0; x < BACKPACK_COLS; x++) {
      cells.push(
        <div 
          key={`${x}-${y}`}
          onClick={() => !readOnly && onCellClick(x, y)}
          className={`
            border border-slate-700 bg-slate-900/40 rounded-sm
            ${!readOnly ? 'hover:bg-slate-800 cursor-pointer' : ''}
          `}
          style={{ width: CELL_SIZE, height: CELL_SIZE }}
        />
      );
    }
  }

  const containerWidth = (BACKPACK_COLS * CELL_SIZE) + 16 + (BACKPACK_COLS - 1) * 2;
  const containerHeight = (BACKPACK_ROWS * CELL_SIZE) + 16 + (BACKPACK_ROWS - 1) * 2;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {!isBattling && (
        <div className="flex justify-between items-center w-full mb-1 px-1">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Grip size={12} /> Backpack
          </h3>
          {!readOnly && selectedItemId && (
            <div className="flex gap-1">
               <button onClick={(e) => { e.stopPropagation(); if(onRotate && selectedItemId) { const i = items.find(x=>x.id===selectedItemId); if(i) onRotate(i); } }} className="p-1 bg-blue-600 rounded text-white hover:bg-blue-500" title="Rotate"><RotateCw size={12}/></button>
               <button onClick={(e) => { e.stopPropagation(); if(onStore && selectedItemId) { const i = items.find(x=>x.id===selectedItemId); if(i) onStore(i); } }} className="p-1 bg-orange-600 rounded text-white hover:bg-orange-500" title="To Storage"><PackageMinus size={12}/></button>
               <button onClick={(e) => { e.stopPropagation(); if(onSell && selectedItemId) { const i = items.find(x=>x.id===selectedItemId); if(i) onSell(i); } }} className="p-1 bg-red-600 rounded text-white hover:bg-red-500" title="Sell"><Trash2 size={12}/></button>
            </div>
          )}
        </div>
      )}

      <div 
        className="relative bg-slate-800/80 p-2 rounded-lg border-4 border-slate-700 shadow-xl"
        style={{ width: containerWidth, height: containerHeight }}
      >
         <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${BACKPACK_COLS}, ${CELL_SIZE}px)` }}>{cells}</div>

         {items.map((placedItem) => {
           const isRotated = placedItem.rotation === 90 || placedItem.rotation === 270;
           const w = isRotated ? placedItem.item.height : placedItem.item.width;
           const h = isRotated ? placedItem.item.width : placedItem.item.height;
           const pxWidth = (w * CELL_SIZE) + ((w - 1) * 2);
           const pxHeight = (h * CELL_SIZE) + ((h - 1) * 2);
           const pxLeft = 8 + (placedItem.x * CELL_SIZE) + (placedItem.x * 2);
           const pxTop = 8 + (placedItem.y * CELL_SIZE) + (placedItem.y * 2);

           let cdPercent = 0;
           if (isBattling && placedItem.item.cooldown && placedItem.currentCooldown !== undefined) {
              const maxCd = placedItem.item.cooldown * (placedItem.bonusCooldownMultiplier || 1);
              cdPercent = (placedItem.currentCooldown / maxCd) * 100;
           }

           const isSelected = selectedItemId === placedItem.id;

           return (
             <div
               key={placedItem.id}
               onClick={(e) => { e.stopPropagation(); !readOnly && onItemClick(placedItem); }}
               className={`
                 absolute flex items-center justify-center transition-all duration-200
                 ${readOnly ? '' : 'cursor-grab hover:brightness-110'}
                 ${isSelected ? 'ring-2 ring-accent z-20 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'z-10 shadow-md'}
                 bg-slate-700 border border-slate-600 rounded-md overflow-hidden
               `}
               style={{ left: pxLeft, top: pxTop, width: pxWidth, height: pxHeight }}
             >
                <div 
                  className="relative z-10 select-none transform transition-transform duration-300 w-full h-full p-1" 
                  style={{ transform: `rotate(${placedItem.rotation}deg)` }}
                >
                   {placedItem.item.imageUrl ? (
                     <img src={placedItem.item.imageUrl} alt={placedItem.item.name} className="w-full h-full object-contain" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-2xl" style={{ transform: `scale(${Math.min(w, h)})` }}>{placedItem.item.emoji}</div>
                   )}
                </div>

                <div className="absolute top-1 left-1 z-20 opacity-70">{placedItem.item.type === ItemType.BOOSTER && <Zap size={8} className="text-yellow-400" />}</div>
                
                {!isBattling && !readOnly && (
                   <div className="absolute bottom-1 right-1 flex gap-0.5 z-20 pointer-events-none">
                     {placedItem.bonusAttack ? <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-sm" /> : null}
                     {placedItem.bonusHp ? <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-sm" /> : null}
                     {placedItem.bonusCooldownMultiplier && placedItem.bonusCooldownMultiplier < 1 ? <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-sm" /> : null}
                   </div>
                )}

                {isBattling && placedItem.item.type === ItemType.SUMMONER && (
                  <div className="absolute bottom-0 left-0 w-full bg-black/60 z-10 transition-all duration-100 ease-linear" style={{ height: `${cdPercent}%` }} />
                )}
             </div>
           );
         })}
      </div>
    </div>
  );
};

export default Backpack;