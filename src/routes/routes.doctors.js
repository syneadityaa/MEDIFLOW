
const express = require("express");
const router = express.Router();

const {
  getDoctors,
  getDoctorSlots,
  getDoctorQueue,
} = require("../controllers/controllers.doctors");

// Existing doctor search API
router.get("/", getDoctors);

// New doctor availability API
router.get("/:doctorId/slots", getDoctorSlots);
router.get("/:doctorId/queue", getDoctorQueue);

module.exports = router;
