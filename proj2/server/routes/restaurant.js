const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

// Get restaurant profile (simplified - no auth required for now)
router.get("/profile", async (req, res) => {
  try {
    // For now, return empty profile until we implement proper restaurant identification
    res.json({
      user: null,
      restaurant: null,
    });
  } catch (error) {
    console.error("Get restaurant profile error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update restaurant profile by email and password
router.put(
  "/profile",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 1 }),
    body("restaurant.name").optional().isString(),
    body("restaurant.cuisine").optional().isString(),
    body("restaurant.description").optional().isString(),
    body("restaurant.address").optional().isObject(),
    body("restaurant.phone").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, restaurant: restaurantData } = req.body;
      const user = await User.findByEmail(email);

      if (!user || user.password !== password || user.role !== "restaurant") {
        return res
          .status(401)
          .json({ error: "Invalid credentials or not a restaurant" });
      }

      // Get restaurant data for this owner
      const restaurants = await Restaurant.findByOwnerId(user.id);
      let restaurant = restaurants[0];

      if (restaurant) {
        // Update existing restaurant
        restaurant = await restaurant.update(restaurantData);
      } else {
        // Create new restaurant if none exists
        restaurant = await Restaurant.create({
          ...restaurantData,
          ownerId: user.id,
        });
      }

      res.json({
        message: "Restaurant profile updated successfully",
        restaurant: restaurant.toJSON(),
      });
    } catch (error) {
      console.error("Update restaurant profile error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get restaurant menu
router.get("/menu", async (req, res) => {
  try {
    // Get all restaurant users and return the first one's menu
    // In a real app, you'd identify the specific restaurant
    const { db } = require("../config/firebase");
    const usersSnapshot = await db
      .collection("users")
      .where("role", "==", "restaurant")
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.json({ menu: [] });
    }

    const userData = usersSnapshot.docs[0].data();
    const menu = userData.profile?.menu || [];

    res.json({ menu });
  } catch (error) {
    console.error("Get restaurant menu error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update restaurant menu
router.put("/menu", [body("menu").isArray()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { menu } = req.body;

    // Update the restaurant user's menu in Firebase
    const { db } = require("../config/firebase");
    const usersSnapshot = await db
      .collection("users")
      .where("role", "==", "restaurant")
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Update the user's profile with the new menu
    await userDoc.ref.update({
      "profile.menu": menu,
      updatedAt: new Date(),
    });

    res.json({
      message: "Menu updated successfully",
      menu: menu,
    });
  } catch (error) {
    console.error("Update restaurant menu error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new restaurant (for new restaurant owners)
router.post(
  "/create",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 1 }),
    body("restaurant.name").notEmpty(),
    body("restaurant.cuisine").notEmpty(),
    body("restaurant.description").optional().isString(),
    body("restaurant.address").isObject(),
    body("restaurant.phone").notEmpty(),
  ],
  async (req, res) => {
    try {
      const { db } = require("../config/firebase");
      const admin = require("firebase-admin");
      const axios = require("axios");

      const { email, password, restaurant: restaurantData } = req.body;

      // 驗證身分
      const user = await User.findByEmail(email);
      if (!user || user.password !== password || user.role !== "restaurant") {
        return res
          .status(401)
          .json({ error: "Invalid credentials or not a restaurant" });
      }

      // 建立 restaurant record
      const restaurant = await Restaurant.create({
        ...restaurantData,
        ownerId: user.id,
      });

      // ⭐⭐⭐ 新增：建立 GeoPoint ⭐⭐⭐
      const address = restaurantData.address;
      const formatted = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        formatted
      )}&key=${apiKey}`;

      const geo = await axios.get(url);
      if (geo.data.status === "OK") {
        const { lat, lng } = geo.data.results[0].geometry.location;

        await db
          .collection("users")
          .doc(user.id)
          .update({
            location: new admin.firestore.GeoPoint(lat, lng),
          });

        console.log(`Saved restaurant location: ${lat}, ${lng}`);
      }

      res.status(201).json({
        message: "Restaurant created successfully",
        restaurant: restaurant.toJSON(),
      });
    } catch (error) {
      console.error("Create restaurant error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.post("/fix-geolocation", async (req, res) => {
  try {
    const { db } = require("../config/firebase");
    const admin = require("firebase-admin");
    const axios = require("axios");

    const snap = await db
      .collection("users")
      .where("role", "==", "restaurant")
      .get();

    console.log("Found restaurants:", snap.size);

    for (const doc of snap.docs) {
      const data = doc.data();

      if (data.location) {
        console.log(`Skip ${doc.id} (already has location)`);
        continue;
      }

      const addr = data.profile?.address;
      if (!addr) {
        console.log(`Skip ${doc.id} (missing address)`);
        continue;
      }

      const formatted = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
      console.log("Geocoding:", formatted);

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        formatted
      )}&key=${apiKey}`;

      const geoRes = await axios.get(url);

      if (geoRes.data.status === "OK") {
        const { lat, lng } = geoRes.data.results[0].geometry.location;
        await doc.ref.update({
          location: new admin.firestore.GeoPoint(lat, lng),
        });
        console.log(`Updated ${doc.id}: ${lat}, ${lng}`);
      } else {
        console.log(`Failed geocoding ${doc.id}:`, geoRes.data.status);
      }
    }

    res.json({ message: "Restaurant geolocation update complete." });
  } catch (error) {
    console.error("Fix geolocation error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
