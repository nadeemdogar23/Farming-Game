
export type CropId = 'wheat' | 'tomato' | 'corn';

export interface Crop {
  id: CropId;
  name: string;
  icon: string;
  cost: number;
  growthTime: number; // in seconds
  color: string;
  orderValue: number;
}

export enum PlotStatus {
  EMPTY = 'EMPTY',
  GROWING = 'GROWING',
  READY = 'READY'
}

export interface Plot {
  id: number;
  status: PlotStatus;
  cropId: CropId | null;
  startTime: number | null;
  progress: number; // 0 to 100
}

export interface Order {
  id: string;
  cropId: CropId;
  quantity: number;
  reward: number;
  timeLeft: number; // in seconds
  totalTime: number;
}

export interface GameState {
  money: number;
  inventory: Record<CropId, number>;
  plots: Plot[];
  orders: Order[];
  stats: {
    totalEarned: number;
    cropsHarvested: number;
    ordersFulfilled: number;
    ordersFailed: number;
  };
}
