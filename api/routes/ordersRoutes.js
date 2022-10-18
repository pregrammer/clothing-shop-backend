const express = require("express");
const router = express.Router();
const {
  get_user_orders,
  get_users_orders,
  create_order,
  change_order_state,
  delete_order,
} = require("../controllers/ordersController");
const { isAdmin } = require("../middlewares/verifyRole");
const verifyJWT = require("../middlewares/verifyJWT");

router.get("/user", verifyJWT, get_user_orders);
router.post("/", verifyJWT, create_order);

// just for manager
router.get("/users", get_users_orders);
router.put("/change-state", verifyJWT, isAdmin, change_order_state);
router.delete("/", verifyJWT, isAdmin, delete_order);

module.exports = router;
