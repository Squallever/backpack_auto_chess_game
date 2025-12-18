import { Item, ItemType, Rarity } from './types';

export const BACKPACK_COLS = 5;
export const BACKPACK_ROWS = 7;
export const STARTING_GOLD = 12;
export const MAX_LIVES = 5;
export const LANE_LENGTH = 600;
export const HERO_MAX_HP = 50;

export const SHOP_ITEMS: Item[] = [
  // --- SUMMONERS ---
  {
    id: 'toy_soldier',
    name: 'Green Army Man',
    emoji: '🔫',
    type: ItemType.SUMMONER,
    rarity: Rarity.COMMON,
    cost: 3,
    width: 1,
    height: 1,
    cooldown: 2.0,
    effectDescription: 'Spawns a Green Soldier every 2s.',
    unitStats: { hp: 15, maxHp: 15, attack: 5, speed: 40, range: 40, attackSpeed: 1.5 }
  },
  {
    id: 'toy_robot',
    name: 'Beep Boop Bot',
    emoji: '🤖',
    type: ItemType.SUMMONER,
    rarity: Rarity.COMMON,
    cost: 4,
    width: 1,
    height: 1,
    cooldown: 3.5,
    effectDescription: 'Spawns a sturdy Robot every 3.5s.',
    unitStats: { hp: 40, maxHp: 40, attack: 12, speed: 25, range: 20, attackSpeed: 1.0 }
  },
  {
    id: 'toy_duck',
    name: 'Rubber Ducky',
    emoji: '🦆',
    type: ItemType.SUMMONER,
    rarity: Rarity.RARE,
    cost: 6,
    width: 1,
    height: 1,
    cooldown: 1.2,
    effectDescription: 'Spawns a fast Ducky every 1.2s.',
    unitStats: { hp: 8, maxHp: 8, attack: 4, speed: 80, range: 10, attackSpeed: 3.0 }
  },
  {
    id: 'toy_tank',
    name: 'Battle Tank',
    emoji: '🚜',
    type: ItemType.SUMMONER,
    rarity: Rarity.RARE,
    cost: 7,
    width: 2,
    height: 1,
    cooldown: 5.0,
    effectDescription: 'Spawns a Tank every 5s.',
    unitStats: { hp: 120, maxHp: 120, attack: 25, speed: 15, range: 60, attackSpeed: 0.8 }
  },
  {
    id: 'toy_ufo',
    name: 'Alien UFO',
    emoji: '🛸',
    type: ItemType.SUMMONER,
    rarity: Rarity.EPIC,
    cost: 9,
    width: 2,
    height: 2,
    cooldown: 4.5,
    effectDescription: 'Spawns an Alien Invader every 4.5s.',
    unitStats: { hp: 60, maxHp: 60, attack: 35, speed: 35, range: 100, attackSpeed: 1.2 }
  },
  {
    id: 'toy_dino',
    name: 'T-Rex',
    emoji: '🦖',
    type: ItemType.SUMMONER,
    rarity: Rarity.LEGENDARY,
    cost: 12,
    width: 2,
    height: 2,
    cooldown: 8.0,
    effectDescription: 'Spawns a massive T-Rex every 8s.',
    unitStats: { hp: 300, maxHp: 300, attack: 80, speed: 20, range: 30, attackSpeed: 1.0 }
  },
  
  // --- BOOSTERS ---
  {
    id: 'boost_battery',
    name: 'AA Battery',
    emoji: '🔋',
    type: ItemType.BOOSTER,
    rarity: Rarity.COMMON,
    cost: 3,
    width: 1,
    height: 1,
    effectDescription: 'Adjacent toys spawn 20% faster.',
    boostType: 'SPEED',
    boostValue: 0.2
  },
  {
    id: 'boost_drum',
    name: 'War Drum',
    emoji: '🥁',
    type: ItemType.BOOSTER,
    rarity: Rarity.RARE,
    cost: 5,
    width: 1,
    height: 1,
    effectDescription: 'Adjacent toys have +10 Attack.',
    boostType: 'ATTACK',
    boostValue: 10
  },
  {
    id: 'boost_glue',
    name: 'Super Glue',
    emoji: '🧴',
    type: ItemType.BOOSTER,
    rarity: Rarity.RARE,
    cost: 4,
    width: 1,
    height: 1,
    effectDescription: 'Adjacent toys have +50 HP.',
    boostType: 'HEALTH',
    boostValue: 50
  },
  {
    id: 'boost_remote',
    name: 'Remote Control',
    emoji: '🎮',
    type: ItemType.BOOSTER,
    rarity: Rarity.EPIC,
    cost: 8,
    width: 2,
    height: 1,
    effectDescription: 'Adjacent toys spawn 40% faster.',
    boostType: 'SPEED',
    boostValue: 0.4
  },
];