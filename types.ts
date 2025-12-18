export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary'
}

export enum ItemType {
  SUMMONER = 'Summoner', // Spawns units
  BOOSTER = 'Booster',   // Buffs adjacent items
}

export enum GamePhase {
  MENU = 'MENU',
  SHOP = 'SHOP',
  BATTLE_PREP = 'BATTLE_PREP',
  BATTLE = 'BATTLE',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
  GAME_OVER = 'GAME_OVER'
}

export interface UnitStats {
  hp: number;
  maxHp: number;
  attack: number;
  speed: number; // movement speed
  range: number; // attack range
  attackSpeed: number; // attacks per second
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string; // AI generated image
  type: ItemType;
  rarity: Rarity;
  cost: number;
  width: number; // Grid width (e.g., 1)
  height: number; // Grid height (e.g., 2)
  // Summoner stats
  cooldown?: number; // Seconds to spawn
  unitStats?: UnitStats; // Stats of the summoned unit
  // Booster stats
  effectDescription: string;
  boostType?: 'SPEED' | 'ATTACK' | 'HEALTH';
  boostValue?: number;
}

export interface PlacedItem {
  id: string; // Unique instance ID
  item: Item;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270; // Degrees
  // Runtime stats
  currentCooldown?: number;
  bonusAttack?: number;
  bonusHp?: number;
  bonusCooldownMultiplier?: number;
}

export interface Unit {
  id: string; // Unique instance ID
  sourceItemId: string; // To know what emoji/type to render
  emoji: string;
  imageUrl?: string;
  team: 'PLAYER' | 'ENEMY';
  x: number; // Position 0-100%
  stats: UnitStats;
  currentHp: number;
  lastAttackTime: number;
  state: 'WALK' | 'ATTACK' | 'IDLE';
}

export interface Hero {
  hp: number;
  maxHp: number;
}

export interface Opponent {
  name: string;
  description: string;
  avatarEmoji: string;
  items: PlacedItem[]; // The enemy's backpack setup
}