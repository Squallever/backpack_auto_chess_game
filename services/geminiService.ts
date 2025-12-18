import { GoogleGenAI } from "@google/genai";
import { Opponent, PlacedItem, ItemType, Item } from "../types";
import { SHOP_ITEMS, BACKPACK_COLS, BACKPACK_ROWS, STARTING_GOLD } from "../constants";

const getApiKey = () => process.env.API_KEY || '';
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * 使用 gemini-2.5-flash-image 生成“无背景”风格的物品图片
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");
  
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A high-quality 3D toy game asset of ${prompt}. THE ITEM MUST BE COMPLETELY ISOLATED ON A PURE, SOLID, FLAT WHITE BACKGROUND (#FFFFFF). Cinematic lighting, smooth textures, vibrant colors, 4k resolution, clean sharp edges. No ground shadows, no extra objects, no text. Professional game icon style.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

/**
 * 编辑现有图片
 */
export const editImage = async (base64Data: string, prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");

  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/png',
          },
        },
        {
          text: `Modify this toy image: ${prompt}. MAINTAIN THE PURE SOLID WHITE BACKGROUND. Do not add environment or floor. Keep it as an isolated game asset icon.`,
        },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to edit image");
};

const canPlace = (
  items: PlacedItem[], 
  newItem: Item, 
  x: number, 
  y: number, 
  width: number, 
  height: number
): boolean => {
  if (x + width > BACKPACK_COLS || y + height > BACKPACK_ROWS) return false;
  
  for (const placed of items) {
    const pRotated = placed.rotation === 90 || placed.rotation === 270;
    const pW = pRotated ? placed.item.height : placed.item.width;
    const pH = pRotated ? placed.item.width : placed.item.height;
    
    if (x < placed.x + pW && x + width > placed.x &&
        y < placed.y + pH && y + height > placed.y) {
      return false;
    }
  }
  return true;
};

export const generateOpponent = async (round: number, playerWinCount: number): Promise<Opponent> => {
  let availableGold = STARTING_GOLD + ((round - 1) * 8);
  availableGold += Math.floor(Math.random() * 8) - 2;

  const placedItems: PlacedItem[] = [];
  let attempts = 0;
  let hasSummoner = false;

  while (availableGold >= 3 && attempts < 200) {
    attempts++;
    let affordable = SHOP_ITEMS.filter(i => i.cost <= availableGold);
    if (affordable.length === 0) break;

    if (!hasSummoner) {
       const summoners = affordable.filter(i => i.type === ItemType.SUMMONER);
       if (summoners.length > 0) affordable = summoners;
    }

    const choice = getRandomItem(affordable);
    let placed = false;
    for (let t = 0; t < 20; t++) {
        const rot = Math.random() > 0.5 ? 90 : 0;
        const w = rot === 90 ? choice.height : choice.width;
        const h = rot === 90 ? choice.width : choice.height;
        const x = Math.floor(Math.random() * (BACKPACK_COLS - w + 1));
        const y = Math.floor(Math.random() * (BACKPACK_ROWS - h + 1));

        if (canPlace(placedItems, choice, x, y, w, h)) {
            placedItems.push({
                id: `enemy_item_${placedItems.length}`,
                item: choice,
                x, y, 
                rotation: rot as 0 | 90,
            });
            availableGold -= choice.cost;
            if (choice.type === ItemType.SUMMONER) hasSummoner = true;
            placed = true;
            break;
        }
    }
  }

  const names = ["Toy Master", "Kid Commander", "Block Builder", "Action Figure Fan", "Puzzle Pro", "Collector Carl", "Robot Ruler"];
  const emojis = ["😈", "🤖", "🤡", "👽", "🤠", "👻"];
  
  return {
    name: getRandomItem(names),
    description: `Level ${round} Player`,
    avatarEmoji: getRandomItem(emojis),
    items: placedItems
  };
};

export const generateBattleCommentary = async (winnerName: string, durationSeconds: number): Promise<string> => {
  const apiKey = getApiKey();
  const fallbacks = ["What a match!", "Toys are flying everywhere!", "A close victory!", "Total domination!", "The playroom is safe!"];

  if (!apiKey) return getRandomItem(fallbacks);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a very short, funny, 1-sentence commentary about a toy battle victory by ${winnerName} in ${durationSeconds.toFixed(1)} seconds.`,
    });
    return response.text || getRandomItem(fallbacks);
  } catch (e) {
    return getRandomItem(fallbacks);
  }
};