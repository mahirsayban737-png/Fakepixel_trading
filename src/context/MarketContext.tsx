import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MarketItem, MarketContextType } from '@/types/market';

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Real-time listener using onSnapshot
    const marketRef = collection(db, 'market');
    const marketQuery = query(marketRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      marketQuery,
      (snapshot) => {
        const marketItems: MarketItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          marketItems.push({
            id: doc.id,
            name: data.name || 'Unknown Item',
            value: data.value || 0,
            demand: data.demand || 5,
            trend: data.trend || 'stable',
            imageUrl: data.imageUrl || undefined,
            category: data.category || 'General',
            lastUpdated: data.lastUpdated || Date.now(),
          });
        });
        setItems(marketItems);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firebase snapshot error:', err);
        setError('Failed to connect to market database. Please check your connection.');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const getItemById = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  const getItemByName = useCallback(
    (name: string) => items.find((item) => item.name.toLowerCase() === name.toLowerCase()),
    [items]
  );

  const value: MarketContextType = {
    items,
    loading,
    error,
    getItemById,
    getItemByName,
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}

export default MarketContext;
