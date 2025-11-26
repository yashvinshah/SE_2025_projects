const { db } = require('../config/firebase');

class Rating {

  // Helper: extract numeric rating from variety of shapes
  static _extractCustomerRating(orderData) {
    if (!orderData.ratings) return null;

    // new shape: ratings.customer.rating
    const rCustomer = orderData.ratings.customer;
    if (rCustomer && typeof rCustomer.rating === 'number') return rCustomer.rating;

    // older alternate shape: ratings.customer.restaurant
    if (rCustomer && typeof rCustomer.restaurant === 'number') return rCustomer.restaurant;

    // flat shapes sometimes used: ratings.rating or rating
    if (typeof orderData.ratings.rating === 'number') return orderData.ratings.rating;
    if (typeof orderData.rating === 'number') return orderData.rating;

    return null;
  }

  // Attempt to resolve restaurant document ids:
  // if passedId matches orders.restaurantId, great. Otherwise if passedId is an owner id,
  // find restaurants where ownerId == passedId and return an array of their ids.
  static async _resolveRestaurantIds(passedId) {
    // If passedId is falsy, return empty
    if (!passedId) return [];

    // Quick optimization: check if any orders exist with restaurantId == passedId
    const ordersCheck = await db.collection('orders')
      .where('restaurantId', '==', passedId)
      .limit(1)
      .get();

    if (!ordersCheck.empty) {
      return [passedId];
    }

    // Fallback: maybe passedId is ownerId — find restaurant docs owned by this user
    const restaurantsSnapshot = await db.collection('restaurants')
      .where('ownerId', '==', passedId)
      .get();

    if (!restaurantsSnapshot.empty) {
      const ids = restaurantsSnapshot.docs.map(d => d.id);
      return ids;
    }

    // No restaurants found — return passedId as last resort (keeps current behavior)
    return [passedId];
  }

  // Calculate and update restaurant's average rating
  static async updateRestaurantRating(restaurantId) {
    try {
      const restaurantIds = await Rating._resolveRestaurantIds(restaurantId);

      // If we have multiple restaurant ids use 'in' query (Firestore limit 10)
      let ordersQuery = db.collection('orders').where('ratings', '!=', null);
      if (restaurantIds.length === 1) {
        ordersQuery = db.collection('orders').where('restaurantId', '==', restaurantIds[0]);
      } else if (restaurantIds.length > 1) {
        // use 'in' with a slice if >10 (unlikely)
        const batches = [];
        for (let i = 0; i < restaurantIds.length; i += 10) {
          batches.push(restaurantIds.slice(i, i + 10));
        }

        let totalRating = 0;
        let ratingCount = 0;

        for (const batch of batches) {
          const snap = await db.collection('orders')
            .where('restaurantId', 'in', batch)
            .get();

          snap.forEach(doc => {
            const od = doc.data();
            const ratingVal = Rating._extractCustomerRating(od);
            if (ratingVal != null) {
              totalRating += ratingVal;
              ratingCount++;
            }
          });
        }

        const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

        // Update restaurant record(s) — if multiple restaurantIds, update each
        const updatePromises = restaurantIds.map(id =>
          db.collection('restaurants').doc(id).update({
            rating: parseFloat(averageRating),
            totalRatings: ratingCount,
            updatedAt: new Date()
          })
        );

        await Promise.all(updatePromises);

        return {
          averageRating: parseFloat(averageRating),
          totalRatings: ratingCount
        };
      } else {
        // no ids found
        return { averageRating: 0, totalRatings: 0 };
      }

      // If we reach here, restaurantIds.length === 1 and ordersQuery built above
      const ordersSnapshot = await ordersQuery.get();

      if (ordersSnapshot.empty) {
        // Update the restaurant doc with zeros
        await db.collection('restaurants').doc(restaurantIds[0]).update({
          rating: 0,
          totalRatings: 0,
          updatedAt: new Date()
        }).catch(() => {}); // ignore if doc missing

        return { averageRating: 0, totalRatings: 0 };
      }

      let totalRating = 0;
      let ratingCount = 0;

      ordersSnapshot.forEach(doc => {
        const orderData = doc.data();
        const ratingVal = Rating._extractCustomerRating(orderData);
        if (ratingVal != null) {
          totalRating += ratingVal;
          ratingCount++;
        }
      });

      const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

      // Update restaurant record with new average rating
      await db.collection('restaurants')
        .doc(restaurantIds[0])
        .update({
          rating: parseFloat(averageRating),
          totalRatings: ratingCount,
          updatedAt: new Date()
        }).catch(() => {});

      return {
        averageRating: parseFloat(averageRating),
        totalRatings: ratingCount
      };

    } catch (error) {
      console.error('Error updating restaurant rating:', error);
      throw new Error(`Failed to update restaurant rating: ${error.message}`);
    }
  }

