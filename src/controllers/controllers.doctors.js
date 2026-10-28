
const prisma = require("../config/prisma");

const getDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;

    // 1. Read and validate pagination parameters
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Page must be positive and limit must be between 1 and 50",
      });
    }

    // 2. Validate specialty
    if (
      specialty !== undefined &&
      (typeof specialty !== "string" || !specialty.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Specialty must be a non-empty string",
      });
    }

    // 3. Read and validate sorting parameters
    const sortBy = req.query.sortBy ?? "id";
    const order = req.query.order ?? "asc";

    const allowedSortFields = ["id", "rating"];

    if (
      typeof sortBy !== "string" ||
      !allowedSortFields.includes(sortBy) ||
      typeof order !== "string" ||
      !["asc", "desc"].includes(order)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sorting parameters",
      });
    }

    // 4. Build the specialty filter
    const where = specialty
      ? {
          specialty: {
            name: {
              equals: specialty.trim(),
              mode: "insensitive",
            },
          },
        }
      : {};

    // 5. Calculate pagination
    const skip = (page - 1) * limit;

    // 6. Build sorting with ID as a tie-breaker
    const orderBy = [
      { [sortBy]: order },
      { id: "asc" },
    ];

    // 7. Fetch doctors and total matching count
    const [doctors, totalDoctors] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          avgConsultMins: true,
          rating: true,
          user: {
            select: {
              name: true,
            },
          },
          specialty: {
            select: {
              name: true,
            },
          },
        },
      }),

      prisma.doctor.count({ where }),
    ]);

    // 8. Return successful response
    return res.status(200).json({
      success: true,
      count: doctors.length,
      pagination: {
        page,
        limit,
        totalDoctors,
        totalPages: Math.ceil(totalDoctors / limit),
      },
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
};

const getDoctorSlots = async (req, res) => {
  try {
    // 1. Read doctor ID from the URL
    const doctorId = Number(req.params.doctorId);

    // 2. Validate doctor ID
    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    // 3. Check whether the doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // 4. Find available future slots
    const slots = await prisma.slot.findMany({
      where: {
        doctorId,
        isBooked: false,
        startsAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
      },
    });

    // 5. Return the available slots
    return res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    console.error("Error fetching doctor slots:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor slots",
    });
  }
};


const getDoctorQueue = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        avgConsultMins: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        slot: { doctorId },
        status: {
          in: ["CHECKED_IN", "IN_CONSULTATION"],
        },
      },
      select: {
        id: true,
        status: true,
        checkedInAt: true,
        startedAt: true,
        slot: {
          select: {
            startsAt: true,
          },
        },
      },
    });

    const active = appointments.find(
      (appointment) => appointment.status === "IN_CONSULTATION"
    );

    const waiting = appointments
      .filter((appointment) => appointment.status === "CHECKED_IN")
      .sort((a, b) => {
        // Patients who checked in after their appointment time
        // rejoin behind patients already waiting.
        const aLate =
          a.checkedInAt &&
          a.checkedInAt > a.slot.startsAt;

        const bLate =
          b.checkedInAt &&
          b.checkedInAt > b.slot.startsAt;

        if (Boolean(aLate) !== Boolean(bLate)) {
          return aLate ? 1 : -1;
        }

        if (aLate && bLate) {
          return (
            new Date(a.checkedInAt) - new Date(b.checkedInAt) ||
            a.id - b.id
          );
        }

        return (
          new Date(a.slot.startsAt) - new Date(b.slot.startsAt) ||
          a.id - b.id
        );
      });

    const now = Date.now();

    const activeElapsedMins = active?.startedAt
      ? Math.max(
          0,
          (now - new Date(active.startedAt).getTime()) / 60000
        )
      : 0;

    const remainingMins = active
      ? Math.max(
          0,
          doctor.avgConsultMins - activeElapsedMins
        )
      : 0;

    const queue = waiting.map((appointment, index) => {
      const position = index + 1;

      const estimatedWaitMins = Math.ceil(
        remainingMins +
          index * doctor.avgConsultMins
      );

      return {
        appointmentId: appointment.id,
        status: appointment.status,
        position,
        estimatedWaitMins,
        estimatedStartAt: new Date(
          now + estimatedWaitMins * 60000
        ).toISOString(),
      };
    });

    return res.status(200).json({
      success: true,
      doctorId: doctor.id,
      averageConsultationMins: doctor.avgConsultMins,
      activeConsultation: active
        ? {
            appointmentId: active.id,
            startedAt: active.startedAt,
            elapsedMins: Math.floor(activeElapsedMins),
            estimatedRemainingMins: Math.ceil(remainingMins),
          }
        : null,
      waitingCount: queue.length,
      queue,
      estimateNote:
        "Wait times are estimates and may change as consultations progress.",
    });
  } catch (error) {
    console.error("Error fetching doctor queue:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor queue",
    });
  }
};

module.exports = {
  getDoctors,
  getDoctorSlots,
  getDoctorQueue,
};
