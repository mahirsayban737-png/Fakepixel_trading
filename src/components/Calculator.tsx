import { useState, useMemo } from 'react';
import { Calculator as CalcIcon, ArrowRightLeft, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { cn } from '@/utils/cn';

export function Calculator() {
  const { items, loading } = useMarket();
  const [fromItem, setFromItem] = useState('');
  const [toItem, setToItem] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [mode, setMode] = useState<'trade' | 'value'>('trade');

  const fromItemData = useMemo(() => {
    return items.find(item => item.id === fromItem);
  }, [items, fromItem]);

  const toItemData = useMemo(() => {
    return items.find(item => item.id === toItem);
  }, [items, toItem]);

  const calculation = useMemo((): { type: 'value'; totalValue: number; unitValue: number } | { type: 'trade'; fromTotal: number; toQuantity: number; toRemainder: number; exchangeRate: number } | null => {
    if (mode === 'value') {
      if (!fromItemData) return null;
      return {
        type: 'value',
        totalValue: fromItemData.value * quantity,
        unitValue: fromItemData.value,
      };
    }

    if (!fromItemData || !toItemData) return null;
    
    const totalFromValue = fromItemData.value * quantity;
    const exchangeRate = totalFromValue / toItemData.value;
    
    return {
      type: 'trade',
      fromTotal: totalFromValue,
      toQuantity: Math.floor(exchangeRate),
      toRemainder: totalFromValue % toItemData.value,
      exchangeRate: fromItemData.value / toItemData.value,
    };
  }, [fromItemData, toItemData, quantity, mode]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toLocaleString();
  };

  const swapItems = () => {
    const temp = fromItem;
    setFromItem(toItem);
    setToItem(temp);
  };

  if (loading) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
          <span className="text-slate-400">Loading calculator...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-slate-900/60 backdrop-blur-xl",
      "border border-slate-700/50 rounded-3xl",
      "p-6 shadow-2xl",
      "hover:border-purple-500/30 transition-all duration-500"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30">
          <CalcIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Trade Calculator</h2>
          <p className="text-xs text-slate-400">Real-time value calculations</p>
        </div>
        <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-slate-800/60 rounded-xl p-1 mb-6">
        <button
          onClick={() => setMode('trade')}
          className={cn(
            "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300",
            mode === 'trade'
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
              : "text-slate-400 hover:text-white"
          )}
        >
          Trade Mode
        </button>
        <button
          onClick={() => setMode('value')}
          className={cn(
            "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300",
            mode === 'value'
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
              : "text-slate-400 hover:text-white"
          )}
        >
          Value Mode
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <AlertCircle className="w-12 h-12 text-amber-500/50" />
          <p className="text-slate-400 text-center text-sm">
            No items in market database.<br />
            <span className="text-xs text-slate-500">Add items via Admin Panel to use calculator.</span>
          </p>
        </div>
      ) : (
        <>
          {/* From Item Selection */}
          <div className="space-y-3 mb-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {mode === 'trade' ? 'From Item' : 'Select Item'}
            </label>
            <select
              value={fromItem}
              onChange={(e) => setFromItem(e.target.value)}
              className={cn(
                "w-full bg-slate-800/80 border border-slate-700/50",
                "text-white rounded-xl px-4 py-3.5",
                "focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20",
                "transition-all duration-200",
                "appearance-none cursor-pointer"
              )}
            >
              <option value="">Select an item...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {formatValue(item.value)} coins
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Input */}
          <div className="space-y-3 mb-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className={cn(
                "w-full bg-slate-800/80 border border-slate-700/50",
                "text-white rounded-xl px-4 py-3.5",
                "focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20",
                "transition-all duration-200"
              )}
            />
          </div>

          {mode === 'trade' && (
            <>
              {/* Swap Button */}
              <div className="flex justify-center my-4">
                <button
                  onClick={swapItems}
                  disabled={!fromItem || !toItem}
                  className={cn(
                    "p-3 rounded-full bg-slate-800/80 border border-slate-700/50",
                    "text-slate-400 hover:text-white hover:border-purple-500/50",
                    "transition-all duration-300 hover:rotate-180",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:rotate-0"
                  )}
                >
                  <ArrowRightLeft className="w-5 h-5" />
                </button>
              </div>

              {/* To Item Selection */}
              <div className="space-y-3 mb-6">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  To Item
                </label>
                <select
                  value={toItem}
                  onChange={(e) => setToItem(e.target.value)}
                  className={cn(
                    "w-full bg-slate-800/80 border border-slate-700/50",
                    "text-white rounded-xl px-4 py-3.5",
                    "focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20",
                    "transition-all duration-200",
                    "appearance-none cursor-pointer"
                  )}
                >
                  <option value="">Select an item...</option>
                  {items.filter(item => item.id !== fromItem).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {formatValue(item.value)} coins
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Results */}
          {calculation && (
            <div className={cn(
              "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
              "border border-purple-500/30 rounded-2xl p-5",
              "shadow-[0_0_30px_rgba(147,51,234,0.1)]"
            )}>
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-4">
                Calculation Result
              </div>

              {calculation.type === 'value' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Unit Value</span>
                    <span className="text-white font-semibold">{formatValue(calculation.unitValue)} coins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Quantity</span>
                    <span className="text-white font-semibold">×{quantity.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-slate-700/50 my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Total Value</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                      {formatValue(calculation.totalValue)}
                    </span>
                  </div>
                </div>
              )}

              {calculation.type === 'trade' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Your Value</span>
                    <span className="text-white font-semibold">{formatValue(calculation.fromTotal)} coins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Exchange Rate</span>
                    <span className="text-white font-semibold">1:{calculation.exchangeRate.toFixed(4)}</span>
                  </div>
                  <div className="h-px bg-slate-700/50 my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">You Can Get</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                        {calculation.toQuantity.toLocaleString()}×
                      </div>
                      <div className="text-xs text-slate-400">{toItemData?.name}</div>
                    </div>
                  </div>
                  {calculation.toRemainder > 0 && (
                    <div className="text-xs text-amber-400 text-center mt-2 bg-amber-500/10 rounded-lg py-2 px-3">
                      Remainder: {formatValue(calculation.toRemainder)} coins
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!calculation && fromItem && (mode === 'value' || toItem) && (
            <div className="text-center py-4 text-slate-500 text-sm">
              Select items to calculate...
            </div>
          )}
        </>
      )}
    </div>
  );
}
