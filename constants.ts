
import { Crop, CropId } from './types';

export const CROPS: Record<CropId, Crop> = {
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    icon: '🌾',
    cost: 5,
    growthTime: 5,
    color: 'bg-yellow-100',
    orderValue: 15
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    icon: '🍅',
    cost: 15,
    growthTime: 12,
    color: 'bg-red-100',
    orderValue: 45
  },
  corn: {
    id: 'corn',
    name: 'Corn',
    icon: '🌽',
    cost: 40,
    growthTime: 25,
    color: 'bg-yellow-300',
    orderValue: 125
  }
};

export const INITIAL_MONEY = 50;
export const WIN_GOAL = 2000;
export const GRID_SIZE = 16; // 4x4
export const MAX_ORDERS = 4;
export const TICK_RATE = 1000; // 1 second
