import { Activity, Gem, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

interface HeaderProps {
  activeTab: 'market' | 'calculator';
  onTabChange: (tab: 'market' | 'calculator') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Logo & Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl blur-lg opacity-50" />
              <div className="relative p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30">
                <Gem className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Fakepixel</h1>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Bazaar</span>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 rounded border border-emerald-500/30">
                  <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  <span className="text-[8px] font-bold text-emerald-400 uppercase">Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-colors md:hidden"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => onTabChange('market')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300",
                activeTab === 'market'
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Market
            </button>
            <button
              onClick={() => onTabChange('calculator')}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300",
                activeTab === 'calculator'
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Calculator
            </button>
          </nav>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="mt-4 flex bg-slate-800/60 rounded-xl p-1 border border-slate-700/50 md:hidden">
            <button
              onClick={() => {
                onTabChange('market');
                setMenuOpen(false);
              }}
              className={cn(
                "flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300",
                activeTab === 'market'
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Market
            </button>
            <button
              onClick={() => {
                onTabChange('calculator');
                setMenuOpen(false);
              }}
              className={cn(
                "flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300",
                activeTab === 'calculator'
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Calculator
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
