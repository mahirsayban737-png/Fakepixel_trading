export interface MarketItem {
  id: string;
  name: string;
  value: number;
  demand: number; // 1-10 scale
  trend: 'rising' | 'falling' | 'stable';
  imageUrl?: string;
  category?: string;
  lastUpdated: number;
}

export interface MarketContextType {
  items: MarketItem[];
  loading: boolean;
  error: string | null;
  getItemById: (id: string) => MarketItem | undefined;
  getItemByName: (name: string) => MarketItem | undefined;
}

export interface AdminCredentials {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}
