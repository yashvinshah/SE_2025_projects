// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// require('dotenv').config();

// const authRoutes = require('./routes/auth');
// const customerRoutes = require('./routes/customer');
// const restaurantRoutes = require('./routes/restaurant');
// const deliveryRoutes = require('./routes/delivery');
// const orderRoutes = require('./routes/orders');
// const { router: pointsRoutes, awardPointsForOrder } = require('./routes/points');
// const { router: questRoutes } = require('./routes/quests');
// const donationRoutes = require('./routes/donations');
// const wishlistRoutes = require('./routes/wishlist');
// const subscriptionRoutes = require('./routes/subscriptions');
// const promoRoutes = require('./routes/promos');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware

// const ratingsRoutes = require('./routes/ratings');
// app.use('/api/ratings', ratingsRoutes);

// // Add this with other app.use statements

// app.use(helmet());
// app.use(morgan('combined'));
// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:3000',
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes

// app.use('/api/auth', authRoutes);
// app.use('/api/customer', customerRoutes);
// app.use('/api/restaurant', restaurantRoutes);
// app.use('/api/delivery', deliveryRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/points', pointsRoutes);
// app.use('/api/quests', questRoutes);
// app.use('/api/donations', donationRoutes);
// app.use('/api/wishlist', wishlistRoutes);
// app.use('/api/subscriptions', subscriptionRoutes);
// app.use('/api/promos', promoRoutes);

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     message: 'Hungry Wolf API is running!',
//     timestamp: new Date().toISOString()
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     error: 'Something went wrong!',
//     message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//   });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// app.listen(PORT, () => {
//   console.log(`🐺 Hungry Wolf server running on port ${PORT}`);
//   console.log(`🌐 API available at http://localhost:${PORT}/api`);
//   console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
// });


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const restaurantRoutes = require('./routes/restaurant');
const deliveryRoutes = require('./routes/delivery');
const orderRoutes = require('./routes/orders');
const { router: pointsRoutes, awardPointsForOrder } = require('./routes/points');
const { router: questRoutes } = require('./routes/quests');
const donationRoutes = require('./routes/donations');
const wishlistRoutes = require('./routes/wishlist');
const subscriptionRoutes = require('./routes/subscriptions');
const promoRoutes = require('./routes/promos');
const ratingsRoutes = require('./routes/ratings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/ratings', ratingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Hungry Wolf API is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🐺 Hungry Wolf server running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;