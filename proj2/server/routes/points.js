const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');

const router = express.Router();

// Get user points
router.get('/', async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }

    // Get or create points document for customer
    const pointsRef = db.collection('points').doc(customerId);
    const pointsDoc = await pointsRef.get();
    
    let pointsData;
    if (pointsDoc.exists) {
      pointsData = pointsDoc.data();
    } else {
      // Create new points document
      pointsData = {
        totalPoints: 0,
        availablePoints: 0,
        usedPoints: 0,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await pointsRef.set(pointsData);
    }

    res.json({ points: pointsData });
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get points transactions
router.get('/transactions', async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }

    const pointsRef = db.collection('points').doc(customerId);
    const pointsDoc = await pointsRef.get();
    
    if (!pointsDoc.exists) {
      return res.json({ transactions: [] });
    }

    const pointsData = pointsDoc.data();
    res.json({ transactions: pointsData.transactions || [] });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use points for discount
router.post('/use', [
  body('points').isInt({ min: 1 }),
  body('description').optional().isString(),
  body('customerId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { points, description, customerId } = req.body;
    
    // Get customer points
    const pointsRef = db.collection('points').doc(customerId);
    const pointsDoc = await pointsRef.get();
    
    if (!pointsDoc.exists) {
      return res.status(404).json({ error: 'Points account not found' });
    }
    
    const pointsData = pointsDoc.data();
    
    // Check if customer has enough points
    if (pointsData.availablePoints < points) {
      return res.status(400).json({ 
        error: 'Insufficient points available',
        availablePoints: pointsData.availablePoints,
        requestedPoints: points
      });
    }
    
    // Calculate discount (1 point = $0.01)
    const discountAmount = points * 0.01;
    
    // Update points
    const newAvailablePoints = pointsData.availablePoints - points;
    const newUsedPoints = pointsData.usedPoints + points;
    
    // Add transaction
    const transaction = {
      id: Date.now().toString(),
      type: 'used',
      amount: -points,
      description: description || `Points redeemed - $${discountAmount.toFixed(2)} discount`,
      date: new Date()
    };
    
    const updatedTransactions = [transaction, ...pointsData.transactions];
    
    // Keep only last 50 transactions
    if (updatedTransactions.length > 50) {
      updatedTransactions.splice(50);
    }
    
    await pointsRef.update({
      availablePoints: newAvailablePoints,
      usedPoints: newUsedPoints,
      transactions: updatedTransactions,
      updatedAt: new Date()
    });
    
    res.json({
      message: 'Points used successfully',
      pointsUsed: points,
      discountAmount: discountAmount,
      remainingPoints: newAvailablePoints
    });
  } catch (error) {
    console.error('Use points error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Calculate discount
router.post('/calculate-discount', [
  body('points').isInt({ min: 1 }),
  body('customerId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { points, customerId } = req.body;
    
    // Get customer points
    const pointsRef = db.collection('points').doc(customerId);
    const pointsDoc = await pointsRef.get();
    
    if (!pointsDoc.exists) {
      return res.status(404).json({ error: 'Points account not found' });
    }
    
    const pointsData = pointsDoc.data();
    
    // Check if customer has enough points
    if (pointsData.availablePoints < points) {
      return res.status(400).json({ 
        error: 'Insufficient points available',
        availablePoints: pointsData.availablePoints,
        requestedPoints: points
      });
    }
    
    // Calculate discount (1 point = $0.01)
    const discountAmount = points * 0.01;
    
    res.json({
      discountAmount: discountAmount,
      maxDiscount: pointsData.availablePoints * 0.01,
      availablePoints: pointsData.availablePoints
    });
  } catch (error) {
    console.error('Calculate discount error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Award points for completed order
async function awardPointsForOrder(customerId, orderAmount) {
  try {
    const pointsRef = db.collection('points').doc(customerId);
    const pointsDoc = await pointsRef.get();
    
    // Calculate points (1 point per dollar spent)
    const pointsEarned = Math.floor(orderAmount);
    
    let pointsData;
    if (pointsDoc.exists) {
      pointsData = pointsDoc.data();
    } else {
      pointsData = {
        totalPoints: 0,
        availablePoints: 0,
        usedPoints: 0,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // Update points
    pointsData.totalPoints += pointsEarned;
    pointsData.availablePoints += pointsEarned;
    pointsData.updatedAt = new Date();
    
    // Add transaction
    const transaction = {
      id: Date.now().toString(),
      type: 'earned',
      amount: pointsEarned,
      description: `Order completed - $${orderAmount.toFixed(2)}`,
      date: new Date()
    };
    pointsData.transactions.unshift(transaction);
    
    // Keep only last 50 transactions
    if (pointsData.transactions.length > 50) {
      pointsData.transactions = pointsData.transactions.slice(0, 50);
    }
    
    await pointsRef.set(pointsData);
    console.log(`Awarded ${pointsEarned} points to customer ${customerId}`);
    
  } catch (error) {
    console.error('Error awarding points:', error);
  }
}

module.exports = { router, awardPointsForOrder };