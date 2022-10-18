const express = require("express");
const router = express.Router();
const {
  get_user,
  get_all_users,
  update_user,
  change_user_state,
  delete_user,
} = require("../controllers/usersController");
const { isAdmin } = require("../middlewares/verifyRole");
const verifyJWT = require("../middlewares/verifyJWT");

// just for logged in users
router.get("/user", verifyJWT, get_user);
router.put("/", verifyJWT, update_user);

// just for manager
router.get("/", verifyJWT, isAdmin, get_all_users);
router.put("/change-state", verifyJWT, isAdmin, change_user_state);
router.delete("/", verifyJWT, isAdmin, delete_user);

module.exports = router;
