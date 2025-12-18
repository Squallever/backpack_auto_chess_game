export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary'
}

export enum ItemType {
  SUMMONER = 'Summoner',
  BOOSTER = 'Booster',
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
  speed: number;
  range: number;
  attackSpeed: number;
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  type: ItemType;
  rarity: Rarity;
  cost: number;
  width: number;
  height: number;
  cooldown?: number;
  unitStats?: UnitStats;
  effectDescription: string;
  boostType?: 'SPEED' | 'ATTACK' | 'HEALTH';
  boostValue?: number;
}

export interface PlacedItem {
  id: string;
  item: Item;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  currentCooldown?: number;
  bonusAttack?: number;
  bonusHp?: number;
  bonusCooldownMultiplier?: number;
}

export interface Unit {
  id: string;
  sourceItemId: string;
  emoji: string;
  team: 'PLAYER' | 'ENEMY';
  x: number;
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
  items: PlacedItem[];
}