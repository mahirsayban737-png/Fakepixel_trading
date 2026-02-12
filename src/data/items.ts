export interface Item {
  id: number;
  name: string;
  icon: string;
  value: number;
  demand: number;
  trend: 'rising' | 'falling' | 'stable';
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

export const items: Item[] = [
  {
    id: 1,
    name: "Hyperion",
    icon: "⚔️",
    value: 850000000,
    demand: 10,
    trend: "rising",
    category: "Weapons",
    rarity: "mythic"
  },
  {
    id: 2,
    name: "Terminator",
    icon: "🏹",
    value: 720000000,
    demand: 9,
    trend: "stable",
    category: "Weapons",
    rarity: "mythic"
  },
  {
    id: 3,
    name: "Judgement Core",
    icon: "💎",
    value: 180000000,
    demand: 8,
    trend: "rising",
    category: "Materials",
    rarity: "legendary"
  },
  {
    id: 4,
    name: "Warden Heart",
    icon: "💜",
    value: 950000000,
    demand: 10,
    trend: "rising",
    category: "Materials",
    rarity: "mythic"
  },
  {
    id: 5,
    name: "Necron's Handle",
    icon: "🔮",
    value: 550000000,
    demand: 9,
    trend: "stable",
    category: "Materials",
    rarity: "legendary"
  },
  {
    id: 6,
    name: "Alloy",
    icon: "🧱",
    value: 25000000,
    demand: 7,
    trend: "falling",
    category: "Materials",
    rarity: "rare"
  },
  {
    id: 7,
    name: "Giant's Sword",
    icon: "🗡️",
    value: 320000000,
    demand: 8,
    trend: "stable",
    category: "Weapons",
    rarity: "legendary"
  },
  {
    id: 8,
    name: "Shadow Fury",
    icon: "⚡",
    value: 85000000,
    demand: 6,
    trend: "falling",
    category: "Weapons",
    rarity: "epic"
  },
  {
    id: 9,
    name: "Divan's Alloy",
    icon: "✨",
    value: 45000000,
    demand: 8,
    trend: "rising",
    category: "Materials",
    rarity: "epic"
  },
  {
    id: 10,
    name: "Gemstone Mixture",
    icon: "💠",
    value: 12000000,
    demand: 5,
    trend: "stable",
    category: "Materials",
    rarity: "rare"
  },
  {
    id: 11,
    name: "Maxor's Boots",
    icon: "👢",
    value: 280000000,
    demand: 7,
    trend: "stable",
    category: "Armor",
    rarity: "legendary"
  },
  {
    id: 12,
    name: "Storm's Helmet",
    icon: "⛑️",
    value: 220000000,
    demand: 7,
    trend: "falling",
    category: "Armor",
    rarity: "legendary"
  },
  {
    id: 13,
    name: "Goldor's Chestplate",
    icon: "🛡️",
    value: 350000000,
    demand: 8,
    trend: "rising",
    category: "Armor",
    rarity: "legendary"
  },
  {
    id: 14,
    name: "Necron's Leggings",
    icon: "👖",
    value: 290000000,
    demand: 8,
    trend: "stable",
    category: "Armor",
    rarity: "legendary"
  },
  {
    id: 15,
    name: "Spirit Sceptre",
    icon: "🪄",
    value: 15000000,
    demand: 4,
    trend: "falling",
    category: "Weapons",
    rarity: "epic"
  },
  {
    id: 16,
    name: "Kuudra Core",
    icon: "🔥",
    value: 480000000,
    demand: 9,
    trend: "rising",
    category: "Materials",
    rarity: "mythic"
  },
  {
    id: 17,
    name: "Recombobulator 3000",
    icon: "🔧",
    value: 8500000,
    demand: 6,
    trend: "stable",
    category: "Accessories",
    rarity: "rare"
  },
  {
    id: 18,
    name: "Precursor Eye",
    icon: "👁️",
    value: 42000000,
    demand: 5,
    trend: "falling",
    category: "Materials",
    rarity: "epic"
  },
  {
    id: 19,
    name: "Juju Shortbow",
    icon: "🎯",
    value: 28000000,
    demand: 7,
    trend: "stable",
    category: "Weapons",
    rarity: "epic"
  },
  {
    id: 20,
    name: "Aspect of the Dragons",
    icon: "🐉",
    value: 9500000,
    demand: 5,
    trend: "falling",
    category: "Weapons",
    rarity: "epic"
  }
];

export const formatValue = (value: number): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const getRarityColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    common: '#94a3b8',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
    mythic: '#ec4899'
  };
  return colors[rarity] || colors.common;
};

export interface Trade {
  id: number;
  user: string;
  have: { item: Item; quantity: number }[];
  want: { item: Item; quantity: number }[];
  timestamp: Date;
  status: 'open' | 'closed';
}

export const mockTrades: Trade[] = [
  {
    id: 1,
    user: "DragonSlayer99",
    have: [{ item: items[0], quantity: 1 }],
    want: [{ item: items[3], quantity: 1 }],
    timestamp: new Date(Date.now() - 300000),
    status: 'open'
  },
  {
    id: 2,
    user: "SkyblockPro",
    have: [{ item: items[5], quantity: 5 }],
    want: [{ item: items[8], quantity: 2 }],
    timestamp: new Date(Date.now() - 600000),
    status: 'open'
  },
  {
    id: 3,
    user: "MiningKing",
    have: [{ item: items[2], quantity: 2 }],
    want: [{ item: items[6], quantity: 1 }],
    timestamp: new Date(Date.now() - 900000),
    status: 'open'
  },
  {
    id: 4,
    user: "EnderHunter",
    have: [{ item: items[10], quantity: 1 }, { item: items[11], quantity: 1 }],
    want: [{ item: items[4], quantity: 1 }],
    timestamp: new Date(Date.now() - 1200000),
    status: 'open'
  },
  {
    id: 5,
    user: "CraftMaster",
    have: [{ item: items[16], quantity: 10 }],
    want: [{ item: items[7], quantity: 1 }],
    timestamp: new Date(Date.now() - 1500000),
    status: 'open'
  },
  {
    id: 6,
    user: "BlazeRunner",
    have: [{ item: items[15], quantity: 1 }],
    want: [{ item: items[1], quantity: 1 }],
    timestamp: new Date(Date.now() - 1800000),
    status: 'open'
  }
];
