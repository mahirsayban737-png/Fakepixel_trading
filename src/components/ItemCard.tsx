import { TrendingUp, TrendingDown, Minus, Zap, Package } from 'lucide-react';
import type { MarketItem } from '@/types/market';
import { cn } from '@/utils/cn';

interface ItemCardProps {
  item: MarketItem;
  onClick?: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const getTrendIcon = () => {
    switch (item.trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendColor = () => {
    switch (item.trend) {
      case 'rising':
        return 'text-emerald-400';
      case 'falling':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getDemandColor = () => {
    if (item.demand >= 8) return 'bg-emerald-500';
    if (item.demand >= 5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer",
        "bg-slate-900/60 backdrop-blur-xl",
        "border border-slate-700/50 rounded-2xl",
        "p-4 transition-all duration-300 ease-out",
        "hover:border-purple-500/50 hover:bg-slate-800/60",
        "hover:shadow-[0_0_30px_rgba(147,51,234,0.15)]",
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
    >
      {/* Live Badge */}
      <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30">
        <Zap className="w-3 h-3 text-white animate-pulse" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-start gap-4">
        {/* Item Image */}
        <div className="relative flex-shrink-0 w-16 h-16 rounded-xl bg-slate-800/80 border border-slate-700/50 overflow-hidden flex items-center justify-center">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-12 h-12 object-contain image-rendering-pixelated"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <Package className="w-8 h-8 text-slate-500" />
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate text-sm">{item.name}</h3>
            {getTrendIcon()}
          </div>
          
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              {formatValue(item.value)}
            </span>
            <span className="text-xs text-slate-400 font-medium">coins</span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            {/* Demand Bar */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Demand</span>
                <span className="text-[10px] font-bold text-slate-400">{item.demand}/10</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", getDemandColor())}
                  style={{ width: `${item.demand * 10}%` }}
                />
              </div>
            </div>

            {/* Trend Label */}
            <div className={cn("text-[10px] font-bold uppercase tracking-wider", getTrendColor())}>
              {item.trend}
            </div>
          </div>
        </div>
      </div>

      {/* Category Badge */}
      {item.category && (
        <div className="absolute bottom-3 right-3">
          <span className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-400 bg-slate-800/80 rounded-md border border-slate-700/50">
            {item.category}
          </span>
        </div>
      )}
    </div>
  );
}
