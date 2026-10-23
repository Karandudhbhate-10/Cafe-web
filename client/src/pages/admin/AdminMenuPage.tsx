import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { MenuItemFormModal } from '../../components/admin/MenuItemFormModal';
import { api } from '../../services/api';
import { MenuItem, Category } from '../../types';

export const AdminMenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  const loadMenu = async () => {
    try {
      const data = await api.getAdminMenu();
      setItems(data.items || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    if (searchParams.get('openAdd') === 'true') {
      setEditingItem(null);
      setIsModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleToggleAvailability = async (id: string) => {
    try {
      const updated = await api.toggleItemAvailability(id);
      setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  const handleSaveItem = async (formData: Partial<MenuItem>) => {
    if (editingItem) {
      const updated = await api.updateMenuItem(editingItem._id, formData);
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    } else {
      const created = await api.createMenuItem(formData);
      setItems((prev) => [created, ...prev]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await api.deleteMenuItem(deletingItem._id);
      setItems((prev) => prev.filter((i) => i._id !== deletingItem._id));
      setDeletingItem(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete menu item');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        search === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [items, selectedCategory, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F2E6] via-[#FAF6F0] to-[#F5EEDB] flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Menu Catalog Management"
          subtitle="Add, edit prices, update customizations, or toggle sold out status"
          showAddItemButton={false}
          rightAction={
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              type="button"
              className="bg-caramel hover:bg-caramel-dark text-espresso px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span> Add New Item</span>
            </button>
          }
        />

        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-espresso/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-espresso/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by title or description..."
                className="w-full bg-cream/30 border border-espresso/10 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === 'all'
                    ? 'bg-espresso text-cream'
                    : 'bg-cream/50 text-espresso/70 hover:bg-cream'
                  }`}
              >
                All ({items.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCategory(c.name)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === c.name
                      ? 'bg-espresso text-cream'
                      : 'bg-cream/50 text-espresso/70 hover:bg-cream'
                    }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-3xl border border-espresso/10 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream/50 text-espresso/70 uppercase text-[10px] tracking-wider border-b border-espresso/10">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Product</th>
                    <th className="py-3.5 px-4 font-bold">Category</th>
                    <th className="py-3.5 px-4 font-bold">Price (INR)</th>
                    <th className="py-3.5 px-4 font-bold">Customizations</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/5 font-medium text-espresso">
                  {filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-cream/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-espresso/10"
                          />
                          <div>
                            <div className="font-bold text-espresso text-sm flex items-center space-x-1.5">
                              <span>{item.name}</span>
                              {item.isBestseller && (
                                <span className="bg-caramel/15 text-caramel-dark text-[10px] px-1.5 py-0.2 rounded font-semibold">
                                  Bestseller
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-espresso/60 line-clamp-1 max-w-xs">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="bg-espresso/5 text-espresso px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-serif font-bold text-sm text-espresso">
                          ₹{item.price}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-espresso/70">
                          {item.customizations && item.customizations.length > 0
                            ? item.customizations.map((c) => c.name).join(', ')
                            : 'None'}
                        </span>
                      </td>

                      {/* 1-click availability toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAvailability(item._id)}
                          type="button"
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${item.isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                        >
                          {item.isAvailable ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>In Stock</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Sold Out</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Edit / Delete */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            type="button"
                            className="p-1.5 text-espresso/70 hover:text-espresso hover:bg-espresso/5 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            type="button"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
      <MenuItemFormModal
        isOpen={isModalOpen}
        item={editingItem}
        categories={categories}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-red-100 text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-bold text-espresso">
                  Delete "{deletingItem.name}"?
                </h3>
                <p className="text-xs text-espresso/70 mt-1">
                  This product will be permanently removed from the customer menu.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso/70 hover:bg-espresso/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
