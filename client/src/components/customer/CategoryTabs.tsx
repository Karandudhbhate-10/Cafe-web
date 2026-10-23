import React from 'react';
import { Category } from '../../types';
import { Coffee, CupSoda, Leaf, Croissant, Utensils, Cake, Sparkles } from 'lucide-react';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (categoryName: string) => void;
  itemsCountByCategory: Record<string, number>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  itemsCountByCategory,
}) => {
  const getIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('espresso') || lower.includes('coffee') && !lower.includes('cold')) return <Coffee className="w-4 h-4" />;
    if (lower.includes('cold')) return <CupSoda className="w-4 h-4" />;
    if (lower.includes('tea')) return <Leaf className="w-4 h-4" />;
    if (lower.includes('bakery')) return <Croissant className="w-4 h-4" />;
    if (lower.includes('sandwich')) return <Utensils className="w-4 h-4" />;
    if (lower.includes('dessert')) return <Cake className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  return (
    <div className="sticky top-[52px] sm:top-[60px] z-30 mb-4 sm:mb-6">
      <div className="bg-gradient-to-r from-[#C9E4C4]/90 via-[#F4EFE6]/90 to-[#F6E3CC]/85 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-[#7DA175]/35 shadow-warm-sm">
        {/* Scrollable pill container */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-0.5 scrollbar-none no-scrollbar">
        {/* All Items Button */}
        <button
          onClick={() => onSelectCategory('all')}
          type="button"
          className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-all flex items-center space-x-1.5 shadow-xs shrink-0 active:scale-95 ${
            activeCategory === 'all'
              ? 'bg-espresso text-cream shadow-warm-sm scale-[1.02]'
              : 'bg-white/90 hover:bg-[#F8FAF5] text-espresso/85 border border-[#879078]/25 hover:border-[#879078]/55 shadow-2xs'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${activeCategory === 'all' ? 'text-caramel' : 'text-[#879078]'}`} />
          <span>Full Menu</span>
        </button>

        {/* Category Pills */}
        {categories.map((cat) => {
          const isActive = activeCategory === cat.name;
          const count = itemsCountByCategory[cat.name] || 0;

          return (
            <button
              key={cat._id || cat.name}
              onClick={() => onSelectCategory(cat.name)}
              type="button"
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-all flex items-center space-x-1.5 shadow-xs shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-espresso text-cream shadow-warm-sm scale-[1.02]'
                  : 'bg-white/90 hover:bg-[#F8FAF5] text-espresso/85 border border-[#879078]/25 hover:border-[#879078]/55 shadow-2xs'
              }`}
            >
              <span className={isActive ? 'text-caramel' : 'text-[#879078]'}>
                {getIcon(cat.name)}
              </span>
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-caramel text-espresso' : 'bg-[#E3EFE0] text-[#253E1E]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
};
