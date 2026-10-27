
const express = require("express");
const authenticateToken = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/authorizeRole");
const {
  bookAppointment,
} = require("../controllers/controllers.appointments");


const router = express.Router();

// All appointment routes require login
router.use(authenticateToken);

// Only patients can book appointments

router.post("/", authorizeRole("PATIENT"), bookAppointment);


module.exports = router;
