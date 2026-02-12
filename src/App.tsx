import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HomePage } from '@/pages/HomePage';
import { CalculatorPage } from '@/pages/CalculatorPage';
import { ValuesPage } from '@/pages/ValuesPage';

type Page = 'home' | 'calculator' | 'values';

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'calculator':
        return <CalculatorPage />;
      case 'values':
        return <ValuesPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="mx-auto max-w-7xl pb-20">
        {renderPage()}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-dark-border px-4 py-2 md:hidden">
        <div className="flex justify-around">
          {[
            { id: 'home' as const, icon: '🏠', label: 'Home' },
            { id: 'calculator' as const, icon: '🔢', label: 'Calc' },
            { id: 'values' as const, icon: '📊', label: 'Values' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`btn-press flex flex-col items-center rounded-lg px-6 py-2 transition-all ${
                currentPage === item.id
                  ? 'text-dark-accent'
                  : 'text-dark-muted'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mt-1 text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
