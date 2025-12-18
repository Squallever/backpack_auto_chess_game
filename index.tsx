import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  Play, Swords, Heart, BrainCircuit, Grip, Zap, 
  RotateCw, Trash2, PackageMinus, ShoppingCart, 
  Coins, PackageOpen, ArrowUpFromLine, Timer, 
  Crosshair, Footprints, ChevronRight
} from 'lucide-react';

// --- TYPES & ENUMS ---
enum Rarity { COMMON = 'Common', RARE = 'Rare', EPIC = 'Epic', LEGENDARY = 'Legendary' }
enum ItemType { SUMMONER = 'Summoner', BOOSTER = 'Booster' }
enum GamePhase { MENU = 'MENU', SHOP = 'SHOP', BATTLE_PREP = 'BATTLE_PREP', BATTLE = 'BATTLE', VICTORY = 'VICTORY', DEFEAT = 'DEFEAT', GAME_OVER = 'GAME_OVER' }

interface UnitStats { hp: number; maxHp: number; attack: number; speed: number; range: number; attackSpeed: number; }
interface Item { id: string; name: string; emoji: string; type: ItemType; rarity: Rarity; cost: number; width: number; height: number; cooldown?: number; unitStats?: UnitStats; effectDescription: string; boostType?: 'SPEED' | 'ATTACK' | 'HEALTH'; boostValue?: number; }
interface PlacedItem { id: string; item: Item; x: number; y: number; rotation: 0 | 90 | 180 | 270; currentCooldown?: number; bonusAttack?: number; bonusHp?: number; bonusCooldownMultiplier?: number; }
interface Unit { id: string; sourceItemId: string; emoji: string; team: 'PLAYER' | 'ENEMY'; x: number; stats: UnitStats; currentHp: number; lastAttackTime: number; state: 'WALK' | 'ATTACK' | 'IDLE'; }
interface Hero { hp: number; maxHp: number; }
interface Opponent { name: string; description: string; avatarEmoji: string; items: PlacedItem[]; }

// --- CONSTANTS ---
const BACKPACK_COLS = 5;
const BACKPACK_ROWS = 7;
const STARTING_GOLD = 12;
const MAX_LIVES = 5;
const LANE_LENGTH = 600;
const HERO_MAX_HP = 100;
const CELL_SIZE = 40;

const SHOP_ITEMS: Item[] = [
  { id: 'toy_soldier', name: 'Green Army Man', emoji: '🔫', type: ItemType.SUMMONER, rarity: Rarity.COMMON, cost: 3, width: 1, height: 1, cooldown: 2.5, effectDescription: 'Spawns a Soldier every 2.5s.', unitStats: { hp: 15, maxHp: 15, attack: 5, speed: 45, range: 45, attackSpeed: 1.5 } },
  { id: 'toy_robot', name: 'Beep Boop Bot', emoji: '🤖', type: ItemType.SUMMONER, rarity: Rarity.COMMON, cost: 4, width: 1, height: 1, cooldown: 4.0, effectDescription: 'Spawns a sturdy Robot every 4s.', unitStats: { hp: 45, maxHp: 45, attack: 12, speed: 30, range: 25, attackSpeed: 1.0 } },
  { id: 'toy_duck', name: 'Rubber Ducky', emoji: '🦆', type: ItemType.SUMMONER, rarity: Rarity.RARE, cost: 5, width: 1, height: 1, cooldown: 1.5, effectDescription: 'Spawns a fast Ducky every 1.5s.', unitStats: { hp: 10, maxHp: 10, attack: 6, speed: 85, range: 15, attackSpeed: 2.5 } },
  { id: 'toy_tank', name: 'Battle Tank', emoji: '🚜', type: ItemType.SUMMONER, rarity: Rarity.RARE, cost: 7, width: 2, height: 1, cooldown: 6.0, effectDescription: 'Spawns a heavy Tank every 6s.', unitStats: { hp: 150, maxHp: 150, attack: 30, speed: 20, range: 70, attackSpeed: 0.7 } },
  { id: 'toy_ufo', name: 'Alien UFO', emoji: '🛸', type: ItemType.SUMMONER, rarity: Rarity.EPIC, cost: 9, width: 2, height: 2, cooldown: 5.0, effectDescription: 'Spawns an Alien Invader every 5s.', unitStats: { hp: 80, maxHp: 80, attack: 40, speed: 40, range: 120, attackSpeed: 1.2 } },
  { id: 'boost_battery', name: 'AA Battery', emoji: '🔋', type: ItemType.BOOSTER, rarity: Rarity.COMMON, cost: 3, width: 1, height: 1, effectDescription: 'Adjacent toys spawn 20% faster.', boostType: 'SPEED', boostValue: 0.2 },
  { id: 'boost_drum', name: 'War Drum', emoji: '🥁', type: ItemType.BOOSTER, rarity: Rarity.RARE, cost: 5, width: 1, height: 1, effectDescription: 'Adjacent toys have +10 Attack.', boostType: 'ATTACK', boostValue: 10 },
  { id: 'boost_remote', name: 'Super Controller', emoji: '🎮', type: ItemType.BOOSTER, rarity: Rarity.EPIC, cost: 8, width: 2, height: 1, effectDescription: 'Adjacent toys spawn 40% faster.', boostType: 'SPEED', boostValue: 0.4 }
];

