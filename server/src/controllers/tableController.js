import { Table } from '../models/Table.js';
import { Config } from '../models/Config.js';
import {
  generateTableQRDataUrl,
  generateMasterQRDataUrl,
  getEffectiveBaseUrl,
  getLocalNetworkIP,
} from '../utils/qrHelper.js';

// Get all tables (admin view or active list)
export const getAllTables = async (req, res) => {
  try {
    const baseUrl = await getEffectiveBaseUrl();
    const localIp = getLocalNetworkIP();
    const localNetworkBaseUrl = `http://${localIp}:5173`;
    const tables = await Table.find().sort({ tableNumber: 1 });

    // Generate Master Cafe QR code (Single QR for entire cafe)
    const masterQr = await generateMasterQRDataUrl(baseUrl);

    return res.json({
      success: true,
      baseUrl,
      localIp,
      localNetworkBaseUrl,
      masterQr,
      count: tables.length,
      tables,
    });
  } catch (error) {
    console.error('[Table Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Validate a specific table for customer QR scans or manual entry
export const validateTable = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    if (!tableNumber) {
      return res.status(400).json({ success: false, message: 'Table number is required' });
    }

    const cleanInput = tableNumber.trim();
    const normalized = cleanInput.toUpperCase();
    const digitsOnly = cleanInput.replace(/\D/g, '');

    // Search flexible match: exact, with 'T' prefix, padded 'T0X', or regex
    let table = await Table.findOne({
      $or: [
        { tableNumber: normalized },
        ...(digitsOnly
          ? [
              { tableNumber: `T${digitsOnly.padStart(2, '0')}` },
              { tableNumber: `T${digitsOnly}` },
              { tableNumber: digitsOnly },
            ]
          : []),
        { name: new RegExp(`^${cleanInput}$`, 'i') },
      ],
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: `Table "${tableNumber}" was not found. Please ask café staff.`,
      });
    }

    if (!table.isActive) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Table "${table.tableNumber}" is currently marked inactive. Please ask staff.`,
      });
    }

    return res.json({
      success: true,
      valid: true,
      table: {
        tableNumber: table.tableNumber,
        name: table.name,
        capacity: table.capacity,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new table
export const createTable = async (req, res) => {
  try {
    const { tableNumber, name, capacity, notes } = req.body;

    if (!tableNumber || !name) {
      return res.status(400).json({
        success: false,
        message: 'Table identifier (e.g. T05) and name are required',
      });
    }

    const normalizedId = tableNumber.trim().toUpperCase();
    const existing = await Table.findOne({ tableNumber: normalizedId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Table "${normalizedId}" already exists.`,
      });
    }

    const newTable = await Table.create({
      tableNumber: normalizedId,
      name: name.trim(),
      capacity: capacity || 4,
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Table created successfully',
      table: newTable,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing table
export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber, name, capacity, isActive, notes } = req.body;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    if (tableNumber && tableNumber.trim().toUpperCase() !== table.tableNumber) {
      const normalizedId = tableNumber.trim().toUpperCase();
      const existing = await Table.findOne({
        tableNumber: normalizedId,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Table "${normalizedId}" already exists.`,
        });
      }
      table.tableNumber = normalizedId;
    }

    if (name) table.name = name.trim();
    if (capacity !== undefined) table.capacity = capacity;
    if (isActive !== undefined) table.isActive = isActive;
    if (notes !== undefined) table.notes = notes;

    await table.save();

    return res.json({
      success: true,
      message: 'Table updated successfully',
      table,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a table
export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByIdAndDelete(id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    return res.json({ success: true, message: 'Table removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Base URL and refresh Master Cafe QR Stand
export const updateBaseUrlAndRegenerateAll = async (req, res) => {
  try {
    const { baseUrl } = req.body;
    if (!baseUrl) {
      return res.status(400).json({ success: false, message: 'Base URL is required' });
    }

    const cleanedBaseUrl = baseUrl.trim().replace(/\/$/, '');

    await Config.findOneAndUpdate(
      { key: 'qr_base_url' },
      { key: 'qr_base_url', value: cleanedBaseUrl },
      { upsert: true, new: true }
    );

    const masterQr = await generateMasterQRDataUrl(cleanedBaseUrl);

    return res.json({
      success: true,
      message: `Updated Base URL to ${cleanedBaseUrl} and refreshed the Single Master Café QR.`,
      baseUrl: cleanedBaseUrl,
      masterQr,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
