
const express = require("express");
const authenticateToken = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/authorizeRole");
const {
  bookAppointment,
  checkInAppointment,
  startConsultation,
  completeConsultation,
  cancelAppointment,
  markNoShow,
} = require("../controllers/controllers.appointments");


const router = express.Router();

// All appointment routes require login
router.use(authenticateToken);

// Only patients can book appointments

router.post("/", authorizeRole("PATIENT"), bookAppointment);

router.patch("/:id/check-in", authorizeRole("PATIENT"), checkInAppointment);

router.patch("/:id/start", authorizeRole("DOCTOR"), startConsultation);

router.patch("/:id/complete", authorizeRole("DOCTOR"), completeConsultation);

router.patch("/:id/cancel", authenticateToken, cancelAppointment);

router.patch("/:id/no-show", authorizeRole("DOCTOR"), markNoShow);


module.exports = router;
