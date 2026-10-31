
const prisma = require("../config/prisma");

// Keep timestamps in their original Date format.
// Express will serialize them into standard ISO strings.
const formatAppointment = (appointment) => {
  return appointment;
};

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
      const now = new Date();

      const slot = await tx.slot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        const error = new Error("Slot not found");
        error.statusCode = 404;
        throw error;
      }

      if (slot.startsAt <= now) {
        const error = new Error("Cannot book a slot in the past");
        error.statusCode = 400;
        throw error;
      }

      // Atomically claim the slot to prevent double booking.
      const result = await tx.slot.updateMany({
        where: {
          id: slotId,
          isBooked: false,
          startsAt: { gt: now },
        },
        data: { isBooked: true },
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
      data: formatAppointment(appointment),
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
    const patientId = Number(req.user?.id ?? req.user?.userId);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid appointment ID is required",
      });
    }

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid patient identity in authentication token",
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
      data: formatAppointment(updatedAppointment),
    });
  } catch (error) {
    return next(error);
  }
};

const startConsultation = async (req, res, next) => {
  try {
    const appointmentId = Number(req.params.id);
    const doctorUserId = Number(req.user?.id ?? req.user?.userId);

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

      // Serialize consultation starts for this doctor.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(${BigInt(doctor.id)})
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
          slot: { doctorId: doctor.id },
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
      data: formatAppointment(result),
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
    const doctorUserId = Number(req.user?.id ?? req.user?.userId);

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
        SELECT pg_advisory_xact_lock(${BigInt(doctor.id)})
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
      data: formatAppointment(result),
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

const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const patientId = Number(req.user.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status !== "BOOKED") {
      return res.status(400).json({
        success: false,
        message: "Only booked appointments can be cancelled",
      });
    }

    const cancelled = await prisma.appointment.updateMany({
      where: {
        id: appointmentId,
        patientId,
        status: "BOOKED",
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (cancelled.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Appointment status changed; please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
    });
  }
};

const markNoShow = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const userId = Number(req.user.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.slot.doctorId !== doctor.id) {
      return res.status(403).json({
        success: false,
        message: "This appointment does not belong to this doctor",
      });
    }

    if (!["BOOKED", "CHECKED_IN"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: "This appointment cannot be marked as no-show",
      });
    }

    const result = await prisma.appointment.updateMany({
      where: {
        id: appointmentId,
        status: appointment.status,
        slot: {
          doctorId: doctor.id,
        },
      },
      data: {
        status: "NO_SHOW",
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Appointment status changed; please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment marked as no-show",
    });
  } catch (error) {
    console.error("Error marking no-show:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark appointment as no-show",
    });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientId,
      },
      include: {
        slot: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                specialty: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      count: appointments.length,
      appointments: appointments.map(formatAppointment),
    });
  } catch (error) {
    console.error("Get my appointments error:", error);

    return res.status(500).json({
      message: "Failed to fetch appointments",
    });
  }
};

const getDoctorTodayAppointments = async (req, res) => {
  try {
    const doctorUserId = Number(req.user?.id ?? req.user?.userId);

    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    // Get today's date in Indian Standard Time.
    const now = new Date();
    const istDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const startOfDay = new Date(`${istDate}T00:00:00+05:30`);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        slot: {
          doctorId: doctor.id,
          startsAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        slot: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
      orderBy: {
        slot: {
          startsAt: "asc",
        },
      },
    });

    return res.status(200).json({
      count: appointments.length,
      appointments: appointments.map(formatAppointment),
    });
  } catch (error) {
    console.error("Get today's doctor appointments error:", error);

    return res.status(500).json({
      message: "Failed to fetch today's appointments",
    });
  }
};

module.exports = {
  bookAppointment,
  checkInAppointment,
  startConsultation,
  completeConsultation,
  cancelAppointment,
  markNoShow,
  getMyAppointments,
  getDoctorTodayAppointments,
};
