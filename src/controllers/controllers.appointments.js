
const prisma = require("../config/prisma");

const bookAppointment = async (req, res, next) => {
  try {
    const slotId = Number(req.body.slotId);
    const patientId = Number(req.user?.id ?? req.user?.userId);

    if (!Number.isInteger(slotId) || slotId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid slotId is required",
      });
    }

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid patient identity in authentication token",
      });
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        const error = new Error("Slot not found");
        error.statusCode = 404;
        throw error;
      }

      if (slot.startsAt <= new Date()) {
        const error = new Error("Cannot book a slot in the past");
        error.statusCode = 400;
        throw error;
      }

      // Atomically claim the slot. Only one request can succeed.
      const result = await tx.slot.updateMany({
        where: {
          id: slotId,
          isBooked: false,
          startsAt: { gt: new Date() },
        },
        data: {
          isBooked: true,
        },
      });

      if (result.count !== 1) {
        const error = new Error("This slot is no longer available");
        error.statusCode = 409;
        throw error;
      }

      return tx.appointment.create({
        data: {
          patientId,
          slotId,
        },
        include: {
          slot: {
            select: {
              doctorId: true,
              startsAt: true,
              endsAt: true,
            },
          },
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This slot has already been booked",
      });
    }

    return next(error);
  }
};

module.exports = { bookAppointment };
