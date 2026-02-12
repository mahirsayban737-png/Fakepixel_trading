import { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, Package, RefreshCw, AlertTriangle, Zap } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { ItemCard } from '@/components/ItemCard';
import { SetupGuide } from '@/components/SetupGuide';
import { cn } from '@/utils/cn';

type SortOption = 'name' | 'value-high' | 'value-low' | 'demand' | 'trend';
type FilterCategory = 'all' | string;

export function MarketFeed() {
  const { items, loading, error } = useMarket();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories from items
  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category || 'General'));
    return ['all', ...Array.from(cats).sort()];
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(item => item.category === filterCategory);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'value-high':
        result.sort((a, b) => b.value - a.value);
        break;
      case 'value-low':
        result.sort((a, b) => a.value - b.value);
        break;
      case 'demand':
        result.sort((a, b) => b.demand - a.demand);
        break;
      case 'trend':
        const trendOrder = { rising: 0, stable: 1, falling: 2 };
        result.sort((a, b) => trendOrder[a.trend] - trendOrder[b.trend]);
        break;
    }

    return result;
  }, [items, searchQuery, sortBy, filterCategory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
          <RefreshCw className="w-12 h-12 text-purple-400 animate-spin relative" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Connecting to Bazaar...</p>
          <p className="text-sm text-slate-400 mt-1">Fetching live market data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Connection Error</p>
          <p className="text-sm text-red-400 mt-1 max-w-xs">{error}</p>
          <p className="text-xs text-slate-500 mt-3">Check Firebase configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className={cn(
                "w-full bg-slate-900/60 backdrop-blur-xl",
                "border border-slate-700/50 text-white",
                "placeholder-slate-500 rounded-xl",
                "pl-12 pr-4 py-3.5",
                "focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20",
                "transition-all duration-200"
              )}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-3.5 rounded-xl border transition-all duration-200",
              showFilters
                ? "bg-purple-500 border-purple-500 text-white"
                : "bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600"
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 space-y-4 animate-in slide-in-from-top duration-200">
            {/* Sort Options */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'name', label: 'Name' },
                  { value: 'value-high', label: 'Price ↓' },
                  { value: 'value-low', label: 'Price ↑' },
                  { value: 'demand', label: 'Demand' },
                  { value: 'trend', label: 'Trend' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as SortOption)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all",
                      sortBy === option.value
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize",
                      filterCategory === cat
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">{filteredItems.length} Items</span>
          </div>
          {filteredItems.filter(i => i.trend === 'rising').length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 rounded-lg border border-amber-500/30">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">
                {filteredItems.filter(i => i.trend === 'rising').length} Rising
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <Package className="w-12 h-12 text-slate-500" />
          </div>
          <div className="text-center">
            {items.length === 0 ? (
              <>
                <p className="text-white font-semibold">Live Price: Market Data Pending</p>
                <p className="text-sm text-slate-400 mt-1">No items listed in the market yet.</p>
                <p className="text-xs text-slate-500 mt-2">Visit #/admin to add items</p>
                <div className="mt-6 w-full max-w-md">
                  <SetupGuide />
                </div>
              </>
            ) : (
              <>
                <p className="text-white font-semibold">Item Not Listed</p>
                <p className="text-sm text-slate-400 mt-1">No items match your search criteria.</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
