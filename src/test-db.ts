import "dotenv/config";
import { prisma } from "./config/prisma";

async function testDatabase() {
  try {
    const userCount = await prisma.user.count();

    console.log("PostgreSQL connected successfully!");
    console.log("Current users:", userCount);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();