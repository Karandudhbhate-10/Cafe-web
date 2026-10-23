import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, Loader2, Coffee, AlertCircle, Sparkles, XCircle, X, AlertTriangle } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { CategoryTabs } from '../components/customer/CategoryTabs';
import { ProductCard } from '../components/customer/ProductCard';
import { ProductCustomizerModal } from '../components/customer/ProductCustomizerModal';
import { CartDrawer } from '../components/customer/CartDrawer';
import { StickyCartBar } from '../components/customer/StickyCartBar';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { MenuItem, Category, TableItem } from '../types';

export const MenuPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, itemCount, activeOrderToken, activeOrderNumber, activeOrderTable, setActiveOrder, clearActiveOrder } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'bestseller'>('all');

  // Customer selects table ONLY inside the cart when ordering!
  // Strip any legacy order rejection or table query params so menu is always pristine
  useEffect(() => {
    if (searchParams.get('orderRejected')) {
      clearActiveOrder();
      localStorage.removeItem('bb_active_order_token');
      localStorage.removeItem('bb_active_order_number');
      localStorage.removeItem('bb_active_order_table');
    }

    if (
      searchParams.get('orderRejected') ||
      searchParams.get('reason') ||
      searchParams.get('table')
    ) {
      navigate('/menu', { replace: true });
    }
  }, [searchParams, clearActiveOrder, navigate]);

  // Load menu items, categories, and tables
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [menuData, tablesData] = await Promise.all([
          api.getMenu(),
          api.getPublicTables().catch(() => []),
        ]);
        setCategories(menuData.categories || []);
        setItems(menuData.items || []);
        setTables(tablesData || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load menu items.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute item counts by category
  const itemsCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      map[item.category] = (map[item.category] || 0) + 1;
    }
    return map;
  }, [items]);

  // Filter items based on activeCategory, searchQuery, and dietaryFilter
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDietary =
        dietaryFilter === 'all' ||
        (dietaryFilter === 'veg' && item.dietary?.some((d) => d.toLowerCase().includes('veg'))) ||
        (dietaryFilter === 'bestseller' && item.isBestseller);
      return matchesCategory && matchesSearch && matchesDietary;
    });
  }, [items, activeCategory, searchQuery, dietaryFilter]);

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-br from-[#BDDCB8] via-[#E4EFE2] to-[#F4DFC8] text-espresso flex flex-col selection:bg-caramel selection:text-espresso">
      {/* Visible 2-Color Combo Atmosphere: Rich Botanical Sage Green (Color 1) + Warm Honey Latte Caramel (Color 2) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Color 1: Botanical Sage Green Ambient Waves (Top-Left, Mid-Left, and Lower-Left) */}
        <div className="absolute -top-24 -left-20 w-[780px] h-[780px] rounded-full bg-[#6C9663]/48 blur-[90px]" />
        <div className="absolute top-1/4 -left-32 w-[650px] h-[650px] rounded-full bg-[#7DA574]/44 blur-[100px]" />
        <div className="absolute top-2/3 -left-24 w-[580px] h-[580px] rounded-full bg-[#8EB485]/38 blur-[105px]" />

        {/* Color 2: Warm Honey Latte Caramel Ambient Waves (Top-Right & Bottom-Right) */}
        <div className="absolute top-12 -right-24 w-[680px] h-[680px] rounded-full bg-[#C58B54]/30 blur-[110px]" />
        <div className="absolute -bottom-24 right-4 w-[750px] h-[750px] rounded-full bg-[#D99F69]/28 blur-[120px]" />

        {/* Tactile Organic Grain Overlay in independent layer so it does not overwrite the gradient */}
        <div className="absolute inset-0 bg-grain opacity-30 mix-blend-multiply" />
      </div>

      <Navbar />

      <main className={`relative z-10 flex-1 pt-20 sm:pt-24 ${itemCount > 0 ? 'pb-20' : 'pb-6'} sm:pb-10`}>
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          {/* Active Order in Progress Banner - ONLY if matching current table! */}
          {activeOrderToken && (!searchParams.get('table') || activeOrderTable?.toUpperCase() === searchParams.get('table')?.trim().toUpperCase()) && (
            <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-espresso via-roast to-espresso text-cream shadow-warm-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-caramel/40 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-caramel/20 border border-caramel/40 flex items-center justify-center text-caramel shrink-0">
                  <Coffee className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-caramel text-espresso">
                      Live Order in Kitchen
                    </span>
                    {activeOrderNumber && (
                      <span className="text-xs font-mono font-bold text-caramel-light">
                        #{activeOrderNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cream/80 mt-0.5">
                    Your table order is active. Add more delicious items or track live preparation.
                  </p>
                </div>
              </div>
              <Link
                to={`/track/${activeOrderToken}`}
                className="inline-flex items-center justify-center space-x-1.5 bg-caramel hover:bg-caramel-dark text-espresso font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-warm-sm self-start sm:self-auto shrink-0 active:scale-95"
              >
                <span>Resume Live Tracking</span>
                <span className="text-sm">→</span>
              </Link>
            </div>
          )}




          {/* Search Header & Dietary Toggles */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 sm:mb-6">
            {/* Quick Filter Chips in 2-Color Palette (Sage + Cream) */}
            <div className="flex items-center space-x-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDietaryFilter('all')}
                className={`text-[11px] font-semibold px-4 py-1.5 rounded-full border transition-all ${
                  dietaryFilter === 'all'
                    ? 'bg-espresso text-cream font-bold border-espresso shadow-xs'
                    : 'bg-white/90 text-espresso/80 border-[#879078]/25 hover:bg-[#F2F7F0] hover:text-espresso hover:border-[#879078]/50 shadow-2xs'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
                className={`text-[11px] font-semibold px-4 py-1.5 rounded-full border transition-all flex items-center space-x-1.5 ${
                  dietaryFilter === 'veg'
                    ? 'bg-[#E5EFE2] text-[#284222] font-bold border-[#879078]/40 shadow-xs'
                    : 'bg-white/90 text-espresso/80 border-[#879078]/25 hover:bg-[#F2F7F0] hover:text-espresso hover:border-[#879078]/50 shadow-2xs'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                <span>Veg Only</span>
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter(dietaryFilter === 'bestseller' ? 'all' : 'bestseller')}
                className={`text-[11px] font-semibold px-4 py-1.5 rounded-full border transition-all flex items-center space-x-1 ${
                  dietaryFilter === 'bestseller'
                    ? 'bg-caramel text-espresso font-bold border-caramel shadow-xs'
                    : 'bg-white/90 text-espresso/80 border-[#879078]/25 hover:bg-[#F2F7F0] hover:text-espresso hover:border-[#879078]/50 shadow-2xs'
                }`}
              >
                <span>⭐ Bestsellers</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-caramel absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cappuccino, croissant..."
                className="w-full bg-white/95 border border-[#879078]/30 rounded-full pl-9 pr-3.5 py-2 text-xs text-espresso placeholder-espresso/45 focus:outline-none focus:ring-2 focus:ring-[#879078]/25 focus:border-caramel shadow-xs"
              />
            </div>
          </div>

          {/* Sticky Category Tabs */}
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={(cat) => setActiveCategory(cat)}
            itemsCountByCategory={itemsCountByCategory}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-caramel" />
              <p className="text-xs sm:text-sm font-serif text-espresso/70">
                Brewing your fresh digital menu...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-center max-w-md mx-auto my-8 space-y-2.5">
              <AlertCircle className="w-7 h-7 text-red-500 mx-auto" />
              <h3 className="font-serif text-base font-bold text-red-800">
                Unable to Load Menu
              </h3>
              <p className="text-xs text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-espresso text-cream text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-caramel"
              >
                Retry
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && filteredItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredItems.map((item) => (
                <ProductCard
                  key={item._id}
                  item={item}
                  onOpenCustomizer={(itemToCustomize) => setCustomizingItem(itemToCustomize)}
                  onQuickAdd={(itemToAdd) => addItem(itemToAdd, [], 1)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredItems.length === 0 && (
            <div className="py-20 text-center max-w-sm mx-auto space-y-3">
              <div className="w-16 h-16 rounded-full bg-cream-soft flex items-center justify-center text-espresso/40 mx-auto border border-cream-dark/60">
                <Coffee className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-espresso">
                No menu items found
              </h3>
              <p className="text-xs text-espresso/60 leading-relaxed font-normal">
                {searchQuery
                  ? `No items matching "${searchQuery}". Try searching for cappuccino, croissant, or latte.`
                  : 'No items currently available in this category.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-espresso text-cream text-xs font-bold px-4 py-2 rounded-xl hover:bg-caramel"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modals & Overlays */}
      <ProductCustomizerModal
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
      />
      <CartDrawer />
      <StickyCartBar />
    </div>
  );
};
