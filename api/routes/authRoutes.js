const express = require("express");
const router = express.Router();
const {
  create_user,
  handleLogin,
  handleRefreshToken,
  handleLogout,
} = require("../controllers/authController");

router.post("/register", create_user);
router.post("/login", handleLogin);
router.get("/refresh", handleRefreshToken);
router.get("/logout", handleLogout);

module.exports = router;
