const express = require("express");
const router = express.Router();
const { update_user } = require("../controllers/usersController");

router.put("/", update_user);

module.exports = router;
