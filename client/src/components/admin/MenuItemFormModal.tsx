import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { MenuItem, Category, CustomizationGroup } from '../../types';

interface MenuItemFormModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSave: (formData: Partial<MenuItem>) => Promise<void>;
}

export const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
  isOpen,
  item,
  categories,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(140);
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(5);
  const [dietary, setDietary] = useState<string>('Vegetarian');
  const [customizations, setCustomizations] = useState<CustomizationGroup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setDescription(item.description || '');
      setPrice(item.price || 0);
      setCategory(item.category || (categories[0]?.name ?? 'Espresso & Coffee'));
      setImage(item.image || '');
      setIsAvailable(item.isAvailable ?? true);
      setIsBestseller(item.isBestseller ?? false);
      setIsFeatured(item.isFeatured ?? false);
      setPrepTimeMinutes(item.prepTimeMinutes || 5);
      setDietary(item.dietary?.[0] || 'Vegetarian');
      setCustomizations(item.customizations || []);
    } else {
      setName('');
      setDescription('');
      setPrice(140);
      setCategory(categories[0]?.name || 'Espresso & Coffee');
      setImage('https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80');
      setIsAvailable(true);
      setIsBestseller(false);
      setIsFeatured(false);
      setPrepTimeMinutes(5);
      setDietary('Vegetarian');
      setCustomizations([
        {
          name: 'Size',
          type: 'single',
          required: true,
          options: [
            { name: 'Regular', price: 0 },
            { name: 'Large', price: 40 },
          ],
        },
      ]);
    }
  }, [item, categories, isOpen]);

  if (!isOpen) return null;

  const handleAddGroup = () => {
    setCustomizations([
      ...customizations,
      {
        name: 'New Customization',
        type: 'single',
        required: false,
        options: [{ name: 'Standard', price: 0 }],
      },
    ]);
  };

  const handleRemoveGroup = (idx: number) => {
    setCustomizations(customizations.filter((_, i) => i !== idx));
  };

  const handleAddOption = (groupIdx: number) => {
    const updated = [...customizations];
    updated[groupIdx].options.push({ name: 'Extra Option', price: 20 });
    setCustomizations(updated);
  };

  const handleRemoveOption = (groupIdx: number, optIdx: number) => {
    const updated = [...customizations];
    updated[groupIdx].options = updated[groupIdx].options.filter((_, i) => i !== optIdx);
    setCustomizations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category || !image) {
      alert('Please fill in Name, Price, Category, and Image URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        description,
        price: Number(price),
        category,
        image,
        isAvailable,
        isBestseller,
        isFeatured,
        prepTimeMinutes: Number(prepTimeMinutes),
        dietary: [dietary],
        customizations,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-espresso/10 space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-espresso/10 pb-4">
          <h2 className="font-serif text-2xl font-bold text-espresso">
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-espresso/5">
            <X className="w-5 h-5 text-espresso/60" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-espresso block mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vanilla Cold Brew"
                className="w-full bg-cream/40 border border-espresso/15 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-caramel outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-espresso block mb-1">Base Price (INR ₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-cream/40 border border-espresso/15 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-caramel outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-espresso block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-cream/40 border border-espresso/15 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-caramel outline-none"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-espresso block mb-1">Dietary Tag</label>
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full bg-cream/40 border border-espresso/15 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-caramel outline-none"
              >
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Gluten-Free">Gluten-Free</option>
                <option value="Contains Nuts">Contains Nuts</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-espresso block mb-1">Prep Time (mins)</label>
              <input
                type="number"
                min={1}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full bg-cream/40 border border-espresso/15 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-caramel outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-espresso block mb-1">Description *</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe origin, flavor notes, or baking style..."
              className="w-full bg-cream/40 border border-espresso/15 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-caramel outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-espresso block mb-1">Image URL (Unsplash or CDN) *</label>
            <input
              type="url"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-cream/40 border border-espresso/15 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-caramel outline-none"
            />
            {image && (
              <img
                src={image}
                alt="Preview"
                className="mt-2 w-20 h-20 rounded-xl object-cover border border-espresso/10"
              />
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center space-x-2 text-xs font-bold text-espresso cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="rounded text-caramel focus:ring-caramel"
              />
              <span>In Stock / Available</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-bold text-espresso cursor-pointer">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="rounded text-caramel focus:ring-caramel"
              />
              <span>Bestseller Badge</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-bold text-espresso cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-caramel focus:ring-caramel"
              />
              <span>Feature on Homepage</span>
            </label>
          </div>

          {/* Customization Groups Editor */}
          <div className="pt-4 border-t border-espresso/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-caramel">
                Customization Options (Size, Milk, Syrups)
              </h4>
              <button
                type="button"
                onClick={handleAddGroup}
                className="flex items-center space-x-1 text-xs font-bold text-espresso hover:text-caramel"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Group</span>
              </button>
            </div>

            {customizations.map((group, gIdx) => (
              <div key={gIdx} className="bg-cream/40 rounded-2xl p-4 border border-espresso/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => {
                      const updated = [...customizations];
                      updated[gIdx].name = e.target.value;
                      setCustomizations(updated);
                    }}
                    placeholder="Group Name (e.g. Milk Choice)"
                    className="bg-white border border-espresso/15 rounded-lg px-2.5 py-1 text-xs font-bold text-espresso w-44"
                  />

                  <div className="flex items-center space-x-2">
                    <select
                      value={group.type}
                      onChange={(e) => {
                        const updated = [...customizations];
                        updated[gIdx].type = e.target.value as 'single' | 'multiple';
                        setCustomizations(updated);
                      }}
                      className="bg-white border border-espresso/15 rounded-lg px-2 py-1 text-[11px]"
                    >
                      <option value="single">Single Pick</option>
                      <option value="multiple">Multiple Pick</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(gIdx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Group Options */}
                <div className="space-y-1.5 pl-2">
                  {group.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center space-x-2 text-xs">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const updated = [...customizations];
                          updated[gIdx].options[oIdx].name = e.target.value;
                          setCustomizations(updated);
                        }}
                        placeholder="Option Name (e.g. Oat Milk)"
                        className="bg-white border border-espresso/15 rounded-lg px-2 py-1 text-xs flex-1"
                      />
                      <span className="text-[11px] text-espresso/60">+₹</span>
                      <input
                        type="number"
                        min={0}
                        value={opt.price}
                        onChange={(e) => {
                          const updated = [...customizations];
                          updated[gIdx].options[oIdx].price = Number(e.target.value);
                          setCustomizations(updated);
                        }}
                        placeholder="Extra Price"
                        className="bg-white border border-espresso/15 rounded-lg px-2 py-1 text-xs w-20"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(gIdx, oIdx)}
                        className="text-espresso/40 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddOption(gIdx)}
                    className="text-[11px] text-caramel font-semibold flex items-center space-x-1 pt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Option</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-espresso/10 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-espresso/70 hover:bg-espresso/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-espresso hover:bg-caramel text-cream px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-warm-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
