const { db } = require("../config/firebase");
const admin = require("firebase-admin");
const axios = require("axios");

class Restaurant {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.cuisine = data.cuisine;
    this.description = data.description;
    this.rating = data.rating || 0;
    this.deliveryTime = data.deliveryTime || "30-45 min";
    this.isLocalLegend = data.isLocalLegend || false;
    this.menu = data.menu || [];
    this.ownerId = data.ownerId;
    this.address = data.address || null; // address is object
    this.location = data.location || null; // GeoPoint
    this.phone = data.phone;
    this.email = data.email;
    this.isActive = data.isActive !== false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /** 🔥 Format address object into full string */
  static formatAddress(addressObj) {
    if (!addressObj) return null;
    const { street, city, state, zipCode } = addressObj;
    return `${street}, ${city}, ${state} ${zipCode}`;
  }

  /** 🔥 Fetch GeoPoint from Google API */
  static async getGeocode(addressObj) {
    try {
      const fullAddress = Restaurant.formatAddress(addressObj);
      if (!fullAddress) return null;

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          fullAddress
        )}&key=${apiKey}`
      );

      if (response.data.status === "OK") {
        const { lat, lng } = response.data.results[0].geometry.location;
        return new admin.firestore.GeoPoint(lat, lng);
      }

      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  /** 🔥 Create restaurant with GeoPoint */
  static async create(restaurantData) {
    try {
      const restaurantRef = db.collection("restaurants").doc();

      let geoPoint = null;

      // Case 1: 前端傳 lat/lng
      if (restaurantData.location?.lat && restaurantData.location?.lng) {
        geoPoint = new admin.firestore.GeoPoint(
          restaurantData.location.lat,
          restaurantData.location.lng
        );
      }

      // Case 2: 沒有 lat/lng → 用地址查找座標
      else if (restaurantData.address) {
        geoPoint = await Restaurant.getGeocode(restaurantData.address);
      }

      const restaurantDoc = {
        id: restaurantRef.id,
        ...restaurantData,
        location: geoPoint,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await restaurantRef.set(restaurantDoc);
      return new Restaurant(restaurantDoc);
    } catch (error) {
      throw new Error(`Failed to create restaurant: ${error.message}`);
    }
  }

  /** Find restaurant by ID */
  static async findById(id) {
    try {
      const doc = await db.collection("restaurants").doc(id).get();
      if (!doc.exists) return null;
      return new Restaurant({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Failed to find restaurant: ${error.message}`);
    }
  }

  /** Update restaurant */
  async update(updateData) {
    try {
      let updatePayload = {
        ...updateData,
        updatedAt: new Date(),
      };

      // user updated their address
      if (
        updateData.address &&
        JSON.stringify(updateData.address) !== JSON.stringify(this.address)
      ) {
        const newLocation = await Restaurant.getGeocode(updateData.address);
        if (newLocation) {
          updatePayload.location = newLocation;
        }
      }

      const restaurantRef = db.collection("restaurants").doc(this.id);
      await restaurantRef.update(updatePayload);

      Object.assign(this, updatePayload);
      return this;
    } catch (error) {
      throw new Error(`Failed to update restaurant: ${error.message}`);
    }
  }

  /** Convert to JSON */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      cuisine: this.cuisine,
      description: this.description,
      rating: this.rating,
      deliveryTime: this.deliveryTime,
      isLocalLegend: this.isLocalLegend,
      menu: this.menu,
      ownerId: this.ownerId,
      address: this.address,
      location: this.location
        ? {
            latitude: this.location.latitude,
            longitude: this.location.longitude,
          }
        : null,
      phone: this.phone,
      email: this.email,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Restaurant;
