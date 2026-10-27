
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



const checkInAppointment = async (req, res, next) => {
  try {
    const appointmentId = Number(req.params.id);
    const patientId = Number(req.user.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid appointment ID is required",
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.patientId !== patientId) {
      return res.status(403).json({
        success: false,
        message: "You can only check in for your own appointment",
      });
    }

    if (appointment.status !== "BOOKED") {
      return res.status(409).json({
        success: false,
        message: `Cannot check in an appointment with status ${appointment.status}`,
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Appointment checked in successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    return next(error);
  }
};


const startConsultation = async (req, res, next) => {
  try {
    const appointmentId = Number(req.params.id);
    const doctorUserId = Number(req.user.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid appointment ID is required",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find the logged-in doctor's database record.
      const doctor = await tx.doctor.findUnique({
        where: { userId: doctorUserId },
      });

      if (!doctor) {
        const error = new Error("Doctor profile not found");
        error.statusCode = 404;
        throw error;
      }

      // Serialize consultation starts for this doctor.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(${doctor.id})
      `;

      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          slot: true,
        },
      });

      if (!appointment) {
        const error = new Error("Appointment not found");
        error.statusCode = 404;
        throw error;
      }

      if (appointment.slot.doctorId !== doctor.id) {
        const error = new Error(
          "You can only start consultations for your own patients"
        );
        error.statusCode = 403;
        throw error;
      }

      if (appointment.status !== "CHECKED_IN") {
        const error = new Error(
          "Only checked-in appointments can start a consultation"
        );
        error.statusCode = 409;
        throw error;
      }

      const activeConsultation = await tx.appointment.findFirst({
        where: {
          status: "IN_CONSULTATION",
          slot: {
            doctorId: doctor.id,
          },
        },
      });

      if (activeConsultation) {
        const error = new Error(
          "This doctor already has an active consultation"
        );
        error.statusCode = 409;
        throw error;
      }

      return tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "IN_CONSULTATION",
          startedAt: new Date(),
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Consultation started successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

const completeConsultation = async (req, res, next) => {
  try {
    const appointmentId = Number(req.params.id);
    const doctorUserId = Number(req.user.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid appointment ID is required",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.findUnique({
        where: { userId: doctorUserId },
      });

      if (!doctor) {
        const error = new Error("Doctor profile not found");
        error.statusCode = 404;
        throw error;
      }

      // Use the same lock as startConsultation.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(${doctor.id})
      `;

      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { slot: true },
      });

      if (!appointment) {
        const error = new Error("Appointment not found");
        error.statusCode = 404;
        throw error;
      }

      if (appointment.slot.doctorId !== doctor.id) {
        const error = new Error(
          "You can only complete your own patients' consultations"
        );
        error.statusCode = 403;
        throw error;
      }

      if (appointment.status !== "IN_CONSULTATION") {
        const error = new Error(
          "Only active consultations can be completed"
        );
        error.statusCode = 409;
        throw error;
      }

      return tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "DONE",
          endedAt: new Date(),
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Consultation completed successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

module.exports = { bookAppointment , checkInAppointment, startConsultation , completeConsultation};
