import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';

// Public menu with active categories and available items
export const getPublicMenu = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    const items = await MenuItem.find({ isAvailable: true }).sort({ category: 1, name: 1 });

    return res.json({
      success: true,
      categories,
      items,
    });
  } catch (error) {
    console.error('[Menu Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin menu showing all items (including out of stock)
export const getAdminMenu = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    const items = await MenuItem.find().sort({ category: 1, name: 1 });

    return res.json({
      success: true,
      categories,
      items,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new menu item
export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      isAvailable = true,
      isBestseller = false,
      isFeatured = false,
      dietary = ['Vegetarian'],
      prepTimeMinutes = 5,
      customizations = [],
    } = req.body;

    if (!name || !price || !category || !image) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, category, and image are required.',
      });
    }

    const newItem = await MenuItem.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      category: category.trim(),
      image: image.trim(),
      isAvailable: Boolean(isAvailable),
      isBestseller: Boolean(isBestseller),
      isFeatured: Boolean(isFeatured),
      dietary: Array.isArray(dietary) ? dietary : [dietary],
      prepTimeMinutes: Number(prepTimeMinutes) || 5,
      customizations,
    });

    return res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item: newItem,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await MenuItem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    return res.json({
      success: true,
      message: 'Menu item updated',
      item,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle product availability (Sold out / Available)
export const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findById(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    return res.json({
      success: true,
      message: `Item is now ${item.isAvailable ? 'available' : 'marked sold out'}`,
      item,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    return res.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
