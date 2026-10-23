import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, 'Table identifier is required (e.g. T01, T04)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Display name or location is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
      max: 20,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    qrCodeDataUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Table = mongoose.model('Table', tableSchema);
