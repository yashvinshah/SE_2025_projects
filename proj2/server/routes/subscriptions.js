const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Subscription = require('../models/Subscription');

const router = express.Router();

// Get customer's subscription
router.get('/:customerId', [
  param('customerId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    const subscription = await Subscription.findByCustomerId(customerId);

    if (!subscription) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: subscription.toJSON() });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new subscription
router.post('/', [
  body('customerId').isString(),
  body('planType').isIn(['weekly', 'biweekly', 'monthly']),
  body('preferences').optional().isObject(),
  body('promoAlerts').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, planType, preferences, promoAlerts } = req.body;

    // Calculate next delivery date based on plan type
    const nextDeliveryDate = new Date();
    switch(planType) {
      case 'weekly':
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 14);
        break;
      case 'monthly':
        nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
        break;
    }

    const subscription = await Subscription.create({
      customerId,
      planType,
      preferences: preferences || {},
      promoAlerts: promoAlerts !== undefined ? promoAlerts : true,
      nextDeliveryDate,
      active: true
    });

    res.status(201).json({ 
      message: 'Subscription created successfully',
      subscription: subscription.toJSON() 
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update subscription preferences
router.put('/:customerId', [
  param('customerId').isString(),
  body('planType').optional().isIn(['weekly', 'biweekly', 'monthly']),
  body('preferences').optional().isObject(),
  body('promoAlerts').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    const updateData = req.body;

    const subscription = await Subscription.findByCustomerId(customerId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Update next delivery date if plan type changes
    if (updateData.planType && updateData.planType !== subscription.planType) {
      const nextDeliveryDate = new Date();
      switch(updateData.planType) {
        case 'weekly':
          nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 14);
          break;
        case 'monthly':
          nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
          break;
      }
      updateData.nextDeliveryDate = nextDeliveryDate;
    }

    const updatedSubscription = await subscription.update(updateData);

    res.json({ 
      message: 'Subscription updated successfully',
      subscription: updatedSubscription.toJSON() 
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update meal plan
router.put('/:customerId/meal-plan', [
  param('customerId').isString(),
  body('mealPlan').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    const { mealPlan } = req.body;

    const subscription = await Subscription.findByCustomerId(customerId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updatedSubscription = await subscription.updateMealPlan(mealPlan);

    res.json({ 
      message: 'Meal plan updated successfully',
      subscription: updatedSubscription.toJSON() 
    });
  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle subscription active status
router.patch('/:customerId/toggle', [
  param('customerId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    const subscription = await Subscription.findByCustomerId(customerId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updatedSubscription = await subscription.toggleActive();

    res.json({ 
      message: `Subscription ${updatedSubscription.active ? 'activated' : 'deactivated'}`,
      subscription: updatedSubscription.toJSON() 
    });
  } catch (error) {
    console.error('Toggle subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete subscription
router.delete('/:customerId', [
  param('customerId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.params;
    const subscription = await Subscription.findByCustomerId(customerId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await subscription.delete();

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all active subscriptions (admin only)
router.get('/admin/all-active', async (req, res) => {
  try {
    const subscriptions = await Subscription.findAllActive();

    res.json({ 
      subscriptions: subscriptions.map(sub => sub.toJSON()),
      count: subscriptions.length
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

