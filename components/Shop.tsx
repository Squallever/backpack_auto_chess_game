import React, { useState } from 'react';
import { Item, Rarity, ItemType, PlacedItem } from '../types';
import { ShoppingCart, Coins, Swords, Heart, Zap, PackageOpen, RotateCw, Trash2, ArrowUpFromLine, Timer, Crosshair, Footprints } from 'lucide-react';

interface ShopProps {
  gold: number;
  onBuyItem: (item: Item) => void;
  storageItems: PlacedItem[];
  onStorageItemClick: (item: PlacedItem) => void;
  selectedStorageId: string | null;
  onSellStorage: (item: PlacedItem) => void;
  onEquipStorage: (item: PlacedItem) => void;
  shopItems: Item[]; // Mapped from constants in App.tsx
}

const getRarityColor = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.COMMON: return 'border-slate-600 bg-slate-800';
    case Rarity.RARE: return 'border-blue-500 bg-blue-900/30';
    case Rarity.EPIC: return 'border-purple-500 bg-purple-900/30';
    case Rarity.LEGENDARY: return 'border-yellow-500 bg-yellow-900/30';
    default: return 'border-slate-600';
  }
};

const Tooltip: React.FC<{ item: Item; x: number; y: number }> = ({ item, x, y }) => {
  const isSummoner = item.type === ItemType.SUMMONER;
  return (
    <div className="fixed z-[110] w-64 bg-slate-900/95 backdrop-blur border-2 border-slate-500 rounded-xl shadow-2xl p-3 flex flex-col gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150" style={{ left: x, top: y }}>
      <div className={`flex items-start gap-3 pb-2 border-b border-slate-700`}>
          <div className="w-12 h-12 bg-slate-800 p-1 rounded-lg border border-slate-600 shadow-inner flex items-center justify-center overflow-hidden">
             {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" /> : <span className="text-3xl">{item.emoji}</span>}
          </div>
          <div className="flex-1 min-w-0">
              <div className={`font-bold text-sm leading-tight ${item.rarity === Rarity.LEGENDARY ? 'text-yellow-400' : 'text-white'}`}>{item.name}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{item.rarity} {item.type}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-yellow-200"><Coins size={10} /> <span className="font-bold">{item.cost} Gold</span></div>
          </div>
      </div>
      {isSummoner && item.unitStats && (
        <div className="grid grid-cols-2 gap-1.5 text-xs bg-black/20 p-2 rounded-lg">
           <div className="flex justify-between items-center"><span className="text-slate-400 flex items-center gap-1"><Heart size={10}/> HP</span><span className="font-bold text-green-400">{item.unitStats.hp}</span></div>
           <div className="flex justify-between items-center"><span className="text-slate-400 flex items-center gap-1"><Swords size={10}/> ATK</span><span className="font-bold text-red-400">{item.unitStats.attack}</span></div>
           <div className="flex justify-between items-center"><span className="text-slate-400 flex items-center gap-1"><Timer size={10}/> SPD</span><span className="font-bold text-yellow-400">{item.unitStats.attackSpeed}/s</span></div>
           <div className="flex justify-between items-center"><span className="text-slate-400 flex items-center gap-1"><Crosshair size={10}/> RNG</span><span className="font-bold text-blue-400">{item.unitStats.range}</span></div>
           <div className="flex justify-between items-center col-span-2 border-t border-slate-700/50 pt-1 mt-0.5"><span className="text-slate-400 flex items-center gap-1"><Footprints size={10}/> Move Speed</span><span className="font-bold text-slate-200">{item.unitStats.speed}</span></div>
        </div>
      )}
      <div className="space-y-1 text-xs">
          {item.cooldown && <div className="flex items-center justify-between bg-slate-800 px-2 py-1 rounded"><span className="text-slate-400 flex items-center gap-1"><RotateCw size={10}/> Spawn Rate</span><span className="text-white font-bold">{item.cooldown}s</span></div>}
          <div className="flex items-center justify-between bg-slate-800 px-2 py-1 rounded"><span className="text-slate-400 flex items-center gap-1"><PackageOpen size={10}/> Size</span><span className="text-white font-bold">{item.width} x {item.height}</span></div>
      </div>
      <div className="bg-slate-800/80 p-2 rounded text-[10px] text-slate-300 italic leading-snug border border-slate-700">{item.effectDescription || "No additional effects."}</div>
      <div className="text-[9px] text-accent/80 text-center font-bold uppercase tracking-widest pt-1">{item.type === ItemType.BOOSTER ? "Buffs Adjacent Units" : "Buffable by Boosters"}</div>
    </div>
  );
};

const Shop: React.FC<ShopProps> = ({ gold, onBuyItem, storageItems, onStorageItemClick, selectedStorageId, onSellStorage, onEquipStorage, shopItems }) => {
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (item: Item, e: React.MouseEvent) => {
     const rect = e.currentTarget.getBoundingClientRect();
     let x = rect.left - 270; if (x < 10) x = rect.right + 10;
     let y = rect.top; if (y + 350 > window.innerHeight) y = window.innerHeight - 350; if (y < 10) y = 10;
     setTooltipPos({ x, y }); setHoveredItem(item);
  };

  const handleMouseLeave = () => setHoveredItem(null);

  return (
    <div className="flex flex-col h-full w-full gap-2 relative">
      {hoveredItem && <Tooltip item={hoveredItem} x={tooltipPos.x} y={tooltipPos.y} />}
      <div className="flex justify-between items-center px-1 shrink-0">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200"><ShoppingCart size={20} className="text-accent" /> Shop</h2>
        <div className="bg-slate-900 px-3 py-1 rounded-full border border-yellow-600/50 flex items-center gap-2 shadow-inner"><Coins size={16} className="text-yellow-400" /><span className="text-yellow-400 font-bold text-base">{gold}</span></div>
      </div>
      <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-1 flex-1 content-start min-h-0">
        {shopItems.map((item) => {
          const canAfford = gold >= item.cost;
          return (
            <button
              key={item.id}
              onClick={() => canAfford && onBuyItem(item)}
              onMouseEnter={(e) => handleMouseEnter(item, e)}
              onMouseLeave={handleMouseLeave}
              disabled={!canAfford}
              className={`relative p-2 rounded-lg border flex flex-col items-start text-left transition-all min-h-[80px] ${getRarityColor(item.rarity)} ${!canAfford ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 hover:shadow-lg hover:border-slate-400'}`}
            >
              <div className="flex justify-between w-full mb-1">
                <span className="w-8 h-8 flex items-center justify-center filter drop-shadow-md overflow-hidden">{item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-contain" /> : <span className="text-2xl">{item.emoji}</span>}</span>
                <span className="font-bold text-xs bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1 text-yellow-100">{item.cost}<Coins size={8} /></span>
              </div>
              <div className="font-bold text-[10px] truncate w-full text-white leading-tight mb-1">{item.name}</div>
              {item.type === ItemType.SUMMONER ? <div className="flex gap-1 mt-auto w-full"><span className="text-[10px] font-bold flex items-center gap-0.5 text-red-300 bg-red-900/30 px-1 rounded"><Swords size={8}/>{item.unitStats?.attack}</span><span className="text-[10px] font-bold flex items-center gap-0.5 text-green-300 bg-green-900/30 px-1 rounded"><Heart size={8}/>{item.unitStats?.hp}</span></div> : <div className="text-[9px] text-yellow-200 mt-auto flex items-center gap-0.5"><Zap size={8} /> {item.width}x{item.height} Boost</div>}
            </button>
          );
        })}
      </div>
      <div className="h-24 bg-slate-900/60 rounded-xl border-t-2 border-slate-700 p-2 flex flex-col gap-1 shrink-0">
         <div className="flex justify-between items-center mb-1"><h3 className="text-slate-400 text-xs font-bold uppercase flex items-center gap-1"><PackageOpen size={12}/> Storage</h3>{selectedStorageId && <div className="flex gap-2"><button onClick={() => { const i = storageItems.find(x => x.id === selectedStorageId); if(i) onEquipStorage(i); }} className="bg-green-700 text-white px-2 py-0.5 rounded text-[10px] hover:bg-green-600 flex items-center gap-1 font-bold"><ArrowUpFromLine size={10}/> EQUIP</button><button onClick={() => { const i = storageItems.find(x => x.id === selectedStorageId); if(i) onSellStorage(i); }} className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-800 text-[10px] hover:bg-red-900 flex items-center gap-1 font-bold"><Trash2 size={10}/> SELL</button></div>}</div>
         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide h-full items-center">{storageItems.length === 0 && <span className="text-slate-600 text-xs italic px-2">Storage Empty</span>}{storageItems.map((sItem) => <div key={sItem.id} onClick={() => onStorageItemClick(sItem)} className={`w-12 h-12 shrink-0 bg-slate-800 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all overflow-hidden p-1 ${selectedStorageId === sItem.id ? 'border-accent ring-2 ring-accent scale-105' : 'border-slate-600 hover:border-slate-500'}`}>{sItem.item.imageUrl ? <img src={sItem.item.imageUrl} className="w-full h-full object-contain" /> : <span className="text-2xl">{sItem.item.emoji}</span>}</div>)}</div>
      </div>
    </div>
  );
};

export default Shop;