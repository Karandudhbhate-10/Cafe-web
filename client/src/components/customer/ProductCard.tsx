import React from 'react';
import { Plus, Star, Clock } from 'lucide-react';
import { MenuItem } from '../../types';

interface ProductCardProps {
  item: MenuItem;
  onOpenCustomizer: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onOpenCustomizer,
  onQuickAdd,
}) => {
  const hasCustomizations = item.customizations && item.customizations.length > 0;

  const handleClick = () => {
    if (!item.isAvailable) return;
    if (hasCustomizations) {
      onOpenCustomizer(item);
    } else {
      onQuickAdd(item);
    }
  };

  return (
    <div
      className={`group bg-white rounded-2xl sm:rounded-3xl border border-[#879078]/25 hover:border-caramel/50 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-warm-sm ${
        item.isAvailable
          ? 'hover:shadow-warm-md'
          : 'opacity-65 grayscale-[30%] cursor-not-allowed'
      }`}
    >
      {/* ================= MOBILE LAYOUT (< sm) ================= */}
      <div className="flex sm:hidden p-3.5 items-center justify-between gap-3">
        {/* Left Info Column */}
        <div className="flex-1 min-w-0">
          {/* Dietary & Bestseller Badges in 2-Color Palette */}
          <div className="flex items-center space-x-1.5 mb-1 flex-wrap">
            {item.isBestseller && (
              <span className="inline-flex items-center space-x-0.5 bg-caramel text-espresso text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                <Star className="w-2.5 h-2.5 fill-current" />
                <span>Bestseller</span>
              </span>
            )}
            {item.dietary?.map((diet) => (
              <span
                key={diet}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-[#EDF4E7] text-[#284221] border-[#879078]/35"
              >
                {diet}
              </span>
            ))}
          </div>

          {/* Title & Price */}
          <h3 className="font-serif text-base font-bold text-espresso group-hover:text-caramel-dark transition-colors line-clamp-1">
            {item.name}
          </h3>
          <div className="font-serif text-sm font-bold text-espresso mt-0.5">
            ₹{item.price}
          </div>

          {/* Description */}
          <p className="text-[11px] text-espresso/65 line-clamp-2 mt-1 leading-snug">
            {item.description}
          </p>
        </div>

        {/* Right Thumbnail & Add Button */}
        <div className="relative shrink-0 flex flex-col items-center pb-3">
          <div
            onClick={handleClick}
            className={`w-24 h-24 rounded-2xl overflow-hidden bg-espresso/5 relative shadow-xs ${item.isAvailable ? 'cursor-pointer' : ''}`}
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center">
                <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Mobile Add Button (clean pill overlapping bottom of thumbnail) */}
          <div className="absolute -bottom-1 flex flex-col items-center">
            <button
              onClick={handleClick}
              disabled={!item.isAvailable}
              type="button"
              className={`px-3.5 py-1 rounded-full text-xs font-bold shadow-warm-sm transition-all flex items-center space-x-1 border border-white/25 active:scale-95 ${
                item.isAvailable
                  ? 'bg-espresso text-cream hover:bg-caramel hover:text-espresso'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3 h-3 text-caramel" />
              <span>ADD</span>
            </button>
            {hasCustomizations && item.isAvailable && (
              <span className="text-[8px] font-medium text-espresso/60 tracking-tight mt-0.5">
                customisable
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================= DESKTOP/TABLET LAYOUT (>= sm) ================= */}
      <div className="hidden sm:flex flex-col flex-1 justify-between">
        {/* Image Container */}
        <div
          onClick={handleClick}
          className={`relative aspect-[4/3] w-full overflow-hidden bg-espresso/5 ${item.isAvailable ? 'cursor-pointer' : ''}`}
        >
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {item.isBestseller && (
              <span className="inline-flex items-center space-x-1 bg-caramel text-espresso text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                <Star className="w-3 h-3 fill-current" />
                <span>Bestseller</span>
              </span>
            )}

            {item.dietary?.map((diet) => (
              <span
                key={diet}
                className="text-[10px] font-semibold bg-[#EDF4E7]/95 backdrop-blur-md text-[#284221] px-2.5 py-0.5 rounded-full border border-[#879078]/35 shadow-xs"
              >
                {diet}
              </span>
            ))}
          </div>

          {/* Prep Time */}
          {item.prepTimeMinutes && (
            <div className="absolute bottom-3 right-3 bg-espresso/80 backdrop-blur-sm text-cream text-[11px] font-medium px-2 py-1 rounded-lg flex items-center space-x-1">
              <Clock className="w-3 h-3 text-caramel" />
              <span>{item.prepTimeMinutes} min</span>
            </div>
          )}

          {/* Sold out overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
              <span className="bg-red-600 text-white font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                Currently Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <h3 className="font-serif text-lg font-bold text-espresso group-hover:text-caramel-dark transition-colors line-clamp-1">
                {item.name}
              </h3>
              <span className="font-serif text-lg font-bold text-espresso shrink-0">
                ₹{item.price}
              </span>
            </div>

            <p className="text-xs text-espresso/70 line-clamp-2 leading-relaxed mb-4">
              {item.description}
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-espresso/10 flex items-center justify-between">
            <div>
              {hasCustomizations && item.isAvailable ? (
                <span className="text-[11px] font-semibold text-[#284221] bg-[#EDF4E7] border border-[#879078]/35 px-2.5 py-0.5 rounded-full shadow-2xs">
                  Customisable
                </span>
              ) : (
                <span className="text-[11px] text-espresso/45 font-medium">
                  Freshly prepared
                </span>
              )}
            </div>

            <button
              onClick={handleClick}
              disabled={!item.isAvailable}
              type="button"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-warm-sm active:scale-95 ${
                item.isAvailable
                  ? 'bg-espresso text-cream hover:bg-caramel hover:text-espresso shadow-xs'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-caramel" />
              <span>ADD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
