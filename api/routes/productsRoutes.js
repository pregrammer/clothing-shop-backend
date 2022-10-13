const express = require("express");
const router = express.Router();
const {
  get_all_products,
  get_filtered_products,
  get_product,
  get_products_for_index,
  create_product,
  update_product,
  delete_product,
} = require("../controllers/productsController");
const { isAdmin } = require("../middlewares/verifyRole");
const verifyJWT = require("../middlewares/verifyJWT");

// for all users
router.get("/filtered", get_filtered_products);
router.get("/product/:id", get_product);
router.get("/index-page", get_products_for_index);

// just for manager
router.get("/", verifyJWT, isAdmin, get_all_products);
router.post("/", verifyJWT, isAdmin, create_product);
router.put("/", verifyJWT, isAdmin, update_product);
router.delete("/", verifyJWT, isAdmin, delete_product);

module.exports = router;
