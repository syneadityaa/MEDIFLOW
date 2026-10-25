
const prisma = require("./config/prisma");
const bcrypt = require("bcryptjs");

async function seedDoctors() {
  try {
    // 1. Create specialties, or reuse existing ones
    const cardiology = await prisma.specialty.upsert({
      where: { name: "Cardiology" },
      update: {},
      create: { name: "Cardiology" },
    });

    const dermatology = await prisma.specialty.upsert({
      where: { name: "Dermatology" },
      update: {},
      create: { name: "Dermatology" },
    });

    // 2. Prepare test doctors
    const testDoctors = [
      {
        name: "Dr. Asha",
        email: "asha.doctor@test.com",
        specialty: cardiology,
        rating: 4.8,
        avgConsultMins: 15,
      },
      {
        name: "Dr. Rahul",
        email: "rahul.doctor@test.com",
        specialty: cardiology,
        rating: 4.5,
        avgConsultMins: 20,
      },
      {
        name: "Dr. Neha",
        email: "neha.doctor@test.com",
        specialty: dermatology,
        rating: 4.7,
        avgConsultMins: 15,
      },
    ];

    // 3. Create users and link each one to a doctor record
    for (const doctorData of testDoctors) {
      const passwordHash = await bcrypt.hash(
        "TestDoctor123!",
        10
      );

      const user = await prisma.user.upsert({
        where: { email: doctorData.email },
        update: {
          name: doctorData.name,
          role: "DOCTOR",
        },
        create: {
          name: doctorData.name,
          email: doctorData.email,
          passwordHash,
          role: "DOCTOR",
        },
      });

      await prisma.doctor.upsert({
        where: { userId: user.id },
        update: {
          specialtyId: doctorData.specialty.id,
          rating: doctorData.rating,
          avgConsultMins: doctorData.avgConsultMins,
        },
        create: {
          userId: user.id,
          specialtyId: doctorData.specialty.id,
          rating: doctorData.rating,
          avgConsultMins: doctorData.avgConsultMins,
        },
      });
    }

    console.log("Doctor seed completed successfully!");
  } catch (error) {
    console.error("Error seeding doctors:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedDoctors();
