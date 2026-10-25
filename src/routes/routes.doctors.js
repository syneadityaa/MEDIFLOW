const express = require("express");
const router = express.Router();

const { getDoctors } = require("../controllers/controllers.doctors");

router.get("/", getDoctors);

module.exports = router;