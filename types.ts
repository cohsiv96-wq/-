
export interface Dish {
  id: string;
  name: string;
  ingredients: string[];
  tasteTags: string[];
  customTags: string[];
  image?: string; 
  notes?: string;
  createTime: number;
  updatedAt: number; // 用于云端合并判断
}

export interface WeekendMenu {
  id: string;
  date: string; 
  dishIds: string[];
  status: 'planned' | 'completed';
  updatedAt: number;
}

export interface AppState {
  dishes: Dish[];
  currentMenu: WeekendMenu | null;
  history: WeekendMenu[];
  coupleId?: string; // 你们的配对码
  lastSyncTime?: number;
}
