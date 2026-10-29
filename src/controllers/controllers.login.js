
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication configuration error",
      });
    }


let doctorId = null;

if (user.role === "DOCTOR") {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor profile not found",
    });
  }

  doctorId = doctor.id;
}


    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.role === "DOCTOR" && { doctorId }),
},
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { loginUser };
