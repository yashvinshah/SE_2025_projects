const { db } = require('../config/firebase');

class Wishlist {
  constructor(data) {
    this.id = data.id;
    this.customerId = data.customerId;
    this.items = data.items || []; // Array of { type: 'restaurant'|'menuItem', itemId, name, details }
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new wishlist entry
  static async create(wishlistData) {
    try {
      const wishlistRef = db.collection('wishlists').doc();
      const wishlistDoc = {
        id: wishlistRef.id,
        ...wishlistData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await wishlistRef.set(wishlistDoc);
      return new Wishlist(wishlistDoc);
    } catch (error) {
      throw new Error(`Failed to create wishlist: ${error.message}`);
    }
  }

  // Get wishlist by customer ID
  static async findByCustomerId(customerId) {
    try {
      const wishlistSnapshot = await db.collection('wishlists')
        .where('customerId', '==', customerId)
        .limit(1)
        .get();
      
      if (wishlistSnapshot.empty) {
        // Create a new wishlist if none exists
        return await Wishlist.create({ customerId, items: [] });
      }
      
      const wishlistDoc = wishlistSnapshot.docs[0];
      return new Wishlist({ id: wishlistDoc.id, ...wishlistDoc.data() });
    } catch (error) {
      throw new Error(`Failed to find wishlist: ${error.message}`);
    }
  }

  // Add item to wishlist
  async addItem(item) {
    try {
      // Check if item already exists
      const existingItem = this.items.find(i => 
        i.itemId === item.itemId && i.type === item.type
      );
      
      if (existingItem) {
        return this; // Item already in wishlist
      }

      const updatedItems = [...this.items, {
        ...item,
        addedAt: new Date()
      }];

      const wishlistRef = db.collection('wishlists').doc(this.id);
      await wishlistRef.update({
        items: updatedItems,
        updatedAt: new Date()
      });

      this.items = updatedItems;
      this.updatedAt = new Date();
      return this;
    } catch (error) {
      throw new Error(`Failed to add item to wishlist: ${error.message}`);
    }
  }

  // Remove item from wishlist
  async removeItem(itemId, type) {
    try {
      const updatedItems = this.items.filter(item => 
        !(item.itemId === itemId && item.type === type)
      );

      const wishlistRef = db.collection('wishlists').doc(this.id);
      await wishlistRef.update({
        items: updatedItems,
        updatedAt: new Date()
      });

      this.items = updatedItems;
      this.updatedAt = new Date();
      return this;
    } catch (error) {
      throw new Error(`Failed to remove item from wishlist: ${error.message}`);
    }
  }

  // Clear all items from wishlist
  async clearAll() {
    try {
      const wishlistRef = db.collection('wishlists').doc(this.id);
      await wishlistRef.update({
        items: [],
        updatedAt: new Date()
      });

      this.items = [];
      this.updatedAt = new Date();
      return this;
    } catch (error) {
      throw new Error(`Failed to clear wishlist: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      customerId: this.customerId,
      items: this.items,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Wishlist;

