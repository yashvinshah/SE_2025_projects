const { db } = require('../config/firebase');

class Promo {
  constructor(data) {
    this.id = data.id;
    this.restaurantId = data.restaurantId;
    this.restaurantName = data.restaurantName;
    this.title = data.title;
    this.description = data.description;
    this.discountPercent = data.discountPercent || 0;
    this.code = data.code;
    this.validFrom = data.validFrom || new Date();
    this.validUntil = data.validUntil;
    this.active = data.active !== undefined ? data.active : true;
    this.targetCuisines = data.targetCuisines || []; // Target specific cuisines
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new promo
  static async create(promoData) {
    try {
      const promoRef = db.collection('promos').doc();
      const promoDoc = {
        id: promoRef.id,
        ...promoData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await promoRef.set(promoDoc);
      return new Promo(promoDoc);
    } catch (error) {
      throw new Error(`Failed to create promo: ${error.message}`);
    }
  }

  // Get promo by ID
  static async findById(id) {
    try {
      const promoDoc = await db.collection('promos').doc(id).get();
      if (!promoDoc.exists) {
        return null;
      }
      return new Promo({ id: promoDoc.id, ...promoDoc.data() });
    } catch (error) {
      throw new Error(`Failed to find promo: ${error.message}`);
    }
  }

  // Get all active promos
  static async findAllActive() {
    try {
      const now = new Date();
      const promosSnapshot = await db.collection('promos')
        .where('active', '==', true)
        .get();
      
      // Filter by valid date range
      const activePromos = promosSnapshot.docs
        .map(doc => new Promo({ id: doc.id, ...doc.data() }))
        .filter(promo => {
          const validFrom = promo.validFrom instanceof Date ? promo.validFrom : new Date(promo.validFrom);
          const validUntil = promo.validUntil instanceof Date ? promo.validUntil : new Date(promo.validUntil);
          return validFrom <= now && (!promo.validUntil || validUntil >= now);
        });
      
      return activePromos;
    } catch (error) {
      throw new Error(`Failed to find active promos: ${error.message}`);
    }
  }

  // Get promos for a customer based on their preferences
  static async findForCustomer(customerPreferences) {
    try {
      const activePromos = await Promo.findAllActive();
      
      if (!customerPreferences || !customerPreferences.cuisines) {
        return activePromos;
      }

      // Filter promos based on customer cuisine preferences
      const filteredPromos = activePromos.filter(promo => {
        if (promo.targetCuisines.length === 0) {
          return true; // Show general promos to everyone
        }
        
        return promo.targetCuisines.some(cuisine => 
          customerPreferences.cuisines.includes(cuisine)
        );
      });

      return filteredPromos;
    } catch (error) {
      throw new Error(`Failed to find customer promos: ${error.message}`);
    }
  }

  // Get promos by restaurant ID
  static async findByRestaurantId(restaurantId) {
    try {
      const promosSnapshot = await db.collection('promos')
        .where('restaurantId', '==', restaurantId)
        .where('active', '==', true)
        .get();
      
      return promosSnapshot.docs.map(doc => 
        new Promo({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw new Error(`Failed to find restaurant promos: ${error.message}`);
    }
  }

  // Update promo
  async update(updateData) {
    try {
      const promoRef = db.collection('promos').doc(this.id);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await promoRef.update(updatePayload);
      
      // Update local instance
      Object.assign(this, updatePayload);
      return this;
    } catch (error) {
      throw new Error(`Failed to update promo: ${error.message}`);
    }
  }

  // Deactivate promo
  async deactivate() {
    try {
      const promoRef = db.collection('promos').doc(this.id);
      await promoRef.update({
        active: false,
        updatedAt: new Date()
      });

      this.active = false;
      this.updatedAt = new Date();
      return this;
    } catch (error) {
      throw new Error(`Failed to deactivate promo: ${error.message}`);
    }
  }

  // Delete promo
  async delete() {
    try {
      await db.collection('promos').doc(this.id).delete();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete promo: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      restaurantId: this.restaurantId,
      restaurantName: this.restaurantName,
      title: this.title,
      description: this.description,
      discountPercent: this.discountPercent,
      code: this.code,
      validFrom: this.validFrom,
      validUntil: this.validUntil,
      active: this.active,
      targetCuisines: this.targetCuisines,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Promo;

