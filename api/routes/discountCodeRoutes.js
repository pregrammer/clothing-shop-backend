const express = require("express");
const router = express.Router();
const {
  get_all_discountCodes,
  create_discountCode,
  check_discount_code,
  delete_discountCode,
} = require("../controllers/discountCodesController");
const { isAdmin } = require("../middlewares/verifyRole");
const verifyJWT = require("../middlewares/verifyJWT");

// for all users
router.get("/check", check_discount_code);

// just for manager
router.get("/", verifyJWT, isAdmin, get_all_discountCodes);
router.post("/", verifyJWT, isAdmin, create_discountCode);
router.delete("/", verifyJWT, isAdmin, delete_discountCode);

module.exports = router;
