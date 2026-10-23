import mongoose from 'mongoose';

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0, min: 0 },
});

const customizationGroupSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Size", "Milk Choice", "Extra Shot"
  type: { type: String, enum: ['single', 'multiple'], default: 'single' },
  required: { type: Boolean, default: false },
  options: [customizationOptionSchema],
});

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Base price in INR is required'],
      min: [0, 'Price must be positive'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Product image URL is required'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    dietary: {
      type: [String],
      default: ['Vegetarian'],
    },
    prepTimeMinutes: {
      type: Number,
      default: 5,
    },
    customizations: [customizationGroupSchema],
  },
  {
    timestamps: true,
  }
);

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
