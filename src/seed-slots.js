
const prisma = require("./config/prisma");

async function main() {
  // Find doctor 1
  const doctor = await prisma.doctor.findUnique({
    where: { id: 1 },
  });

  if (!doctor) {
    throw new Error("Doctor with ID 1 was not found");
  }

  // Create three future slots for testing
  const now = new Date();

  const slots = [30, 60, 90].map((minutes) => {
    const startsAt = new Date(
      now.getTime() + minutes * 60 * 1000
    );

    const endsAt = new Date(
      startsAt.getTime() + 15 * 60 * 1000
    );

    return {
      doctorId: doctor.id,
      startsAt,
      endsAt,
    };
  });

  for (const slot of slots) {
    await prisma.slot.upsert({
      where: {
        doctorId_startsAt: {
          doctorId: slot.doctorId,
          startsAt: slot.startsAt,
        },
      },
      update: {},
      create: slot,
    });
  }

  console.log("Three future test slots created successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