  // Fetch list of ratings for a restaurant (with fallback)
  static async getRestaurantRatings(restaurantId) {
    try {
      const restaurantIds = await Rating._resolveRestaurantIds(restaurantId);

      // Build queries (handle multiple restaurants)
      if (restaurantIds.length > 1) {
        // batch 'in' queries if needed
        const batches = [];
        for (let i = 0; i < restaurantIds.length; i += 10) {
          batches.push(restaurantIds.slice(i, i + 10));
        }

        const allRatings = [];
        for (const batch of batches) {
          const snap = await db.collection('orders')
            .where('restaurantId', 'in', batch)
            .orderBy('createdAt', 'desc')
            .get();

          snap.forEach(doc => {
            const od = doc.data();
            const ratingVal = Rating._extractCustomerRating(od);
            const ratedAt = od.ratings?.customer?.ratedAt || od.ratings?.ratedAt || od.ratedAt || null;
            if (ratingVal != null) {
              allRatings.push({
                orderId: doc.id,
                customerId: od.customerId,
                rating: ratingVal,
                review: od.ratings?.customer?.review || od.ratings?.review || '',
                ratedAt
              });
            }
          });
        }
        return allRatings;
      }

      // single restaurant id
      const ordersSnapshot = await db.collection('orders')
        .where('restaurantId', '==', restaurantIds[0])
        .orderBy('createdAt', 'desc')
        .get();

      const ratings = [];

      ordersSnapshot.forEach(doc => {
        const orderData = doc.data();

        const ratingVal = Rating._extractCustomerRating(orderData);
        const ratedAt = orderData.ratings?.customer?.ratedAt || orderData.ratings?.ratedAt || orderData.ratedAt || null;

        if (ratingVal != null) {
          ratings.push({
            orderId: doc.id,
            customerId: orderData.customerId,
            rating: ratingVal,
            review: orderData.ratings?.customer?.review || orderData.ratings?.review || '',
            ratedAt
          });
        }
      });

      return ratings;

    } catch (error) {
      console.error('Error fetching restaurant ratings:', error);
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }
  }

  // Get rating statistics for a restaurant (with fallback)
  static async getRestaurantRatingStats(restaurantId) {
    try {
      const restaurantIds = await Rating._resolveRestaurantIds(restaurantId);

      if (restaurantIds.length > 1) {
        // batch processing for multiple rest ids
        let totalRating = 0;
        let ratingCount = 0;
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        const batches = [];
        for (let i = 0; i < restaurantIds.length; i += 10) {
          batches.push(restaurantIds.slice(i, i + 10));
        }

        for (const batch of batches) {
          const snap = await db.collection('orders')
            .where('restaurantId', 'in', batch)
            .get();

          snap.forEach(doc => {
            const od = doc.data();
            const val = Rating._extractCustomerRating(od);
            if (val != null) {
              totalRating += val;
              ratingCount++;
              if (ratingDistribution[val] !== undefined) ratingDistribution[val]++;
            }
          });
        }

        const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;
        return {
          averageRating: parseFloat(averageRating),
          totalRatings: ratingCount,
          ratingDistribution
        };
      }

      // single restaurant id
      const ordersSnapshot = await db.collection('orders')
        .where('restaurantId', '==', restaurantIds[0])
        .get();

      if (ordersSnapshot.empty) {
        return {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      let totalRating = 0;
      let ratingCount = 0;
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      ordersSnapshot.forEach(doc => {
        const orderData = doc.data();
        const rating = Rating._extractCustomerRating(orderData);
        if (rating != null) {
          totalRating += rating;
          ratingCount++;
          if (ratingDistribution[rating] !== undefined) ratingDistribution[rating]++;
        }
      });

      const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

      return {
        averageRating: parseFloat(averageRating),
        totalRatings: ratingCount,
        ratingDistribution
      };

    } catch (error) {
      console.error('Error fetching rating stats:', error);
      throw new Error(`Failed to fetch rating stats: ${error.message}`);
    }
  }
}

module.exports = Rating;
