
const express = require("express");
const { loginUser } = require("../controllers/controllers.login");

const router = express.Router();

router.post("/", loginUser);

module.exports = router;
