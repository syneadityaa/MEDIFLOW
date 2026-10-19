const express = require('express');
const prisma = require('./config/prisma');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const registerationRoutes = require('./routes/routes.registeration');
const loginRoutes = require("./routes/routes.login");
const authenticateToken = require("./middleware/auth.middleware");



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

app.use('/api', registerationRoutes);
app.use("/api/login", loginRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;