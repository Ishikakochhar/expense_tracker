const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  const groups = await prisma.group.findMany();
  const memberships = await prisma.groupMembership.findMany();
  const expenses = await prisma.expense.findMany();
  const importSessions = await prisma.importSession.findMany();

  console.log("USERS:", users);
  console.log("GROUPS:", groups);
  console.log("MEMBERSHIPS:", memberships);
  console.log("EXPENSES:", expenses);
  console.log("SESSIONS:", importSessions);
}
check().catch(console.error).finally(() => prisma.$disconnect());
