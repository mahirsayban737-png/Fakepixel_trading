import { useState, useMemo } from 'react';
import { items, formatValue, getRarityColor } from '@/data/items';
import { cn } from '@/utils/cn';

type SortKey = 'name' | 'value' | 'demand' | 'trend';
type SortOrder = 'asc' | 'desc';

export function ValuesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const categories = ['all', ...new Set(items.map((item) => item.category))];

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
        case 'demand':
          comparison = a.demand - b.demand;
          break;
        case 'trend':
          const trendOrder = { rising: 2, stable: 1, falling: 0 };
          comparison = trendOrder[a.trend] - trendOrder[b.trend];
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [searchQuery, categoryFilter, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return '📈';
      case 'falling':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'text-dark-success';
      case 'falling':
        return 'text-dark-danger';
      default:
        return 'text-dark-muted';
    }
  };

  const getDemandBar = (demand: number) => {
    const width = demand * 10;
    let color = '#ef4444';
    if (demand >= 7) color = '#22c55e';
    else if (demand >= 4) color = '#fbbf24';
    
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 overflow-hidden rounded-full bg-dark-bg">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${width}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-dark-muted">{demand}/10</span>
      </div>
    );
  };

  const SortButton = ({ sortKeyName, label }: { sortKeyName: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors',
        sortKey === sortKeyName ? 'text-dark-accent' : 'text-dark-muted hover:text-dark-text'
      )}
    >
      {label}
      {sortKey === sortKeyName && (
        <span className="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );

  return (
    <div className="px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-2xl font-bold text-dark-text">Item Values</h1>
        <p className="text-sm text-dark-muted">Current market prices for Fakepixel items</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full rounded-xl border border-dark-border bg-dark-card px-4 py-3 pl-10 text-sm text-dark-text placeholder-dark-muted focus:border-dark-accent focus:outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted">🔍</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={cn(
                'btn-press whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-all',
                categoryFilter === category
                  ? 'bg-dark-accent text-white'
                  : 'bg-dark-card text-dark-muted hover:text-dark-text'
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-dark-muted">
        Showing {filteredAndSortedItems.length} items
      </div>

      {/* Table Header - Desktop */}
      <div className="mb-2 hidden rounded-lg bg-dark-card p-3 md:grid md:grid-cols-12">
        <div className="col-span-5">
          <SortButton sortKeyName="name" label="Item Name" />
        </div>
        <div className="col-span-3 text-right">
          <SortButton sortKeyName="value" label="Value" />
        </div>
        <div className="col-span-2 text-center">
          <SortButton sortKeyName="demand" label="Demand" />
        </div>
        <div className="col-span-2 text-center">
          <SortButton sortKeyName="trend" label="Trend" />
        </div>
      </div>

      {/* Mobile Sort Options */}
      <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
        <span className="text-xs text-dark-muted">Sort:</span>
        {(['name', 'value', 'demand', 'trend'] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={cn(
              'btn-press rounded px-2 py-1 text-xs transition-all',
              sortKey === key ? 'bg-dark-accent text-white' : 'bg-dark-card text-dark-muted'
            )}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {sortKey === key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredAndSortedItems.map((item) => (
          <div
            key={item.id}
            className="card-hover fade-in rounded-xl border border-dark-border bg-dark-card p-4"
          >
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1">
                  <span
                    className="block font-medium"
                    style={{ color: getRarityColor(item.rarity) }}
                  >
                    {item.name}
                  </span>
                  <span className="text-xs text-dark-muted">{item.category}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-dark-bg p-2">
                  <span className="block text-xs text-dark-muted">Value</span>
                  <span className="font-bold text-dark-accent">{formatValue(item.value)}</span>
                </div>
                <div className="rounded-lg bg-dark-bg p-2">
                  <span className="block text-xs text-dark-muted">Demand</span>
                  <div className="flex justify-center">{getDemandBar(item.demand)}</div>
                </div>
                <div className="rounded-lg bg-dark-bg p-2">
                  <span className="block text-xs text-dark-muted">Trend</span>
                  <span className={cn('font-medium capitalize', getTrendColor(item.trend))}>
                    {getTrendIcon(item.trend)} {item.trend}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden items-center md:grid md:grid-cols-12">
              <div className="col-span-5 flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <span
                    className="block font-medium"
                    style={{ color: getRarityColor(item.rarity) }}
                  >
                    {item.name}
                  </span>
                  <span className="text-xs text-dark-muted">{item.category}</span>
                </div>
              </div>
              <div className="col-span-3 text-right">
                <span className="font-bold text-dark-accent">{formatValue(item.value)}</span>
              </div>
              <div className="col-span-2 flex justify-center">
                {getDemandBar(item.demand)}
              </div>
              <div className="col-span-2 text-center">
                <span className={cn('font-medium capitalize', getTrendColor(item.trend))}>
                  {getTrendIcon(item.trend)} {item.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedItems.length === 0 && (
        <div className="py-12 text-center">
          <span className="mb-2 block text-4xl">🔍</span>
          <p className="text-dark-muted">No items found</p>
        </div>
      )}
    </div>
  );
}
