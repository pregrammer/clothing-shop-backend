const express = require("express");
const router = express.Router();
const {
  get_all_discountCodes,
  create_discountCode,
  delete_discountCode,
} = require("../controllers/discountCodesController");
const { isAdmin } = require("../middlewares/verifyRole");

// just for manager
router.get("/", isAdmin, get_all_discountCodes);
router.post("/", isAdmin, create_discountCode);
router.delete("/", isAdmin, delete_discountCode);

module.exports = router;
