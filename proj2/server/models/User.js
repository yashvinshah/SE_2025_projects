const { db } = require("../config/firebase");
const admin = require("firebase-admin");
const axios = require("axios");

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.profile = data.profile || {};
    this.deliveryStatus =
      data.deliveryStatus || (data.role === "delivery" ? "free" : null);
    this.location = data.location || null; // 🔥 GeoPoint
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /** 🔥 format address */
  static formatAddress(addr) {
    if (!addr) return null;
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
  }

  /** 🔥 fetch geocode */
  static async getGeocode(addrObj) {
    try {
      const addressString = User.formatAddress(addrObj);
      if (!addressString) return null;

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        addressString
      )}&key=${apiKey}`;

      const response = await axios.get(url);

      if (response.data.status === "OK") {
        const { lat, lng } = response.data.results[0].geometry.location;
        return new admin.firestore.GeoPoint(lat, lng);
      }
      return null;
    } catch (err) {
      console.error("User geocode error:", err.message);
      return null;
    }
  }

  /** 🔥 Create user with GeoPoint support */
  static async create(userData) {
    try {
      const userRef = db.collection("users").doc();

      let geoPoint = null;

      // Case 1: 前端傳 lat/lng
      if (userData.profile?.location?.lat && userData.profile.location.lng) {
        geoPoint = new admin.firestore.GeoPoint(
          userData.profile.location.lat,
          userData.profile.location.lng
        );
      }
      // Case 2: 從 address 自動 geocode
      else if (userData.profile?.address) {
        geoPoint = await User.getGeocode(userData.profile.address);
      }

      const userDoc = {
        id: userRef.id,
        ...userData,
        location: geoPoint, // <-- 寫入 Firestore GeoPoint
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await userRef.set(userDoc);
      return new User(userDoc);
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /** 🔥 Update user with GeoPoint support */
  async update(updateData) {
    try {
      const userRef = db.collection("users").doc(this.id);

      let updatePayload = {
        ...updateData,
        updatedAt: new Date(),
      };

      // 若地址更新 → geocode
      if (updateData.profile?.address) {
        const newLoc = await User.getGeocode(updateData.profile.address);
        if (newLoc) {
          updatePayload.location = newLoc;
        }
      }

      await userRef.update(updatePayload);

      Object.assign(this, updatePayload);
      return this;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      profile: this.profile,
      location: this.location
        ? { lat: this.location.latitude, lng: this.location.longitude }
        : null,
      deliveryStatus: this.deliveryStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
