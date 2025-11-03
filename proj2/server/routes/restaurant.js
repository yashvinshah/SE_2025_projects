const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

const router = express.Router();

// Get restaurant profile (simplified - no auth required for now)
router.get('/profile', async (req, res) => {
  try {
    // For now, return empty profile until we implement proper restaurant identification
    res.json({ 
      user: null,
      restaurant: null
    });
  } catch (error) {
    console.error('Get restaurant profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update restaurant profile by email and password
router.put('/profile', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
  body('restaurant.name').optional().isString(),
  body('restaurant.cuisine').optional().isString(),
  body('restaurant.description').optional().isString(),
  body('restaurant.address').optional().isObject(),
  body('restaurant.phone').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, restaurant: restaurantData } = req.body;
    const user = await User.findByEmail(email);
    
    if (!user || user.password !== password || user.role !== 'restaurant') {
      return res.status(401).json({ error: 'Invalid credentials or not a restaurant' });
    }

    // Get restaurant data for this owner
    const restaurants = await Restaurant.findByOwnerId(user.id);
    let restaurant = restaurants[0];

    if (restaurant) {
      // Update existing restaurant
      restaurant = await restaurant.update(restaurantData);
    } else {
      // Create new restaurant if none exists
      restaurant = await Restaurant.create({
        ...restaurantData,
        ownerId: user.id
      });
    }

    res.json({
      message: 'Restaurant profile updated successfully',
      restaurant: restaurant.toJSON()
    });
  } catch (error) {
    console.error('Update restaurant profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get restaurant menu
router.get('/menu', async (req, res) => {
  try {
    // Get all restaurant users and return the first one's menu
    // In a real app, you'd identify the specific restaurant
    const { db } = require('../config/firebase');
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'restaurant')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return res.json({ menu: [] });
    }
    
    const userData = usersSnapshot.docs[0].data();
    const menu = userData.profile?.menu || [];
    
    res.json({ menu });
  } catch (error) {
    console.error('Get restaurant menu error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update restaurant menu
router.put('/menu', [
  body('menu').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { menu } = req.body;

    // Update the restaurant user's menu in Firebase
    const { db } = require('../config/firebase');
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'restaurant')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Update the user's profile with the new menu
    await userDoc.ref.update({
      'profile.menu': menu,
      updatedAt: new Date()
    });

    res.json({
      message: 'Menu updated successfully',
      menu: menu
    });
  } catch (error) {
    console.error('Update restaurant menu error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new restaurant (for new restaurant owners)
router.post('/create', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
  body('restaurant.name').notEmpty(),
  body('restaurant.cuisine').notEmpty(),
  body('restaurant.description').optional().isString(),
  body('restaurant.address').isObject(),
  body('restaurant.phone').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, restaurant: restaurantData } = req.body;
    const user = await User.findByEmail(email);
    
    if (!user || user.password !== password || user.role !== 'restaurant') {
      return res.status(401).json({ error: 'Invalid credentials or not a restaurant' });
    }

    // Check if restaurant already exists for this owner
    const existingRestaurants = await Restaurant.findByOwnerId(user.id);
    if (existingRestaurants.length > 0) {
      return res.status(400).json({ error: 'Restaurant already exists for this owner' });
    }

    // Create new restaurant
    const restaurant = await Restaurant.create({
      ...restaurantData,
      ownerId: user.id
    });

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant: restaurant.toJSON()
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;