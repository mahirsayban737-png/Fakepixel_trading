import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAdmin } from '@/context/AdminContext';
import { useMarket } from '@/context/MarketContext';
import type { MarketItem } from '@/types/market';
import { cn } from '@/utils/cn';
import {
  Shield,
  LogOut,
  Plus,
  Save,
  Trash2,
  Edit3,
  RefreshCw,
  Image,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  X,
  Package,
  Percent,
} from 'lucide-react';

interface NewItemForm {
  name: string;
  value: string;
  demand: string;
  trend: 'rising' | 'falling' | 'stable';
  imageUrl: string;
  category: string;
}

const initialForm: NewItemForm = {
  name: '',
  value: '',
  demand: '5',
  trend: 'stable',
  imageUrl: '',
  category: 'General',
};

export function AdminPanel() {
  const { isAuthenticated, login, logout } = useAdmin();
  const { items, loading } = useMarket();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [form, setForm] = useState<NewItemForm>(initialForm);
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGlobalUpdate, setShowGlobalUpdate] = useState(false);
  const [globalPercentage, setGlobalPercentage] = useState('');

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('Invalid password. Access denied.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const itemData = {
        name: form.name.trim(),
        value: parseFloat(form.value) || 0,
        demand: Math.min(10, Math.max(1, parseInt(form.demand) || 5)),
        trend: form.trend,
        imageUrl: form.imageUrl.trim() || null,
        category: form.category.trim() || 'General',
        lastUpdated: Date.now(),
      };

      if (editingItem) {
        await updateDoc(doc(db, 'market', editingItem.id), itemData);
        setNotification({ type: 'success', message: `${itemData.name} updated successfully!` });
      } else {
        await addDoc(collection(db, 'market'), itemData);
        setNotification({ type: 'success', message: `${itemData.name} added to market!` });
      }

      setForm(initialForm);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      setNotification({ type: 'error', message: 'Failed to save item. Check Firebase connection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: MarketItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      value: item.value.toString(),
      demand: item.demand.toString(),
      trend: item.trend,
      imageUrl: item.imageUrl || '',
      category: item.category || 'General',
    });
  };

  const handleDelete = async (item: MarketItem) => {
    if (!confirm(`Delete "${item.name}" from the market?`)) return;

    try {
      await deleteDoc(doc(db, 'market', item.id));
      setNotification({ type: 'success', message: `${item.name} deleted from market.` });
    } catch (error) {
      console.error('Error deleting item:', error);
      setNotification({ type: 'error', message: 'Failed to delete item.' });
    }
  };

  const handleGlobalUpdate = async () => {
    const percentage = parseFloat(globalPercentage);
    if (isNaN(percentage)) {
      setNotification({ type: 'error', message: 'Please enter a valid percentage.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const snapshot = await getDocs(collection(db, 'market'));
      const batch = writeBatch(db);

      snapshot.forEach((docSnap) => {
        const currentValue = docSnap.data().value || 0;
        const newValue = Math.round(currentValue * (1 + percentage / 100));
        batch.update(doc(db, 'market', docSnap.id), {
          value: newValue,
          lastUpdated: Date.now(),
        });
      });

      await batch.commit();
      setNotification({
        type: 'success',
        message: `All prices ${percentage >= 0 ? 'increased' : 'decreased'} by ${Math.abs(percentage)}%!`,
      });
      setGlobalPercentage('');
      setShowGlobalUpdate(false);
    } catch (error) {
      console.error('Error updating prices:', error);
      setNotification({ type: 'error', message: 'Failed to update prices.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setForm(initialForm);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className={cn(
          "w-full max-w-sm",
          "bg-slate-900/60 backdrop-blur-xl",
          "border border-slate-700/50 rounded-3xl",
          "p-8 shadow-2xl"
        )}>
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-lg shadow-red-500/30 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Access</h1>
            <p className="text-sm text-slate-400 mt-1">Enter credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className={cn(
                  "w-full bg-slate-800/80 border border-slate-700/50",
                  "text-white placeholder-slate-500 rounded-xl",
                  "pl-12 pr-12 py-4",
                  "focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20",
                  "transition-all duration-200"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className={cn(
                "w-full py-4 rounded-xl font-semibold",
                "bg-gradient-to-r from-red-500 to-orange-600",
                "text-white shadow-lg shadow-red-500/30",
                "hover:shadow-red-500/50 hover:scale-[1.02]",
                "active:scale-[0.98] transition-all duration-200"
              )}
            >
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-950 pb-8">
      {/* Notification Toast */}
      {notification && (
        <div className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl",
          "animate-in slide-in-from-top duration-300",
          notification.type === 'success'
            ? "bg-emerald-500 text-white"
            : "bg-red-500 text-white"
        )}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider">Connected</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Global Price Update */}
        <div className={cn(
          "bg-slate-900/60 backdrop-blur-xl",
          "border border-slate-700/50 rounded-2xl p-4"
        )}>
          <button
            onClick={() => setShowGlobalUpdate(!showGlobalUpdate)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <Percent className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">Global Price Update</span>
            </div>
            <RefreshCw className={cn("w-5 h-5 text-slate-400 transition-transform", showGlobalUpdate && "rotate-180")} />
          </button>

          {showGlobalUpdate && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
              <div className="flex gap-3">
                <input
                  type="number"
                  value={globalPercentage}
                  onChange={(e) => setGlobalPercentage(e.target.value)}
                  placeholder="e.g. 10 or -5"
                  className={cn(
                    "flex-1 bg-slate-800/80 border border-slate-700/50",
                    "text-white rounded-xl px-4 py-3",
                    "focus:outline-none focus:border-amber-500/50"
                  )}
                />
                <button
                  onClick={handleGlobalUpdate}
                  disabled={isSubmitting || !globalPercentage}
                  className={cn(
                    "px-6 py-3 rounded-xl font-semibold",
                    "bg-gradient-to-r from-amber-500 to-orange-600",
                    "text-white shadow-lg shadow-amber-500/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200"
                  )}
                >
                  Apply %
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Enter a percentage to adjust all prices. Use negative for decrease.
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Item Form */}
        <div className={cn(
          "bg-slate-900/60 backdrop-blur-xl",
          "border border-slate-700/50 rounded-2xl p-5"
        )}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl",
                editingItem
                  ? "bg-gradient-to-br from-blue-500 to-cyan-600"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600"
              )}>
                {editingItem ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
              </div>
              <span className="font-semibold text-white">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </span>
            </div>
            {editingItem && (
              <button
                onClick={cancelEdit}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Item Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Diamond Sword"
                  required
                  className={cn(
                    "w-full bg-slate-800/80 border border-slate-700/50",
                    "text-white rounded-xl px-4 py-3",
                    "focus:outline-none focus:border-purple-500/50"
                  )}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Value (coins)
                </label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="10000"
                  required
                  min="0"
                  className={cn(
                    "w-full bg-slate-800/80 border border-slate-700/50",
                    "text-white rounded-xl px-4 py-3",
                    "focus:outline-none focus:border-purple-500/50"
                  )}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Demand (1-10)
                </label>
                <input
                  type="number"
                  value={form.demand}
                  onChange={(e) => setForm({ ...form, demand: e.target.value })}
                  min="1"
                  max="10"
                  required
                  className={cn(
                    "w-full bg-slate-800/80 border border-slate-700/50",
                    "text-white rounded-xl px-4 py-3",
                    "focus:outline-none focus:border-purple-500/50"
                  )}
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Trend
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['rising', 'stable', 'falling'] as const).map((trend) => (
                    <button
                      key={trend}
                      type="button"
                      onClick={() => setForm({ ...form, trend })}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                        form.trend === trend
                          ? trend === 'rising'
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            : trend === 'falling'
                            ? "bg-red-500/20 border-red-500/50 text-red-400"
                            : "bg-slate-500/20 border-slate-500/50 text-slate-300"
                          : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                      )}
                    >
                      {trend === 'rising' && <TrendingUp className="w-4 h-4" />}
                      {trend === 'stable' && <Minus className="w-4 h-4" />}
                      {trend === 'falling' && <TrendingDown className="w-4 h-4" />}
                      <span className="capitalize text-sm font-medium">{trend}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  <div className="flex items-center gap-2">
                    <Image className="w-3.5 h-3.5" />
                    Image URL (PNG)
                  </div>
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://example.com/item.png"
                  className={cn(
                    "w-full bg-slate-800/80 border border-slate-700/50",
                    "text-white rounded-xl px-4 py-3",
                    "focus:outline-none focus:border-purple-500/50"
                  )}
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={cn(
                    "w-full bg-slate-800/80 border border-slate-700/50",
                    "text-white rounded-xl px-4 py-3",
                    "focus:outline-none focus:border-purple-500/50"
                  )}
                >
                  <option value="General">General</option>
                  <option value="Weapons">Weapons</option>
                  <option value="Armor">Armor</option>
                  <option value="Tools">Tools</option>
                  <option value="Resources">Resources</option>
                  <option value="Enchants">Enchants</option>
                  <option value="Pets">Pets</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Collectibles">Collectibles</option>
                </select>
              </div>
            </div>

            {/* Preview */}
            {form.imageUrl && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-12 h-12 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                    (e.target as HTMLImageElement).alt = 'Invalid URL';
                  }}
                />
                <span className="text-sm text-slate-400">Image Preview</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !form.name || !form.value}
              className={cn(
                "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2",
                editingItem
                  ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600",
                "text-white shadow-lg",
                editingItem ? "shadow-blue-500/30" : "shadow-emerald-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              )}
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingItem ? 'Update Item' : 'Add Item'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Items List */}
        <div className={cn(
          "bg-slate-900/60 backdrop-blur-xl",
          "border border-slate-700/50 rounded-2xl p-5"
        )}>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Market Items ({items.length})</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
              <span className="text-slate-400">Loading items...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No items in market yet.</p>
              <p className="text-xs text-slate-500 mt-1">Add your first item above!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3",
                    "bg-slate-800/50 border border-slate-700/50 rounded-xl",
                    "hover:border-slate-600/50 transition-all"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-900/50 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-8 h-8 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <Package className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{item.name}</div>
                    <div className="text-xs text-amber-400">{item.value.toLocaleString()} coins</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
