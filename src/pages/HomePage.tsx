import { useState, useMemo } from 'react';
import { TradeCard } from '@/components/TradeCard';
import { PostTradeModal } from '@/components/PostTradeModal';
import { mockTrades } from '@/data/items';

export function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'weapons' | 'armor' | 'materials'>('all');

  const filteredTrades = useMemo(() => {
    return mockTrades.filter((trade) => {
      const matchesSearch =
        searchQuery === '' ||
        trade.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.have.some((h) => h.item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        trade.want.some((w) => w.item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        filterType === 'all' ||
        trade.have.some((h) => h.item.category.toLowerCase() === filterType) ||
        trade.want.some((w) => w.item.category.toLowerCase() === filterType);

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterType]);

  return (
    <div className="px-4 py-6">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 bg-gradient-to-r from-dark-accent via-cyan-400 to-dark-accent bg-clip-text text-3xl font-bold text-transparent">
          Fakepixel Trading Hub
        </h1>
        <p className="text-sm text-dark-muted">
          Trade items safely with the community
        </p>
      </div>

      {/* Post Trade Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-press mb-6 w-full rounded-xl bg-gradient-to-r from-dark-accent to-cyan-500 px-6 py-4 font-bold text-white shadow-lg shadow-dark-accent/30 transition-all hover:shadow-xl hover:shadow-dark-accent/40"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-xl">+</span>
          <span>Post a Trade</span>
        </span>
      </button>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trades, items, or users..."
            className="w-full rounded-xl border border-dark-border bg-dark-card px-4 py-3 pl-10 text-sm text-dark-text placeholder-dark-muted focus:border-dark-accent focus:outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted">🔍</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'weapons', 'armor', 'materials'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`btn-press whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                filterType === type
                  ? 'bg-dark-accent text-white'
                  : 'bg-dark-card text-dark-muted hover:text-dark-text'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Trade Feed */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-dark-text">Trade Feed</h2>
        <span className="text-xs text-dark-muted">{filteredTrades.length} trades</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filteredTrades.map((trade) => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
      </div>

      {filteredTrades.length === 0 && (
        <div className="py-12 text-center">
          <span className="mb-2 block text-4xl">🔍</span>
          <p className="text-dark-muted">No trades found</p>
        </div>
      )}

      {/* Post Trade Modal */}
      <PostTradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
