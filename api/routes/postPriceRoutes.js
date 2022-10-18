const express = require("express");
const router = express.Router();
const {
  get_all_postPrices,
  create_postPrice,
  delete_postPrice,
} = require("../controllers/postPricesController");
const { isAdmin } = require("../middlewares/verifyRole");
const verifyJWT = require("../middlewares/verifyJWT");

// for all users.
router.get("/", get_all_postPrices);

// just for manager
router.post("/", verifyJWT, isAdmin, create_postPrice);
router.delete("/", verifyJWT, isAdmin, delete_postPrice);

module.exports = router;
