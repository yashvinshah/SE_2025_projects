const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Wishlist = require('../models/Wishlist');

const router = express.Router();

// Get customer's wishlist
router.get('/:customerId', [
  param('customerId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    const wishlist = await Wishlist.findByCustomerId(customerId);

    res.json({ wishlist: wishlist.toJSON() });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add item to wishlist
router.post('/:customerId/add', [
  param('customerId').isString(),
  body('type').isIn(['restaurant', 'menuItem']),
  body('itemId').isString(),
  body('name').isString(),
  body('details').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    const { type, itemId, name, details } = req.body;

    const wishlist = await Wishlist.findByCustomerId(customerId);
    const updatedWishlist = await wishlist.addItem({ type, itemId, name, details });

    res.json({ 
      message: 'Item added to wishlist',
      wishlist: updatedWishlist.toJSON() 
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove item from wishlist
router.delete('/:customerId/remove', [
  param('customerId').isString(),
  body('itemId').isString(),
  body('type').isIn(['restaurant', 'menuItem'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    const { itemId, type } = req.body;

    const wishlist = await Wishlist.findByCustomerId(customerId);
    const updatedWishlist = await wishlist.removeItem(itemId, type);

    res.json({ 
      message: 'Item removed from wishlist',
      wishlist: updatedWishlist.toJSON() 
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear entire wishlist
router.delete('/:customerId/clear', [
  param('customerId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    const wishlist = await Wishlist.findByCustomerId(customerId);
    const updatedWishlist = await wishlist.clearAll();

    res.json({ 
      message: 'Wishlist cleared',
      wishlist: updatedWishlist.toJSON() 
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

