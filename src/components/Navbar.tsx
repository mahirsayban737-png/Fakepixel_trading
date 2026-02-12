import { cn } from '@/utils/cn';

interface NavbarProps {
  currentPage: 'home' | 'calculator' | 'values';
  onNavigate: (page: 'home' | 'calculator' | 'values') => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: '🏠' },
    { id: 'calculator' as const, label: 'Calculator', icon: '🔢' },
    { id: 'values' as const, label: 'Values', icon: '📊' },
  ];

  return (
    <nav className="glass sticky top-0 z-50 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <h1 className="bg-gradient-to-r from-dark-accent to-cyan-400 bg-clip-text text-xl font-bold text-transparent">
            Fakepixel
          </h1>
        </div>
        
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'btn-press flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                currentPage === item.id
                  ? 'bg-dark-accent text-white shadow-lg shadow-dark-accent/30'
                  : 'text-dark-muted hover:bg-dark-border/50 hover:text-dark-text'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
