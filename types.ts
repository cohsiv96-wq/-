
export interface Dish {
  id: string;
  name: string;
  ingredients: string[];
  tasteTags: string[];
  customTags: string[];
  image?: string; // base64 string or URL
  notes?: string;
  createTime: number;
}

export interface WeekendMenu {
  id: string;
  date: string; // ISO string for the weekend
  dishIds: string[];
  status: 'planned' | 'completed';
}

export interface AppState {
  dishes: Dish[];
  currentMenu: WeekendMenu | null;
  history: WeekendMenu[];
  coupleName: string;
}
