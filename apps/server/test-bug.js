const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const assert = require('assert');

async function main() {
  await prisma.user.deleteMany({});
  await prisma.group.deleteMany({});
  
  const user = await prisma.user.create({
    data: { name: 'Saksham', email: 'saksham@example.com', passwordHash: '123' }
  });
  
  const groupA = await prisma.group.create({ data: { name: 'Group A' } });
  const groupB = await prisma.group.create({ data: { name: 'Group B' } });
  
  console.log('Group A:', groupA.id);
  console.log('Group B:', groupB.id);
  
  // mock request to /api/import/commit
  const expense = await prisma.expense.create({
    data: {
      groupId: groupB.id,
      description: 'Test Expense',
      amount: 100,
      amountInr: 100,
      paidByName: 'Saksham',
      date: new Date(),
      splitType: 'equal',
    }
  });
  
  const expensesA = await prisma.expense.findMany({ where: { groupId: groupA.id } });
  const expensesB = await prisma.expense.findMany({ where: { groupId: groupB.id } });
  
  console.log('Expenses in Group A:', expensesA.length);
  console.log('Expenses in Group B:', expensesB.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
