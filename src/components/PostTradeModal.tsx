import { useState } from 'react';
import { items, Item, formatValue, getRarityColor } from '@/data/items';

interface PostTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostTradeModal({ isOpen, onClose }: PostTradeModalProps) {
  const [searchHave, setSearchHave] = useState('');
  const [searchWant, setSearchWant] = useState('');
  const [haveItems, setHaveItems] = useState<{ item: Item; quantity: number }[]>([]);
  const [wantItems, setWantItems] = useState<{ item: Item; quantity: number }[]>([]);

  const filteredHaveItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchHave.toLowerCase())
  );

  const filteredWantItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchWant.toLowerCase())
  );

  const addHaveItem = (item: Item) => {
    const existing = haveItems.find((i) => i.item.id === item.id);
    if (existing) {
      setHaveItems(
        haveItems.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setHaveItems([...haveItems, { item, quantity: 1 }]);
    }
    setSearchHave('');
  };

  const addWantItem = (item: Item) => {
    const existing = wantItems.find((i) => i.item.id === item.id);
    if (existing) {
      setWantItems(
        wantItems.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setWantItems([...wantItems, { item, quantity: 1 }]);
    }
    setSearchWant('');
  };

  const removeHaveItem = (itemId: number) => {
    setHaveItems(haveItems.filter((i) => i.item.id !== itemId));
  };

  const removeWantItem = (itemId: number) => {
    setWantItems(wantItems.filter((i) => i.item.id !== itemId));
  };

  const handleSubmit = () => {
    alert('Trade posted successfully! (Demo)');
    setHaveItems([]);
    setWantItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="modal-enter max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-dark-border bg-dark-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark-text">Post a Trade</h2>
          <button
            onClick={onClose}
            className="btn-press flex h-8 w-8 items-center justify-center rounded-full bg-dark-border text-dark-muted hover:text-dark-text"
          >
            ✕
          </button>
        </div>

        {/* HAVE Section */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-dark-success">
            I Have
          </label>
          <div className="relative mb-2">
            <input
              type="text"
              value={searchHave}
              onChange={(e) => setSearchHave(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-sm text-dark-text placeholder-dark-muted focus:border-dark-accent focus:outline-none"
            />
            {searchHave && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-dark-border bg-dark-bg">
                {filteredHaveItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addHaveItem(item)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-dark-text hover:bg-dark-card"
                  >
                    <span>{item.icon}</span>
                    <span style={{ color: getRarityColor(item.rarity) }}>{item.name}</span>
                    <span className="ml-auto text-xs text-dark-muted">{formatValue(item.value)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {haveItems.map((entry) => (
              <div
                key={entry.item.id}
                className="flex items-center gap-1 rounded-lg bg-dark-success/20 px-2 py-1"
              >
                <span>{entry.item.icon}</span>
                <span className="text-xs" style={{ color: getRarityColor(entry.item.rarity) }}>
                  {entry.item.name}
                </span>
                <span className="text-xs text-dark-muted">x{entry.quantity}</span>
                <button
                  onClick={() => removeHaveItem(entry.item.id)}
                  className="ml-1 text-dark-muted hover:text-dark-danger"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* WANT Section */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-dark-danger">
            I Want
          </label>
          <div className="relative mb-2">
            <input
              type="text"
              value={searchWant}
              onChange={(e) => setSearchWant(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-sm text-dark-text placeholder-dark-muted focus:border-dark-accent focus:outline-none"
            />
            {searchWant && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-dark-border bg-dark-bg">
                {filteredWantItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addWantItem(item)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-dark-text hover:bg-dark-card"
                  >
                    <span>{item.icon}</span>
                    <span style={{ color: getRarityColor(item.rarity) }}>{item.name}</span>
                    <span className="ml-auto text-xs text-dark-muted">{formatValue(item.value)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {wantItems.map((entry) => (
              <div
                key={entry.item.id}
                className="flex items-center gap-1 rounded-lg bg-dark-danger/20 px-2 py-1"
              >
                <span>{entry.item.icon}</span>
                <span className="text-xs" style={{ color: getRarityColor(entry.item.rarity) }}>
                  {entry.item.name}
                </span>
                <span className="text-xs text-dark-muted">x{entry.quantity}</span>
                <button
                  onClick={() => removeWantItem(entry.item.id)}
                  className="ml-1 text-dark-muted hover:text-dark-danger"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={haveItems.length === 0 || wantItems.length === 0}
          className="btn-press w-full rounded-lg bg-gradient-to-r from-dark-accent to-cyan-500 px-4 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-dark-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Post Trade
        </button>
      </div>
    </div>
  );
}
