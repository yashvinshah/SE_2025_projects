const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// Get all ratings for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const ratings = await Rating.getRestaurantRatings(restaurantId);

    res.json({
      ratings,
      count: ratings.length
    });
  } catch (error) {
    console.error('Error fetching restaurant ratings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get rating statistics for a restaurant
router.get('/restaurant/:restaurantId/stats', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const stats = await Rating.getRestaurantRatingStats(restaurantId);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Force recalculate restaurant rating (admin/maintenance endpoint)
router.post('/restaurant/:restaurantId/recalculate', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const result = await Rating.updateRestaurantRating(restaurantId);

    res.json({
      message: 'Restaurant rating recalculated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error recalculating rating:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;