
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

module.exports = { getDoctors ,getDoctorSlots};
