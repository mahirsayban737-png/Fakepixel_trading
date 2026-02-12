import { useState, useMemo } from 'react';
import { items, Item, formatValue, getRarityColor } from '@/data/items';

interface SelectedItem {
  item: Item;
  quantity: number;
}

export function CalculatorPage() {
  const [yourOffer, setYourOffer] = useState<SelectedItem[]>([]);
  const [theirOffer, setTheirOffer] = useState<SelectedItem[]>([]);
  const [searchYour, setSearchYour] = useState('');
  const [searchTheir, setSearchTheir] = useState('');
  const [showResult, setShowResult] = useState(false);

  const filteredYourItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchYour.toLowerCase())
  );

  const filteredTheirItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTheir.toLowerCase())
  );

  const addToYourOffer = (item: Item) => {
    const existing = yourOffer.find((i) => i.item.id === item.id);
    if (existing) {
      setYourOffer(
        yourOffer.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setYourOffer([...yourOffer, { item, quantity: 1 }]);
    }
    setSearchYour('');
    setShowResult(false);
  };

  const addToTheirOffer = (item: Item) => {
    const existing = theirOffer.find((i) => i.item.id === item.id);
    if (existing) {
      setTheirOffer(
        theirOffer.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setTheirOffer([...theirOffer, { item, quantity: 1 }]);
    }
    setSearchTheir('');
    setShowResult(false);
  };

  const removeFromYourOffer = (itemId: number) => {
    setYourOffer(yourOffer.filter((i) => i.item.id !== itemId));
    setShowResult(false);
  };

  const removeFromTheirOffer = (itemId: number) => {
    setTheirOffer(theirOffer.filter((i) => i.item.id !== itemId));
    setShowResult(false);
  };

  const updateYourQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromYourOffer(itemId);
    } else {
      setYourOffer(
        yourOffer.map((i) =>
          i.item.id === itemId ? { ...i, quantity } : i
        )
      );
      setShowResult(false);
    }
  };

  const updateTheirQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromTheirOffer(itemId);
    } else {
      setTheirOffer(
        theirOffer.map((i) =>
          i.item.id === itemId ? { ...i, quantity } : i
        )
      );
      setShowResult(false);
    }
  };

  const yourTotal = useMemo(() => {
    return yourOffer.reduce((sum, entry) => sum + entry.item.value * entry.quantity, 0);
  }, [yourOffer]);

  const theirTotal = useMemo(() => {
    return theirOffer.reduce((sum, entry) => sum + entry.item.value * entry.quantity, 0);
  }, [theirOffer]);

  const calculation = useMemo(() => {
    const difference = theirTotal - yourTotal;
    const percentDiff = yourTotal > 0 ? (difference / yourTotal) * 100 : 0;
    
    let verdict: 'Big Win' | 'Small Win' | 'Fair' | 'Small Loss' | 'Big Loss';
    let color: string;
    let progressValue: number;
    
    if (percentDiff >= 20) {
      verdict = 'Big Win';
      color = '#22c55e';
      progressValue = 100;
    } else if (percentDiff >= 5) {
      verdict = 'Small Win';
      color = '#86efac';
      progressValue = 75;
    } else if (percentDiff >= -5) {
      verdict = 'Fair';
      color = '#fbbf24';
      progressValue = 50;
    } else if (percentDiff >= -20) {
      verdict = 'Small Loss';
      color = '#fca5a5';
      progressValue = 25;
    } else {
      verdict = 'Big Loss';
      color = '#ef4444';
      progressValue = 10;
    }
    
    return { difference, percentDiff, verdict, color, progressValue };
  }, [yourTotal, theirTotal]);

  const handleCalculate = () => {
    setShowResult(true);
  };

  const handleClear = () => {
    setYourOffer([]);
    setTheirOffer([]);
    setShowResult(false);
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-2xl font-bold text-dark-text">Trade Calculator</h1>
        <p className="text-sm text-dark-muted">Calculate if a trade is worth it</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Your Offer */}
        <div className="card-hover rounded-xl border border-dark-border bg-dark-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-dark-accent">Your Offer</h2>
            <span className="rounded-lg bg-dark-accent/20 px-3 py-1 text-sm font-medium text-dark-accent">
              {formatValue(yourTotal)}
            </span>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={searchYour}
              onChange={(e) => setSearchYour(e.target.value)}
              placeholder="Search and add items..."
              className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-dark-text placeholder-dark-muted focus:border-dark-accent focus:outline-none"
            />
            {searchYour && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-dark-border bg-dark-bg shadow-xl">
                {filteredYourItems.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToYourOffer(item)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-dark-card"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <span className="block text-sm font-medium" style={{ color: getRarityColor(item.rarity) }}>
                        {item.name}
                      </span>
                      <span className="text-xs text-dark-muted">{item.category}</span>
                    </div>
                    <span className="text-sm text-dark-muted">{formatValue(item.value)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-[120px] space-y-2">
            {yourOffer.length === 0 ? (
              <div className="flex h-[120px] items-center justify-center text-dark-muted">
                <span className="text-center text-sm">Add items to your offer</span>
              </div>
            ) : (
              yourOffer.map((entry) => (
                <div
                  key={entry.item.id}
                  className="fade-in flex items-center gap-3 rounded-lg bg-dark-bg p-3"
                >
                  <span className="text-2xl">{entry.item.icon}</span>
                  <div className="flex-1">
                    <span className="block text-sm font-medium" style={{ color: getRarityColor(entry.item.rarity) }}>
                      {entry.item.name}
                    </span>
                    <span className="text-xs text-dark-muted">{formatValue(entry.item.value * entry.quantity)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateYourQuantity(entry.item.id, entry.quantity - 1)}
                      className="btn-press flex h-6 w-6 items-center justify-center rounded bg-dark-border text-dark-text"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm text-dark-text">{entry.quantity}</span>
                    <button
                      onClick={() => updateYourQuantity(entry.item.id, entry.quantity + 1)}
                      className="btn-press flex h-6 w-6 items-center justify-center rounded bg-dark-border text-dark-text"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromYourOffer(entry.item.id)}
                    className="text-dark-muted hover:text-dark-danger"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Their Offer */}
        <div className="card-hover rounded-xl border border-dark-border bg-dark-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-dark-success">Their Offer</h2>
            <span className="rounded-lg bg-dark-success/20 px-3 py-1 text-sm font-medium text-dark-success">
              {formatValue(theirTotal)}
            </span>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={searchTheir}
              onChange={(e) => setSearchTheir(e.target.value)}
              placeholder="Search and add items..."
              className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-dark-text placeholder-dark-muted focus:border-dark-success focus:outline-none"
            />
            {searchTheir && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-dark-border bg-dark-bg shadow-xl">
                {filteredTheirItems.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToTheirOffer(item)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-dark-card"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <span className="block text-sm font-medium" style={{ color: getRarityColor(item.rarity) }}>
                        {item.name}
                      </span>
                      <span className="text-xs text-dark-muted">{item.category}</span>
                    </div>
                    <span className="text-sm text-dark-muted">{formatValue(item.value)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-[120px] space-y-2">
            {theirOffer.length === 0 ? (
              <div className="flex h-[120px] items-center justify-center text-dark-muted">
                <span className="text-center text-sm">Add items to their offer</span>
              </div>
            ) : (
              theirOffer.map((entry) => (
                <div
                  key={entry.item.id}
                  className="fade-in flex items-center gap-3 rounded-lg bg-dark-bg p-3"
                >
                  <span className="text-2xl">{entry.item.icon}</span>
                  <div className="flex-1">
                    <span className="block text-sm font-medium" style={{ color: getRarityColor(entry.item.rarity) }}>
                      {entry.item.name}
                    </span>
                    <span className="text-xs text-dark-muted">{formatValue(entry.item.value * entry.quantity)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateTheirQuantity(entry.item.id, entry.quantity - 1)}
                      className="btn-press flex h-6 w-6 items-center justify-center rounded bg-dark-border text-dark-text"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm text-dark-text">{entry.quantity}</span>
                    <button
                      onClick={() => updateTheirQuantity(entry.item.id, entry.quantity + 1)}
                      className="btn-press flex h-6 w-6 items-center justify-center rounded bg-dark-border text-dark-text"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromTheirOffer(entry.item.id)}
                    className="text-dark-muted hover:text-dark-danger"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleCalculate}
          disabled={yourOffer.length === 0 || theirOffer.length === 0}
          className="btn-press flex-1 rounded-xl bg-gradient-to-r from-dark-accent to-cyan-500 px-6 py-4 font-bold text-white shadow-lg shadow-dark-accent/30 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          Calculate Trade
        </button>
        <button
          onClick={handleClear}
          className="btn-press rounded-xl border border-dark-border px-6 py-4 font-medium text-dark-muted transition-colors hover:border-dark-danger hover:text-dark-danger"
        >
          Clear
        </button>
      </div>

      {/* Result Section */}
      {showResult && (
        <div className="fade-in mt-6 rounded-xl border border-dark-border bg-dark-card p-6">
          <h3 className="mb-4 text-center text-lg font-bold text-dark-text">Trade Analysis</h3>
          
          <div className="mb-6 text-center">
            <span
              className="inline-block rounded-xl px-8 py-4 text-3xl font-bold"
              style={{ backgroundColor: `${calculation.color}20`, color: calculation.color }}
            >
              {calculation.verdict}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-xs text-dark-muted">
              <span>Big Loss</span>
              <span>Fair</span>
              <span>Big Win</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-dark-bg">
              <div
                className="progress-animate h-full rounded-full transition-all"
                style={{
                  width: `${calculation.progressValue}%`,
                  backgroundColor: calculation.color,
                }}
              />
            </div>
          </div>

          {/* Value Comparison */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-dark-bg p-4">
              <span className="block text-xs text-dark-muted">Your Value</span>
              <span className="text-lg font-bold text-dark-accent">{formatValue(yourTotal)}</span>
            </div>
            <div className="rounded-lg bg-dark-bg p-4">
              <span className="block text-xs text-dark-muted">Their Value</span>
              <span className="text-lg font-bold text-dark-success">{formatValue(theirTotal)}</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-sm text-dark-muted">Difference: </span>
            <span
              className="font-bold"
              style={{ color: calculation.difference >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {calculation.difference >= 0 ? '+' : ''}{formatValue(calculation.difference)}
              {' '}({calculation.percentDiff >= 0 ? '+' : ''}{calculation.percentDiff.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
