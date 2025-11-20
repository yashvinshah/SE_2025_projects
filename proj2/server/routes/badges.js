const express = require('express');
const { body, query, validationResult } = require('express-validator');
const {
  updateCustomerBadges,
  getCustomerBadges,
} = require('../services/badgeService');

const router = express.Router();

router.get(
  '/',
  [query('customerId').notEmpty().withMessage('customerId is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customerId } = req.query;
      const badges = await getCustomerBadges(customerId);

      res.json({ badges });
    } catch (error) {
      console.error('Failed to fetch customer badges:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/update',
  [body('customerId').notEmpty().withMessage('customerId is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customerId } = req.body;
      const badges = await updateCustomerBadges(customerId);

      res.json({ badges, message: 'Badges updated successfully' });
    } catch (error) {
      console.error('Failed to update customer badges:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
