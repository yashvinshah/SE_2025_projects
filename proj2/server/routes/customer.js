const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

const router = express.Router();

// Get customer profile by email and password
router.post('/profile', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    
    if (!user || user.password !== password || user.role !== 'customer') {
      return res.status(401).json({ error: 'Invalid credentials or not a customer' });
    }

    res.json({ customer: user.toJSON() });
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update customer profile by email and password
router.put('/profile', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
  body('profile.name').optional().isString(),
  body('profile.phone').optional().isString(),
  body('profile.address').optional().isObject(),
  body('profile.preferences').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, profile } = req.body;
    const user = await User.findByEmail(email);
    
    if (!user || user.password !== password || user.role !== 'customer') {
      return res.status(401).json({ error: 'Invalid credentials or not a customer' });
    }

    const updatedUser = await user.update({ profile });

    res.json({
      message: 'Profile updated successfully',
      customer: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all restaurants
router.get('/restaurants', async (req, res) => {
  try {
    console.log('Fetching restaurants from users collection...');
    
    // Get all users with role 'restaurant'
    const { db } = require('../config/firebase');
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'restaurant')
      .get();
    
    const restaurants = [];
    
    // Process each restaurant
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (userData.profile && userData.profile.name) {
        // Calculate average rating from customer ratings
        let averageRating = 0;
        try {
          const ordersSnapshot = await db.collection('orders')
            .where('restaurantId', '==', doc.id)
            .where('status', '==', 'delivered')
            .get();
          
          let totalRating = 0;
          let ratingCount = 0;
          
          ordersSnapshot.forEach(orderDoc => {
            const orderData = orderDoc.data();
            if (orderData.ratings && orderData.ratings.customer && orderData.ratings.customer.rating) {
              totalRating += orderData.ratings.customer.rating;
              ratingCount++;
            }
          });
          
          if (ratingCount > 0) {
            averageRating = Math.round((totalRating / ratingCount) * 10) / 10; // Round to 1 decimal place
          }
        } catch (ratingError) {
          console.error('Error calculating rating for restaurant', doc.id, ratingError);
        }
        
        // Convert user data to restaurant format
        const restaurant = {
          id: doc.id,
          name: userData.profile.name,
          cuisine: userData.profile.cuisine || 'Unknown',
          description: userData.profile.description || '',
          rating: averageRating || userData.profile.rating || 0,
          deliveryTime: userData.profile.deliveryTime || '30-45 min',
          isLocalLegend: userData.profile.isLocalLegend || false,
          menu: userData.profile.menu || [],
          address: userData.profile.address || {},
          phone: userData.profile.phone || '',
          email: userData.email,
          isActive: true,
          ownerId: doc.id
        };
        restaurants.push(restaurant);
      }
    }
    
    console.log('Found restaurants:', restaurants.length);
    res.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch restaurants.',
      details: error.message 
    });
  }
});

module.exports = router;
