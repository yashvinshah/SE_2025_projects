// Hungry Wolf Business Logic Utilities
// These functions contain the core business logic for the application

// Points Calculation Functions
function calculatePointsForOrder(orderAmount, isLocalLegend = false) {
  // Base: 10% of order amount (as per README)
  const basePoints = Math.floor(orderAmount * 0.10);
  
  // Local Legends: 15% bonus (extra 5%)
  if (isLocalLegend) {
    const bonusPoints = Math.floor(orderAmount * 0.05);
    return basePoints + bonusPoints;
  }
  
  return basePoints;
}

function calculatePointsForReview() {
  return 10; // Fixed 10 points for reviews
}

function calculateDiscountFromPoints(points) {
  // 1 point = $0.01
  return points * 0.01;
}

function calculateOrderTotal(items, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return Math.max(0, subtotal - discount);
}

// Order Status Validation
function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    'pending': ['accepted', 'rejected', 'cancelled'],
    'accepted': ['preparing', 'rejected', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['picked_up', 'cancelled'],
    'picked_up': ['delivered', 'cancelled'],
    'delivered': [], // Terminal state
    'rejected': [], // Terminal state
    'cancelled': [] // Terminal state
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

// User Role Validation
function isValidUserRole(role) {
  return ['customer', 'restaurant', 'delivery'].includes(role);
}

function canPlaceOrder(userRole) {
  return userRole === 'customer';
}

function canManageOrders(userRole) {
  return ['restaurant', 'delivery'].includes(userRole);
}

// Delivery Status Management
function getDefaultDeliveryStatus(role) {
  return role === 'delivery' ? 'free' : null;
}

// Points Validation
function canUsePoints(availablePoints, requestedPoints) {
  return availablePoints >= requestedPoints && requestedPoints > 0;
}

function calculateMaxDiscount(availablePoints) {
  return availablePoints * 0.01;
}

// Order Validation
function isValidOrder(items, totalAmount) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return false;
  }
  
  if (typeof totalAmount !== 'number' || totalAmount <= 0) {
    return false;
  }
  
  // Validate each item
  for (const item of items) {
    if (!item.menuItemId || !item.quantity || !item.price) {
      return false;
    }
    if (item.quantity <= 0 || item.price <= 0) {
      return false;
    }
  }
  
  return true;
}

// Restaurant Validation
function isLocalLegend(restaurant) {
  return restaurant.isLocalLegend === true;
}

function calculateDeliveryTime(restaurant) {
  return restaurant.deliveryTime || '30-45 min';
}

// Rating Validation
function isValidRating(rating) {
  return typeof rating === 'number' && rating >= 1 && rating <= 5;
}

// Export all functions
module.exports = {
  calculatePointsForOrder,
  calculatePointsForReview,
  calculateDiscountFromPoints,
  calculateOrderTotal,
  isValidStatusTransition,
  isValidUserRole,
  canPlaceOrder,
  canManageOrders,
  getDefaultDeliveryStatus,
  canUsePoints,
  calculateMaxDiscount,
  isValidOrder,
  isLocalLegend,
  calculateDeliveryTime,
  isValidRating
};

