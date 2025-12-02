// routes/users.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// 取得指定 user（可用在 debug / 之後 profile page）
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toJSON() });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 更新 user（地址 + 位置）
router.put(
  "/:id",
  [
    body("profile").optional().isObject(),
    body("location").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const updated = await user.update(req.body);

      res.json({
        message: "User updated successfully",
        user: updated.toJSON(),
      });
    } catch (err) {
      console.error("Update user error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
