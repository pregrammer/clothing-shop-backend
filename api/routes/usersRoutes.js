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

// just for logged in users
router.get("/user", get_user);
router.put("/", update_user);

// just for manager
router.get("/", isAdmin, get_all_users);
router.put("/change-state", isAdmin, change_user_state);
router.delete("/", isAdmin, delete_user);

module.exports = router;
