const express = require('express');
const prisma = require('./config/prisma');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const registerationRoutes = require('./routes/routes.registeration');
const loginRoutes = require("./routes/routes.login");
const authenticateToken = require("./middleware/auth.middleware");
const authorizeRole = require("./middleware/authorizeRole");



const app = express();

app.use(express.json());

app.get("/api/protected", authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Access granted",
    user: req.user,
  });
});

app.get('/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    next(err);
  }
});

app.get(
  "/api/doctor-only",
  authenticateToken,
  authorizeRole("DOCTOR"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Doctor access granted",
      user: req.user,
    });
  }
);

app.get(
  "/api/patient-only",
  authenticateToken,
  authorizeRole("PATIENT"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Patient access granted",
      user: req.user,
    });
  }
);

app.use('/api', registerationRoutes);
app.use("/api/login", loginRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;