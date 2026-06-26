import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password", 12);

  await prisma.user.upsert({
    where: { email: "demo@hourline.app" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@hourline.app",
      passwordHash,
      activePreset: "FIELD_ENGINEER",
      employerName: "Acme Ltd",
      employerEmail: "payroll@acme.example",
      submitMessage: "Please find my timesheet attached.",
    },
  });

  console.log("Seeded demo user: demo@hourline.app / password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