// --- UTILS ---
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
        const above = gridMap.get(`${x},${booster.y - 1}`); if (above && above !== booster.id) neighborIds.add(above);
        const below = gridMap.get(`${x},${booster.y + h}`); if (below && below !== booster.id) neighborIds.add(below);
      }
      for(let y = booster.y; y < booster.y + h; y++) {
        const left = gridMap.get(`${booster.x - 1},${y}`); if (left && left !== booster.id) neighborIds.add(left);
        const right = gridMap.get(`${booster.x + w},${y}`); if (right && right !== booster.id) neighborIds.add(right);
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

// --- APP ---
const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [round, setRound] = useState(1);
  const [gold, setGold] = useState(STARTING_GOLD);
  const [lives, setLives] = useState(MAX_LIVES);
  const [wins, setWins] = useState(0);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [storageItems, setStorageItems] = useState<PlacedItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
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

  const generateAICommentary = async (winner: string) => {
    const apiKey = (process.env as any).API_KEY;
    if (!apiKey) return "What an intense toy battle!";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a short (1 sentence) funny commentary about ${winner} winning a toy rumble.`,
      });
      return resp.text || "Toys everywhere!";
    } catch {
      return "Victory is yours!";
    }
  };

  const startBattle = async () => {
    setPhase(GamePhase.BATTLE_PREP);
    setSelectedItemId(null);
    
    // Simulate Opponent Generation
    const enemyItems: PlacedItem[] = [];
    const budget = 10 + round * 5;
    let spent = 0;
    while(spent < budget) {
      const choice = SHOP_ITEMS[Math.floor(Math.random() * SHOP_ITEMS.length)];
      if (spent + choice.cost > budget) break;
      const rx = Math.floor(Math.random() * (BACKPACK_COLS - choice.width + 1));
      const ry = Math.floor(Math.random() * (BACKPACK_ROWS - choice.height + 1));
      if (!checkCollision(enemyItems, null, rx, ry, choice.width, choice.height)) {
        enemyItems.push({ id: Math.random().toString(), item: choice, x: rx, y: ry, rotation: 0 });
        spent += choice.cost;
      }
    }

    const calculatedEnemyItems = calculateBonuses(enemyItems);
    setOpponent({ name: "Robot Ruler", avatarEmoji: "🤖", description: "Mechanical Master", items: calculatedEnemyItems });
    
    gameStateRef.current = {
      units: [],
      playerItems: calculateBonuses(placedItems).map(i => ({ ...i, currentCooldown: Math.random() })),
      enemyItems: calculatedEnemyItems.map(i => ({ ...i, currentCooldown: Math.random() })),
      playerHero: { hp: HERO_MAX_HP, maxHp: HERO_MAX_HP },
      enemyHero: { hp: HERO_MAX_HP, maxHp: HERO_MAX_HP },
      isPlaying: true
    };

    setPlayerHero({ hp: HERO_MAX_HP, maxHp: HERO_MAX_HP });
    setEnemyHero({ hp: HERO_MAX_HP, maxHp: HERO_MAX_HP });
    setUnits([]);
    setBattleTime(0);
    setPhase(GamePhase.BATTLE);
    
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = (time: number) => {
    if (!gameStateRef.current.isPlaying) return;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    setBattleTime(t => t + dt);

    const state = gameStateRef.current;
    
    // Spawn Units
    [state.playerItems, state.enemyItems].forEach((items, teamIdx) => {
      const isPlayer = teamIdx === 0;
      items.forEach(pi => {
        if (pi.item.type === ItemType.SUMMONER && pi.item.unitStats) {
          if (pi.currentCooldown === undefined) pi.currentCooldown = 0;
          pi.currentCooldown -= dt;
          if (pi.currentCooldown <= 0) {
            const cd = pi.item.cooldown! * (pi.bonusCooldownMultiplier || 1);
            pi.currentCooldown = cd;
            const stats = pi.item.unitStats;
            const hp = stats.hp + (pi.bonusHp || 0);
            const atk = stats.attack + (pi.bonusAttack || 0);
            state.units.push({
              id: Math.random().toString(),
              sourceItemId: pi.item.id,
              emoji: pi.item.emoji,
              team: isPlayer ? 'PLAYER' : 'ENEMY',
              x: isPlayer ? 0 : LANE_LENGTH,
              stats: { ...stats, hp, maxHp: hp, attack: atk },
              currentHp: hp,
              lastAttackTime: 0,
              state: 'WALK'
            });
          }
        }
      });
    });

    // Update Units
    const deadIds = new Set<string>();
    state.units.forEach(u => {
      let target = null;
      let dist = Infinity;
      if (u.team === 'PLAYER') {
        const enemies = state.units.filter(e => e.team === 'ENEMY');
        if (enemies.length > 0) {
          enemies.sort((a,b) => a.x - b.x);
          target = enemies[0];
          dist = target.x - u.x;
        } else {
          target = state.enemyHero;
          dist = LANE_LENGTH - u.x;
        }
      } else {
        const enemies = state.units.filter(e => e.team === 'PLAYER');
        if (enemies.length > 0) {
          enemies.sort((a,b) => b.x - a.x);
          target = enemies[0];
          dist = u.x - target.x;
        } else {
          target = state.playerHero;
          dist = u.x;
        }
      }

      if (dist <= u.stats.range) {
        u.state = 'ATTACK';
        u.lastAttackTime += dt;
        if (u.lastAttackTime >= (1 / u.stats.attackSpeed)) {
          u.lastAttackTime = 0;
          if ('hp' in target) {
            target.hp -= u.stats.attack;
          } else {
            (target as Unit).currentHp -= u.stats.attack;
            if ((target as Unit).currentHp <= 0) deadIds.add((target as Unit).id);
          }
        }
      } else {
        u.state = 'WALK';
        const move = u.stats.speed * dt;
        u.x += (u.team === 'PLAYER' ? move : -move);
      }
    });

    state.units = state.units.filter(u => !deadIds.has(u.id));
    setUnits([...state.units]);
    setPlayerHero({ ...state.playerHero });
    setEnemyHero({ ...state.enemyHero });

    if (state.enemyHero.hp <= 0) endBattle(true);
    else if (state.playerHero.hp <= 0) endBattle(false);
    else animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const endBattle = async (victory: boolean) => {
    gameStateRef.current.isPlaying = false;
    cancelAnimationFrame(animationFrameRef.current);
    if (victory) {
      setWins(w => w + 1);
      setGold(g => g + 10 + round * 2);
      const msg = await generateAICommentary("Player");
      setCommentary(msg);
      setPhase(GamePhase.VICTORY);
    } else {
      setLives(l => l - 1);
      if (lives - 1 <= 0) setPhase(GamePhase.GAME_OVER);
      else setPhase(GamePhase.DEFEAT);
    }
  };

  const handleBuy = (item: Item) => {
    if (gold < item.cost) return;
    const pi: PlacedItem = { id: Math.random().toString(), item, x: 0, y: 0, rotation: 0 };
    let placed = false;
    for(let y=0; y<=BACKPACK_ROWS-item.height; y++) {
      for(let x=0; x<=BACKPACK_COLS-item.width; x++) {
        if (!checkCollision(placedItems, null, x, y, item.width, item.height)) {
          pi.x = x; pi.y = y;
          setPlacedItems(p => calculateBonuses([...p, pi]));
          placed = true; break;
        }
      }
      if(placed) break;
    }
    if (placed) setGold(g => g - item.cost);
    else { setStorageItems(s => [...s, pi]); setGold(g => g - item.cost); }
  };

  const handleGridClick = (x: number, y: number) => {
    if (!selectedItemId) return;
    const pi = placedItems.find(i => i.id === selectedItemId);
    if (!pi) return;
    const isRot = pi.rotation === 90 || pi.rotation === 270;
    const w = isRot ? pi.item.height : pi.item.width;
    const h = isRot ? pi.item.width : pi.item.height;
    if (!checkCollision(placedItems, selectedItemId, x, y, w, h)) {
      setPlacedItems(prev => calculateBonuses(prev.map(i => i.id === selectedItemId ? { ...i, x, y } : i)));
      setSelectedItemId(null);
    }
  };

  const handleRotate = (id: string) => {
    const pi = placedItems.find(i => i.id === id);
    if (!pi) return;
    const nextRot = (pi.rotation + 90) % 360 as 0 | 90 | 180 | 270;
    const isRot = nextRot === 90 || nextRot === 270;
    const w = isRot ? pi.item.height : pi.item.width;
    const h = isRot ? pi.item.width : pi.item.height;
    let nx = pi.x; let ny = pi.y;
    if (nx + w > BACKPACK_COLS) nx = BACKPACK_COLS - w;
    if (ny + h > BACKPACK_ROWS) ny = BACKPACK_ROWS - h;
    if (!checkCollision(placedItems, id, nx, ny, w, h)) {
      setPlacedItems(prev => calculateBonuses(prev.map(i => i.id === id ? { ...i, rotation: nextRot, x: nx, y: ny } : i)));
    }
  };

  // --- SUB-COMPONENTS ---
  const BackpackGrid = ({ items, onCellClick, readOnly = false }: any) => {
    const cells = [];
    for(let y=0; y<BACKPACK_ROWS; y++) {
      for(let x=0; x<BACKPACK_COLS; x++) {
        cells.push(<div key={`${x}-${y}`} onClick={() => !readOnly && onCellClick(x, y)} className="w-10 h-10 border border-slate-700 bg-slate-900/40 hover:bg-slate-800 transition-colors rounded-sm" />);
      }
    }
    return (
      <div className="relative bg-slate-800 p-2 rounded-xl border-4 border-slate-700 shadow-2xl" style={{ width: BACKPACK_COLS * 40 + 24, height: BACKPACK_ROWS * 40 + 24 }}>
        <div className="grid grid-cols-5 gap-0">{cells}</div>
        {items.map((pi: PlacedItem) => {
          const isRot = pi.rotation === 90 || pi.rotation === 270;
          const w = isRot ? pi.item.height : pi.item.width;
          const h = isRot ? pi.item.width : pi.item.height;
          return (
            <div 
              key={pi.id} 
              onClick={(e) => { e.stopPropagation(); !readOnly && setSelectedItemId(pi.id === selectedItemId ? null : pi.id); }}
              className={`absolute flex items-center justify-center transition-all border rounded-lg cursor-pointer ${selectedItemId === pi.id ? 'ring-2 ring-accent z-20 bg-slate-600 shadow-accent/50' : 'bg-slate-700 border-slate-600 shadow-md'}`}
              style={{ left: pi.x * 40 + 12, top: pi.y * 40 + 12, width: w * 40, height: h * 40 }}
            >
              <span className="text-2xl" style={{ transform: `rotate(${pi.rotation}deg)` }}>{pi.item.emoji}</span>
              {!readOnly && selectedItemId === pi.id && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 z-30">
                  <button onClick={(e) => { e.stopPropagation(); handleRotate(pi.id); }} className="p-1 hover:text-accent"><RotateCw size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setPlacedItems(p => calculateBonuses(p.filter(x => x.id !== pi.id))); setGold(g => g + Math.floor(pi.item.cost/2)); }} className="p-1 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // --- VIEWS ---
  if (phase === GamePhase.MENU) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 gap-10">
        <div className="text-center">
          <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary via-secondary to-accent mb-4">TOY RUMBLE</h1>
          <p className="text-slate-400 text-xl font-medium tracking-widest uppercase">The Backpack Management Auto-Battler</p>
        </div>
        <button onClick={() => setPhase(GamePhase.SHOP)} className="group relative px-12 py-6 bg-primary rounded-3xl text-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(99,102,241,0.5)]">
          <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="flex items-center gap-4"><Play fill="currentColor" /> ENTER PLAYROOM</span>
        </button>
      </div>
    );
  }

  if (phase === GamePhase.SHOP) {
    return (
      <div className="h-full w-full p-6 flex flex-col gap-6 bg-slate-950">
        <div className="flex justify-between items-center bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex gap-8 items-center">
            <div className="px-6 py-2 bg-slate-800 rounded-2xl flex items-center gap-3 border border-yellow-600/30">
              <Coins className="text-yellow-400" /> <span className="text-2xl font-black text-yellow-400">{gold}</span>
            </div>
            <div className="text-slate-500 font-bold tracking-widest uppercase">Round {round}</div>
            <div className="flex gap-1">{Array.from({length: MAX_LIVES}).map((_, i) => <Heart key={i} size={20} className={i < lives ? "text-red-500 fill-red-500" : "text-slate-800"} />)}</div>
          </div>
          <button onClick={startBattle} className="bg-gradient-to-r from-green-600 to-emerald-600 px-10 py-3 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-green-900/40">
            <Swords /> READY TO RUMBLE
          </button>
        </div>

        <div className="flex-1 flex gap-8 overflow-hidden">
          <div className="w-96 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <h2 className="text-xl font-black flex items-center gap-2 mb-2 text-slate-300 uppercase tracking-tighter"><ShoppingCart /> Toy Shop</h2>
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 gap-3">
              {SHOP_ITEMS.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => handleBuy(item)} 
                  disabled={gold < item.cost}
                  className="group relative flex items-center justify-between p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:border-primary disabled:opacity-40 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{item.emoji}</div>
                    <div>
                      <div className="font-bold text-slate-100">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">{item.rarity} • {item.type}</div>
                    </div>
                  </div>
                  <div className="text-xl font-black text-yellow-500">{item.cost}G</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-slate-900/80 p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-6 relative shadow-inner">
            <h2 className="absolute top-6 left-8 text-xl font-black flex items-center gap-2 text-slate-500 uppercase tracking-tighter"><Grip /> Your Backpack</h2>
            <BackpackGrid items={placedItems} onCellClick={handleGridClick} />
            <div className="flex gap-4 items-center mt-4">
               {storageItems.length > 0 && <span className="text-xs font-bold text-slate-600 uppercase">Storage:</span>}
               <div className="flex gap-2">
                 {storageItems.map(si => (
                   <div key={si.id} onClick={() => {
                     let p = false;
                     for(let y=0; y<=BACKPACK_ROWS-si.item.height; y++){
                       for(let x=0; x<=BACKPACK_COLS-si.item.width; x++){
                         if(!checkCollision(placedItems, null, x, y, si.item.width, si.item.height)){
                           setPlacedItems(prev => calculateBonuses([...prev, { ...si, x, y }]));
                           setStorageItems(s => s.filter(x => x.id !== si.id));
                           p = true; break;
                         }
                       }
                       if(p) break;
                     }
                   }} className="w-12 h-12 bg-slate-800 border-2 border-slate-700 rounded-xl flex items-center justify-center text-2xl cursor-pointer hover:border-accent">{si.item.emoji}</div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === GamePhase.BATTLE || phase === GamePhase.BATTLE_PREP) {
    return (
      <div className="h-full w-full bg-slate-950 flex flex-col overflow-hidden">
        <div className="p-4 flex justify-between items-center bg-slate-900 border-b border-slate-800">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-2xl">😎</div>
             <div><div className="text-xs font-black text-slate-500 uppercase">You</div><div className="text-xl font-black text-green-400">{Math.ceil(playerHero.hp)} HP</div></div>
           </div>
           <div className="text-center font-mono text-yellow-500 text-2xl">{battleTime.toFixed(1)}s</div>
           <div className="flex items-center gap-4">
             <div className="text-right">
               <div className="text-xs font-black text-slate-500 uppercase">{opponent?.name}</div>
               <div className="text-xl font-black text-red-400">{Math.ceil(enemyHero.hp)} HP</div>
             </div>
             <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-2xl">{opponent?.avatarEmoji}</div>
           </div>
        </div>
        
        <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] flex flex-col">
          <div className="flex-1 relative overflow-hidden">
             {units.map(u => (
               <div 
                 key={u.id} 
                 className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-100 ${u.team === 'ENEMY' ? '-scale-x-100' : ''}`}
                 style={{ left: `${(u.x / LANE_LENGTH) * 100}%` }}
               >
                 <div className="w-10 h-1 bg-slate-800 rounded-full mb-1 overflow-hidden">
                   <div className={`h-full ${u.team === 'PLAYER' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(u.currentHp/u.stats.maxHp)*100}%` }} />
                 </div>
                 <div className={`text-4xl ${u.state === 'ATTACK' ? 'animate-bounce' : ''}`}>{u.emoji}</div>
               </div>
             ))}
          </div>
          <div className="h-32 bg-slate-900/50 backdrop-blur-xl border-t border-slate-800 p-4 flex gap-8 justify-center items-center">
             <div className="scale-75"><BackpackGrid items={gameStateRef.current.playerItems} readOnly={true} /></div>
             <div className="flex flex-col gap-1 text-slate-500 italic text-sm"><BrainCircuit className="animate-pulse mx-auto" size={24} /> <span>Simulation Running...</span></div>
             <div className="scale-75"><BackpackGrid items={gameStateRef.current.enemyItems} readOnly={true} /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100] animate-in fade-in duration-500">
      <div className="text-9xl mb-8 animate-bounce">{phase === GamePhase.VICTORY ? "🏆" : "💀"}</div>
      <h2 className={`text-7xl font-black mb-4 ${phase === GamePhase.VICTORY ? "text-yellow-400" : "text-red-500"}`}>{phase === GamePhase.VICTORY ? "VICTORY" : "DEFEAT"}</h2>
      <p className="text-xl text-slate-400 italic mb-12 max-w-lg text-center px-6">"{commentary || "Better luck next time in the toy room."}"</p>
      <button 
        onClick={() => { if(phase === GamePhase.GAME_OVER) { window.location.reload(); } else { setRound(r => r + 1); setPhase(GamePhase.SHOP); } }}
        className="px-16 py-6 bg-white text-black text-2xl font-black rounded-3xl hover:scale-110 active:scale-95 transition-all shadow-2xl"
      >
        {phase === GamePhase.GAME_OVER ? "RESTART CAMPAIGN" : "CONTINUE JOURNEY"}
      </button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
