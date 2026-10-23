import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { MenuItem, SelectedCustomization } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCustomizerModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const ProductCustomizerModal: React.FC<ProductCustomizerModalProps> = ({ item, onClose }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<SelectedCustomization[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Initialize defaults when item opens
  useEffect(() => {
    if (!item) return;
    setQuantity(1);
    setSpecialInstructions('');

    // Pre-select first option for required/single customization groups
    const defaults: SelectedCustomization[] = [];
    item.customizations?.forEach((group) => {
      if (group.type === 'single' && group.options.length > 0) {
        defaults.push({
          groupName: group.name,
          optionName: group.options[0].name,
          price: group.options[0].price || 0,
        });
      }
    });
    setSelectedCustomizations(defaults);
  }, [item]);

  if (!item) return null;

  // Single option selection (e.g. size or milk)
  const handleSingleSelect = (groupName: string, optionName: string, price: number) => {
    setSelectedCustomizations((prev) => {
      const filtered = prev.filter((c) => c.groupName !== groupName);
      return [...filtered, { groupName, optionName, price }];
    });
  };

  // Multiple option toggle (e.g. toppings, flavors)
  const handleMultiToggle = (groupName: string, optionName: string, price: number) => {
    setSelectedCustomizations((prev) => {
      const exists = prev.some((c) => c.groupName === groupName && c.optionName === optionName);
      if (exists) {
        return prev.filter((c) => !(c.groupName === groupName && c.optionName === optionName));
      } else {
        return [...prev, { groupName, optionName, price }];
      }
    });
  };

  const isSelected = (groupName: string, optionName: string) => {
    return selectedCustomizations.some(
      (c) => c.groupName === groupName && c.optionName === optionName
    );
  };

  const extraTotal = selectedCustomizations.reduce((acc, c) => acc + (c.price || 0), 0);
  const unitPrice = item.price + extraTotal;
  const itemTotal = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(item, selectedCustomizations, quantity, specialInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-cream rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border border-cream-dark/60 flex flex-col max-h-[90vh] sm:max-h-[90vh] z-10 animate-slide-up sm:animate-none text-espresso">
        {/* Mobile drag handle indicator */}
        <div className="w-12 h-1.5 bg-espresso/20 rounded-full mx-auto my-2 sm:hidden absolute top-1 left-1/2 -translate-x-1/2 z-20" />

        {/* Header Image */}
        <div className="relative h-36 sm:h-52 w-full overflow-hidden shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors z-20"
            aria-label="Close customizer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-espresso">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-caramel">
              {item.category}
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight">{item.name}</h2>
            <p className="text-[11px] sm:text-xs text-espresso/70 line-clamp-1 mt-0.5">
              {item.description}
            </p>
          </div>
        </div>

        {/* Scrollable Customization Groups */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 overscroll-contain">
          {item.customizations?.map((group) => (
            <div key={group.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-espresso tracking-wide flex items-center space-x-1.5">
                  <span>{group.name}</span>
                  {group.required && (
                    <span className="text-[9px] sm:text-[10px] text-caramel uppercase font-semibold">
                      (Required)
                    </span>
                  )}
                </h4>
                <span className="text-[11px] text-espresso/50">
                  {group.type === 'single' ? 'Choose 1' : 'Optional add-ons'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.options.map((option) => {
                  const active = isSelected(group.name, option.name);

                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => {
                        if (group.type === 'single') {
                          handleSingleSelect(group.name, option.name, option.price);
                        } else {
                          handleMultiToggle(group.name, option.name, option.price);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left text-xs font-medium transition-all active:scale-98 ${
                        active
                          ? 'bg-caramel text-white font-bold border-caramel shadow-xs'
                          : 'bg-white hover:bg-cream-soft border-cream-dark/70 text-espresso'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                            active
                              ? 'bg-white border-white text-caramel'
                              : 'border-espresso/30'
                          }`}
                        >
                          {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs">{option.name}</span>
                      </div>
                      <span className={active ? 'text-white font-bold text-xs' : 'text-espresso/60 text-xs'}>
                        {option.price > 0 ? `+₹${option.price}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Instructions */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-espresso tracking-wide block">
              Special Instructions for Barista
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra hot, less ice, allergy notes..."
              className="w-full bg-white border border-cream-dark/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-xs text-espresso placeholder-espresso/40 focus:outline-none focus:ring-2 focus:ring-caramel resize-none"
            />
          </div>
        </div>

        {/* Footer with quantity and add to cart */}
        <div className="p-3.5 sm:p-5 bg-white border-t border-cream-dark/70 flex items-center justify-between gap-3 shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          {/* Quantity Stepper */}
          <div className="flex items-center space-x-2.5 bg-cream-soft rounded-xl sm:rounded-2xl p-1 border border-cream-dark/80">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              type="button"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white text-espresso flex items-center justify-center hover:bg-caramel hover:text-white transition-colors"
            >
              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <span className="font-bold text-xs sm:text-sm text-espresso w-4 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              type="button"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white text-espresso flex items-center justify-center hover:bg-caramel hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            type="button"
            className="flex-1 bg-espresso hover:bg-caramel text-cream py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-warm-md flex items-center justify-between active:scale-98"
          >
            <span>Add to Cart</span>
            <span className="font-serif font-bold text-sm sm:text-base">₹{itemTotal}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
