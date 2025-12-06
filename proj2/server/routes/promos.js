const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Promo = require('../models/Promo');
const User = require('../models/User');

const router = express.Router();

// Get all active promos
router.get('/active', async (req, res) => {
  try {
    const promos = await Promo.findAllActive();

    res.json({ 
      promos: promos.map(promo => promo.toJSON()),
      count: promos.length
    });
  } catch (error) {
    console.error('Get active promos error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get personalized promos for a customer
router.get('/customer/:customerId', [
  param('customerId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    
    // Get customer preferences
    const customer = await User.findById(customerId);
    const preferences = customer ? customer.profile?.preferences : null;

    const promos = await Promo.findForCustomer(preferences);

    res.json({ 
      promos: promos.map(promo => promo.toJSON()),
      count: promos.length
    });
  } catch (error) {
    console.error('Get customer promos error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get promos for a specific restaurant
router.get('/restaurant/:restaurantId', [
  param('restaurantId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { restaurantId } = req.params;
    const promos = await Promo.findByRestaurantId(restaurantId);

    res.json({ 
      promos: promos.map(promo => promo.toJSON()),
      count: promos.length
    });
  } catch (error) {
    console.error('Get restaurant promos error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new promo (restaurant only)
router.post('/', [
  body('restaurantId').isString(),
  body('restaurantName').isString(),
  body('title').isString().isLength({ min: 3, max: 100 }),
  body('description').isString().isLength({ min: 10, max: 500 }),
  body('discountPercent').isFloat({ min: 0, max: 100 }),
  body('code').isString().isLength({ min: 3, max: 20 }),
  body('validFrom').optional().isISO8601(),
  body('validUntil').isISO8601(),
  body('targetCuisines').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const promoData = req.body;
    const promo = await Promo.create(promoData);

    res.status(201).json({ 
      message: 'Promo created successfully',
      promo: promo.toJSON() 
    });
  } catch (error) {
    console.error('Create promo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update promo
router.put('/:promoId', [
  param('promoId').isString(),
  body('title').optional().isString(),
  body('description').optional().isString(),
  body('discountPercent').optional().isFloat({ min: 0, max: 100 }),
  body('validUntil').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { promoId } = req.params;
    const updateData = req.body;

    const promo = await Promo.findById(promoId);
    
    if (!promo) {
      return res.status(404).json({ error: 'Promo not found' });
    }

    const updatedPromo = await promo.update(updateData);

    res.json({ 
      message: 'Promo updated successfully',
      promo: updatedPromo.toJSON() 
    });
  } catch (error) {
    console.error('Update promo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deactivate promo
router.patch('/:promoId/deactivate', [
  param('promoId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { promoId } = req.params;
    const promo = await Promo.findById(promoId);
    
    if (!promo) {
      return res.status(404).json({ error: 'Promo not found' });
    }

    await promo.deactivate();

    res.json({ message: 'Promo deactivated successfully' });
  } catch (error) {
    console.error('Deactivate promo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete promo
router.delete('/:promoId', [
  param('promoId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { promoId } = req.params;
    const promo = await Promo.findById(promoId);
    
    if (!promo) {
      return res.status(404).json({ error: 'Promo not found' });
    }

    await promo.delete();

    res.json({ message: 'Promo deleted successfully' });
  } catch (error) {
    console.error('Delete promo error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

