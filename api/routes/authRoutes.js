const express = require("express");
const router = express.Router();
const {
  handleRegister,
  handleLogin,
  handleRefreshToken,
  handleLogout,
} = require("../controllers/authController");

router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.get("/refresh", handleRefreshToken);
router.get("/logout", handleLogout);

module.exports = router;
