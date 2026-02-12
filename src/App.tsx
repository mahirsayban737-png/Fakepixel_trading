import { useState, useEffect } from 'react';
import { MarketProvider } from '@/context/MarketContext';
import { AdminProvider } from '@/context/AdminContext';
import { Header } from '@/components/Header';
import { MarketFeed } from '@/components/MarketFeed';
import { Calculator } from '@/components/Calculator';
import { AdminPanel } from '@/components/AdminPanel';

type ActiveTab = 'market' | 'calculator';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('market');

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="max-w-lg mx-auto px-4 py-6">
          {activeTab === 'market' && <MarketFeed />}
          {activeTab === 'calculator' && <Calculator />}
        </main>

        {/* Footer */}
        <footer className="max-w-lg mx-auto px-4 py-8 text-center">
          <p className="text-xs text-slate-600">
            Fakepixel Bazaar Tracker • Real-time Market Data
          </p>
          <p className="text-[10px] text-slate-700 mt-1">
            Prices update instantly via Firebase
          </p>
        </footer>
      </div>
    </div>
  );
}

export function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current path is /admin
    const checkAdminRoute = () => {
      const hash = window.location.hash;
      setIsAdmin(hash === '#/admin' || hash === '#admin');
    };

    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    
    return () => window.removeEventListener('hashchange', checkAdminRoute);
  }, []);

  return (
    <MarketProvider>
      <AdminProvider>
        {isAdmin ? <AdminPanel /> : <MainApp />}
      </AdminProvider>
    </MarketProvider>
  );
}
