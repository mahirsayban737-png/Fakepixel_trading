import { Trade, formatValue, getRarityColor } from '@/data/items';

interface TradeCardProps {
  trade: Trade;
}

export function TradeCard({ trade }: TradeCardProps) {
  const timeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="card-hover fade-in rounded-xl border border-dark-border bg-dark-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-accent/20 text-sm">
            {trade.user.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-dark-text">{trade.user}</span>
        </div>
        <span className="text-xs text-dark-muted">{timeAgo(trade.timestamp)}</span>
      </div>

      <div className="space-y-3">
        {/* HAVE Section */}
        <div className="rounded-lg bg-dark-success/10 p-3">
          <div className="mb-2 flex items-center gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-dark-success">HAVE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trade.have.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-md bg-dark-bg/50 px-2 py-1"
              >
                <span className="text-lg">{item.item.icon}</span>
                <div className="flex flex-col">
                  <span 
                    className="text-xs font-medium"
                    style={{ color: getRarityColor(item.item.rarity) }}
                  >
                    {item.item.name}
                  </span>
                  <span className="text-[10px] text-dark-muted">
                    x{item.quantity} • {formatValue(item.item.value * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Swap Icon */}
        <div className="flex justify-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-dark-border">
            <span className="text-xs">⇅</span>
          </div>
        </div>

        {/* WANT Section */}
        <div className="rounded-lg bg-dark-danger/10 p-3">
          <div className="mb-2 flex items-center gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-dark-danger">WANT</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trade.want.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-md bg-dark-bg/50 px-2 py-1"
              >
                <span className="text-lg">{item.item.icon}</span>
                <div className="flex flex-col">
                  <span 
                    className="text-xs font-medium"
                    style={{ color: getRarityColor(item.item.rarity) }}
                  >
                    {item.item.name}
                  </span>
                  <span className="text-[10px] text-dark-muted">
                    x{item.quantity} • {formatValue(item.item.value * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn-press flex-1 rounded-lg bg-dark-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-dark-accent/80">
          Contact
        </button>
        <button className="btn-press rounded-lg border border-dark-border px-3 py-2 text-xs font-medium text-dark-muted transition-colors hover:border-dark-accent hover:text-dark-accent">
          Save
        </button>
      </div>
    </div>
  );
}
