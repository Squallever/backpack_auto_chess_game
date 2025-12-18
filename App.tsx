import React, { useState, useEffect, useRef } from 'react';
import { PlacedItem, Item, ItemType, GamePhase, Unit, Hero, Opponent } from './types';
import { BACKPACK_COLS, BACKPACK_ROWS, STARTING_GOLD, LANE_LENGTH, HERO_MAX_HP, MAX_LIVES, SHOP_ITEMS } from './constants';
import Backpack from './components/Backpack';
import Shop from './components/Shop';
import BattleLane from './components/BattleLane';
import { generateOpponent, generateBattleCommentary } from './services/geminiService';
import { Play, Swords, Heart, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  // -- Game State --
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [round, setRound] = useState(1);
  const [gold, setGold] = useState(STARTING_GOLD);
  const [lives, setLives] = useState(MAX_LIVES);
  const [wins, setWins] = useState(0);

  // Inventory
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [storageItems, setStorageItems] = useState<PlacedItem[]>([]);
  
  // Selection
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null);

  // Battle Data
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [playerHero, setPlayerHero] = useState<Hero>({ hp: HERO_MAX_HP, maxHp: HERO_MAX_HP });
  const [enemyHero, setEnemyHero] = useState<Hero>({ hp: HERO_MAX_HP, maxHp: HERO_MAX_HP });
  const [units, setUnits] = useState<Unit[]>([]);
  const [battleTime, setBattleTime] = useState(0);
  const [commentary, setCommentary] = useState("");

  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const gameStateRef = useRef({
    units: [] as Unit[],
    playerItems: [] as PlacedItem[],
    enemyItems: [] as PlacedItem[],
    playerHero: { hp: HERO_MAX_HP, maxHp: HERO_MAX_HP },
    enemyHero: { hp: HERO_MAX_HP, maxHp: HERO_MAX_HP },
    isPlaying: false
  });

  const calculateBonuses = (items: PlacedItem[]) => {
    const itemsWithBonuses = items.map(i => ({ ...i, bonusAttack: 0, bonusHp: 0, bonusCooldownMultiplier: 1 }));
    const gridMap = new Map<string, string>();
    itemsWithBonuses.forEach(pi => {
      const isRotated = pi.rotation === 90 || pi.rotation === 270;
      const w = isRotated ? pi.item.height : pi.item.width;
      const h = isRotated ? pi.item.width : pi.item.height;
      for(let y = pi.y; y < pi.y + h; y++) {
        for(let x = pi.x; x < pi.x + w; x++) {
          gridMap.set(`${x},${y}`, pi.id);
        }
      }
    });

    itemsWithBonuses.forEach(booster => {
      if (booster.item.type === ItemType.BOOSTER) {
        const isRotated = booster.rotation === 90 || booster.rotation === 270;
        const w = isRotated ? booster.item.height : booster.item.width;
        const h = isRotated ? booster.item.width : booster.item.height;
        const neighborIds = new Set<string>();
        for(let x = booster.x; x < booster.x + w; x++) {
            const above = gridMap.get(`${x},${booster.y - 1}`);
            if (above && above !== booster.id) neighborIds.add(above);
            const below = gridMap.get(`${x},${booster.y + h}`);
            if (below && below !== booster.id) neighborIds.add(below);
        }
        for(let y = booster.y; y < booster.y + h; y++) {
            const left = gridMap.get(`${booster.x - 1},${y}`);
            if (left && left !== booster.id) neighborIds.add(left);
            const right = gridMap.get(`${booster.x + w},${y}`);
            if (right && right !== booster.id) neighborIds.add(right);
        }
        neighborIds.forEach(nid => {
            const target = itemsWithBonuses.find(i => i.id === nid);
            if (target && target.item.type === ItemType.SUMMONER) {
                 if (booster.item.boostType === 'ATTACK') target.bonusAttack! += booster.item.boostValue!;
                 if (booster.item.boostType === 'HEALTH') target.bonusHp! += booster.item.boostValue!;
                 if (booster.item.boostType === 'SPEED') target.bonusCooldownMultiplier! *= (1 - booster.item.boostValue!);
            }
        });
      }
    });
    return itemsWithBonuses;
  };

  const checkCollision = (list: PlacedItem[], excludeId: string | null, x: number, y: number, w: number, h: number) => {
    if (x < 0 || y < 0 || x + w > BACKPACK_COLS || y + h > BACKPACK_ROWS) return true;
    for (const other of list) {
        if (other.id === excludeId) continue;
        const oRot = other.rotation === 90 || other.rotation === 270;
        const oW = oRot ? other.item.height : other.item.width;
        const oH = oRot ? other.item.width : other.item.height;
        if (x < other.x + oW && x + w > other.x && y < other.y + oH && y + h > other.y) return true;
    }
    return false;
  };

  const handleBuyItem = (item: Item) => {
    if (gold < item.cost) return;
    const newPlacedItem: PlacedItem = { id: Math.random().toString(36).substr(2, 9), item, x: 0, y: 0, rotation: 0 };
    let placed = false;
    for(let y = 0; y <= BACKPACK_ROWS - item.height; y++) {
        for(let x = 0; x <= BACKPACK_COLS - item.width; x++) {
            if (!checkCollision(placedItems, null, x, y, item.width, item.height)) {
                newPlacedItem.x = x; newPlacedItem.y = y;
                setPlacedItems(prev => calculateBonuses([...prev, newPlacedItem]));
                placed = true; break;
            }
        }
        if(placed) break;
    }
    if (placed) setGold(g => g - item.cost);
    else { setStorageItems(prev => [...prev, newPlacedItem]); setGold(g => g - item.cost); }
  };

  const handleGridCellClick = (x: number, y: number) => {
    if (phase !== GamePhase.SHOP) return;
    if (selectedItemId) {
        const currentItem = placedItems.find(i => i.id === selectedItemId);
        if (!currentItem) return;
        const isRotated = currentItem.rotation === 90 || currentItem.rotation === 270;
        const w = isRotated ? currentItem.item.height : currentItem.item.width;
        const h = isRotated ? currentItem.item.width : currentItem.item.height;
        if (!checkCollision(placedItems, selectedItemId, x, y, w, h)) {
            const updated = placedItems.map(i => i.id === selectedItemId ? { ...i, x, y } : i);
            setPlacedItems(calculateBonuses(updated));
            setSelectedItemId(null);
        }
    }
  };

  const handleItemClick = (item: PlacedItem) => {
      if (phase !== GamePhase.SHOP) return;
      setSelectedItemId(item.id === selectedItemId ? null : item.id);
      setSelectedStorageId(null);
  };

  const handleRotateItem = (item: PlacedItem) => {
      const nextRot = (item.rotation + 90) % 360 as 0 | 90 | 180 | 270;
      const isRotatedNow = nextRot === 90 || nextRot === 270;
      const newW = isRotatedNow ? item.item.height : item.item.width;
      const newH = isRotatedNow ? item.item.width : item.item.height;
      let newX = item.x; let newY = item.y;
      if (newX + newW > BACKPACK_COLS) newX = BACKPACK_COLS - newW;
      if (newY + newH > BACKPACK_ROWS) newY = BACKPACK_ROWS - newH;
      if (!checkCollision(placedItems, item.id, newX, newY, newW, newH)) {
          const updated = placedItems.map(i => i.id === item.id ? { ...i, rotation: nextRot, x: newX, y: newY } : i);
          setPlacedItems(calculateBonuses(updated));
      }
  };

  const handleSellItem = (item: PlacedItem) => {
      setPlacedItems(prev => calculateBonuses(prev.filter(i => i.id !== item.id)));
      setGold(g => g + Math.floor(item.item.cost / 2));
      setSelectedItemId(null);
  };

  const handleStoreItem = (item: PlacedItem) => {
      setPlacedItems(prev => calculateBonuses(prev.filter(i => i.id !== item.id)));
      setStorageItems(prev => [...prev, item]);
      setSelectedItemId(null);
  };

  const handleEquipStorage = (item: PlacedItem) => {
      let placed = false;
      const w = item.item.width; const h = item.item.height;
      for(let y = 0; y <= BACKPACK_ROWS - h; y++) {
        for(let x = 0; x <= BACKPACK_COLS - w; x++) {
            if (!checkCollision(placedItems, null, x, y, w, h)) {
                const newItem = { ...item, x, y, rotation: 0 as const };
                setPlacedItems(prev => calculateBonuses([...prev, newItem]));
                setStorageItems(prev => prev.filter(i => i.id !== item.id));
                placed = true; break;
            }
        }
        if(placed) break;
      }
      setSelectedStorageId(null);
  };

  const handleStorageClick = (item: PlacedItem) => {
    setSelectedStorageId(item.id === selectedStorageId ? null : item.id);
    setSelectedItemId(null);
  };

  const handleSellStorage = (item: PlacedItem) => {
    setStorageItems(prev => prev.filter(i => i.id !== item.id));
    setGold(g => g + Math.floor(item.item.cost / 2));
    setSelectedStorageId(null);
  };

  const handleResetGame = () => {
    setPhase(GamePhase.MENU);
    setRound(1);
    setGold(STARTING_GOLD);
    setLives(MAX_LIVES);
    setWins(0);
    setPlacedItems([]);
    setStorageItems([]);
    setUnits([]);
    setBattleTime(0);
    setCommentary("");
  };

  const startBattle = async () => {
    setPhase(GamePhase.BATTLE_PREP);
    setSelectedItemId(null); setSelectedStorageId(null);
    const opp = await generateOpponent(round, wins);
    const calculatedOppItems = calculateBonuses(opp.items); 
    setOpponent({ ...opp, items: calculatedOppItems });
    gameStateRef.current = {
      units: [],
      playerItems: placedItems.map(s => ({ ...s, currentCooldown: Math.random() * 0.5 })), 
      enemyItems: calculatedOppItems.map(s => ({ ...s, currentCooldown: Math.random() * 0.5 })),
      playerHero: { hp: HERO_MAX_HP, maxHp: HERO_MAX_HP },
      enemyHero: { hp: HERO_MAX_HP, maxHp: HERO_MAX_HP },
      isPlaying: true
    };
    setPlayerHero({ ...gameStateRef.current.playerHero });
    setEnemyHero({ ...gameStateRef.current.enemyHero });
    setUnits([]); setBattleTime(0); setPhase(GamePhase.BATTLE);
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = (time: number) => {
    if (!gameStateRef.current.isPlaying) return;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    setBattleTime(t => t + dt);
    const state = gameStateRef.current;
    
    [state.playerItems, state.enemyItems].forEach((items, teamIdx) => {
      const isPlayer = teamIdx === 0;
      items.forEach(pi => {
        if (pi.item.type === ItemType.SUMMONER && pi.item.unitStats) {
          if (pi.currentCooldown === undefined) pi.currentCooldown = 0;
          pi.currentCooldown -= dt;
          if (pi.currentCooldown <= 0) {
            const maxCd = pi.item.cooldown! * (pi.bonusCooldownMultiplier || 1);
            pi.currentCooldown = maxCd;
            const stats = pi.item.unitStats;
            const finalHp = stats.hp + (pi.bonusHp || 0);
            const finalAtk = stats.attack + (pi.bonusAttack || 0);
            const spawnJitter = Math.random() * 40; 
            const spawnX = isPlayer ? spawnJitter : (LANE_LENGTH - spawnJitter);
            state.units.push({
              id: Math.random().toString(36).substr(2, 9),
              sourceItemId: pi.item.id,
              emoji: pi.item.emoji,
              team: isPlayer ? 'PLAYER' : 'ENEMY',
              x: spawnX,
              stats: { ...stats, hp: finalHp, maxHp: finalHp, attack: finalAtk },
              currentHp: finalHp,
              lastAttackTime: 0,
              state: 'WALK'
            });
          }
        }
      });
    });

    const deadUnitIds = new Set<string>();
    state.units.forEach(unit => {
      if (deadUnitIds.has(unit.id)) return;
      let target: Unit | Hero | null = null;
      let distToTarget = Infinity;
      if (unit.team === 'PLAYER') {
        const enemies = state.units.filter(u => u.team === 'ENEMY' && u.x >= unit.x && !deadUnitIds.has(u.id));
        if (enemies.length > 0) { 
          enemies.sort((a, b) => a.x - b.x); 
          const closestEnemy = enemies[0];
          target = closestEnemy; 
          distToTarget = closestEnemy.x - unit.x; 
        }
        else { distToTarget = LANE_LENGTH - unit.x; target = state.enemyHero; }
      } else {
        const enemies = state.units.filter(u => u.team === 'PLAYER' && u.x <= unit.x && !deadUnitIds.has(u.id));
        if (enemies.length > 0) { 
          enemies.sort((a, b) => b.x - a.x); 
          const closestEnemy = enemies[0];
          target = closestEnemy; 
          distToTarget = unit.x - closestEnemy.x; 
        }
        else { distToTarget = unit.x; target = state.playerHero; }
      }
      if (distToTarget <= unit.stats.range) {
        unit.state = 'ATTACK';
        unit.lastAttackTime += dt;
        if (unit.lastAttackTime >= (1 / unit.stats.attackSpeed)) {
          unit.lastAttackTime = 0;
          if (target && 'currentHp' in target) {
            (target as Unit).currentHp -= unit.stats.attack;
            if ((target as Unit).currentHp <= 0) deadUnitIds.add((target as Unit).id);
          } else if (target) {
             if (unit.team === 'PLAYER') state.enemyHero.hp -= unit.stats.attack;
             else state.playerHero.hp -= unit.stats.attack;
          }
        }
      } else {
        unit.state = 'WALK'; unit.lastAttackTime = 0; 
        const moveDist = unit.stats.speed * 10 * dt;
        if (unit.team === 'PLAYER') unit.x += moveDist; else unit.x -= moveDist;
      }
    });
    state.units = state.units.filter(u => !deadUnitIds.has(u.id));
    setUnits([...state.units]); setPlayerHero({ ...state.playerHero }); setEnemyHero({ ...state.enemyHero }); setPlacedItems([...state.playerItems]);
    if (state.enemyHero.hp <= 0) endBattle(true);
    else if (state.playerHero.hp <= 0) endBattle(false);
    else animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const endBattle = async (victory: boolean) => {
    gameStateRef.current.isPlaying = false;
    cancelAnimationFrame(animationFrameRef.current);
    if (victory) {
      setWins(w => w + 1); setGold(g => g + 8 + (wins * 2));
      const comment = await generateBattleCommentary("Player", battleTime);
      setCommentary(comment); setPhase(GamePhase.VICTORY);
    } else {
      setLives(l => l - 1);
      if (lives - 1 <= 0) setPhase(GamePhase.GAME_OVER);
      else setPhase(GamePhase.DEFEAT);
    }
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 bg-slate-900 z-50 absolute inset-0">
      <div className="text-center animate-in zoom-in duration-500">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm mb-2">TOY RUMBLE</h1>
        <p className="text-slate-400 text-xl font-medium tracking-wide">Backpack Management Auto-Chess</p>
      </div>
      <button onClick={() => setPhase(GamePhase.SHOP)} className="px-10 py-5 bg-primary hover:bg-indigo-500 text-white text-xl font-bold rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center gap-3 transition-all hover:scale-105 active:scale-95"><Play fill="currentColor" size={24} /> ENTER TOYROOM</button>
    </div>
  );

  const renderBattleUI = () => (
    <div className="flex flex-row h-full w-full p-2 gap-2 max-w-7xl mx-auto overflow-hidden bg-slate-900/40">
      <div className="w-32 sm:w-48 flex flex-col gap-1 bg-slate-800/80 p-2 rounded-xl border border-slate-700 shrink-0">
        <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-lg shrink-0 border border-white/20">😎</div><div><div className="font-bold text-xs">YOU</div><div className="text-[10px] text-green-400 font-mono">{playerHero.hp.toFixed(0)} HP</div></div></div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-2 border border-black/40"><div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-200" style={{ width: `${Math.max(0, (playerHero.hp / HERO_MAX_HP) * 100)}%` }}></div></div>
        <div className="flex-1 overflow-hidden relative"><div className="absolute top-0 left-0 origin-top-left transform scale-50 sm:scale-75"><Backpack items={gameStateRef.current.isPlaying ? gameStateRef.current.playerItems : placedItems} onCellClick={()=>{}} onItemClick={()=>{}} selectedItemId={null} readOnly={true} isBattling={phase === GamePhase.BATTLE} /></div></div>
      </div>
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur px-4 py-1 rounded-full text-sm font-mono text-yellow-400 z-10 border border-slate-700 shadow-lg">{battleTime.toFixed(1)}s</div>
        {phase === GamePhase.BATTLE_PREP ? <div className="flex-1 flex items-center justify-center flex-col gap-4"><BrainCircuit className="text-primary animate-pulse" size={64} /><div className="text-xl font-bold text-slate-300">Summoning Opponent...</div></div> : <BattleLane units={units} laneLength={LANE_LENGTH} />}
      </div>
      <div className="w-32 sm:w-48 flex flex-col gap-1 bg-slate-800/80 p-2 rounded-xl border border-slate-700 shrink-0">
        <div className="flex items-center justify-end gap-2 mb-1"><div className="text-right"><div className="font-bold text-xs text-red-300">{opponent?.name || 'Enemy'}</div><div className="text-[10px] text-red-400 font-mono">{enemyHero.hp.toFixed(0)} HP</div></div><div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-lg shrink-0 border border-white/20">{opponent?.avatarEmoji || '😈'}</div></div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-2 border border-black/40"><div className="h-full bg-gradient-to-l from-red-600 to-red-400 transition-all duration-200 ml-auto" style={{ width: `${Math.max(0, (enemyHero.hp / HERO_MAX_HP) * 100)}%` }}></div></div>
        <div className="flex-1 overflow-hidden relative">{opponent && <div className="absolute top-0 right-0 origin-top-right transform scale-50 sm:scale-75"><Backpack items={gameStateRef.current.isPlaying ? gameStateRef.current.enemyItems : opponent.items} onCellClick={()=>{}} onItemClick={()=>{}} selectedItemId={null} readOnly={true} isBattling={phase === GamePhase.BATTLE} /></div>}</div>
      </div>
    </div>
  );

  const renderShopUI = () => {
    return (
      <div className="flex flex-row h-full w-full p-2 gap-4 max-w-7xl mx-auto overflow-hidden">
        <div className="w-auto shrink-0 flex flex-col gap-2 h-full">
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center shrink-0 shadow-lg">
             <div><span className="font-bold text-slate-300 block text-xs uppercase tracking-tighter opacity-70">Round {round}</span><div className="flex gap-0.5 mt-1">{Array.from({length: MAX_LIVES}).map((_, i) => <Heart key={i} size={14} className={`${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} />)}</div></div>
             <button onClick={startBattle} className="bg-gradient-to-br from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-2 rounded-lg font-black shadow-[0_4px_10px_rgba(22,163,74,0.4)] animate-pulse hover:animate-none flex items-center gap-2 text-sm transition-all active:translate-y-0.5">FIGHT <Swords size={16} /></button>
          </div>
          <div className="flex-1 flex flex-col items-center bg-slate-800/30 rounded-xl p-2 border border-slate-700/50 overflow-y-auto shadow-inner">
             <Backpack items={placedItems} onCellClick={handleGridCellClick} onItemClick={handleItemClick} selectedItemId={selectedItemId} onRotate={handleRotateItem} onSell={handleSellItem} onStore={handleStoreItem} />
             <div className="mt-2 text-center text-[10px] text-slate-500 italic max-w-[200px]">{selectedItemId ? 'Drag to Move / Tap to Action' : 'Manage your Inventory'}</div>
          </div>
        </div>
        <div className="flex-1 bg-slate-800/80 rounded-2xl border border-slate-700 p-3 shadow-2xl min-w-0 overflow-hidden flex flex-col h-full backdrop-blur-sm">
           <Shop 
             gold={gold} onBuyItem={handleBuyItem} storageItems={storageItems} onStorageItemClick={handleStorageClick} selectedStorageId={selectedStorageId} onSellStorage={handleSellStorage} onEquipStorage={handleEquipStorage} 
             shopItems={SHOP_ITEMS}
           />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full relative bg-slate-950">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/10 blur-[150px] rounded-full"></div>
      </div>
      
      {phase === GamePhase.MENU && renderMenu()}
      {phase === GamePhase.SHOP && renderShopUI()}
      {(phase === GamePhase.BATTLE || phase === GamePhase.BATTLE_PREP) && renderBattleUI()}
      
      {phase === GamePhase.VICTORY && (
        <>{renderBattleUI()}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in">
            <div className="text-9xl mb-4 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">🏆</div>
            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 mb-2">VICTORY</h2>
            <p className="text-slate-300 italic mb-8 px-6 text-center max-w-lg font-serif text-lg">"{commentary}"</p>
            <button onClick={() => { setRound(r => r + 1); setPhase(GamePhase.SHOP); }} className="px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl">NEXT ROUND</button>
          </div>
        </>
      )}
      
      {phase === GamePhase.DEFEAT && (
        <>{renderBattleUI()}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in">
            <div className="text-9xl mb-4 text-slate-600 grayscale opacity-50">💀</div>
            <h2 className="text-6xl font-black text-red-600 mb-2">DEFEAT</h2>
            <p className="text-slate-400 mb-8 text-xl font-bold uppercase tracking-widest">Lives Remaining: {lives}</p>
            <button onClick={() => setPhase(GamePhase.SHOP)} className="px-12 py-4 bg-slate-800 text-white font-black text-xl rounded-full hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all border border-slate-600">RETREAT TO SHOP</button>
          </div>
        </>
      )}
      
      {phase === GamePhase.GAME_OVER && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center z-50 animate-in zoom-in">
          <div className="text-[10rem] mb-4">🪦</div>
          <h2 className="text-7xl font-black text-slate-200 mb-2 tracking-tighter">GAME OVER</h2>
          <p className="text-2xl text-yellow-400 mb-10 font-mono font-bold uppercase">REACHED ROUND {round}</p>
          <button onClick={handleResetGame} className="px-16 py-6 bg-primary text-white font-black text-3xl rounded-2xl hover:bg-indigo-500 shadow-[0_10px_40px_rgba(99,102,241,0.5)] transition-all hover:scale-105 active:scale-95">NEW CAMPAIGN</button>
        </div>
      )}
    </div>
  );
};

export default App;