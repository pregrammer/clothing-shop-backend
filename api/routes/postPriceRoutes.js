const express = require("express");
const router = express.Router();
const {
  get_all_postPrices,
  create_postPrice,
  delete_postPrice,
} = require("../controllers/postPricesController");
const { isAdmin } = require("../middlewares/verifyRole");

// just for manager
router.get("/", isAdmin, get_all_postPrices);
router.post("/", isAdmin, create_postPrice);
router.delete("/", isAdmin, delete_postPrice);

module.exports = router;
