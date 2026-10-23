import express from 'express';
import {
  getPublicMenu,
  getAdminMenu,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
} from '../controllers/menuController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public menu route
router.get('/', getPublicMenu);

// Admin menu routes (Protected)
router.get('/admin', requireAuth, getAdminMenu);
router.post('/', requireAuth, createMenuItem);
router.put('/:id', requireAuth, updateMenuItem);
router.patch('/:id/toggle-availability', requireAuth, toggleAvailability);
router.delete('/:id', requireAuth, deleteMenuItem);

export default router;
