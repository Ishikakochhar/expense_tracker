-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "fxRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "amountInr" DOUBLE PRECISION NOT NULL,
    "paidById" TEXT,
    "paidByName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "splitType" TEXT NOT NULL,
    "notes" TEXT,
    "isRefund" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSplit" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "memberId" TEXT,
    "memberName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "shareValue" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,

    CONSTRAINT "ExpenseSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromMemberId" TEXT,
    "fromMemberName" TEXT NOT NULL,
    "toMemberId" TEXT,
    "toMemberName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "fxRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "amountInr" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportSession" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportAnomaly" (
    "id" TEXT NOT NULL,
    "importSessionId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "anomalyType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolution" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "rowData" JSONB NOT NULL,

    CONSTRAINT "ImportAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "GroupMembership_groupId_idx" ON "GroupMembership"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_groupId_userId_key" ON "GroupMembership"("groupId", "userId");

-- CreateIndex
CREATE INDEX "Expense_groupId_idx" ON "Expense"("groupId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "ExpenseSplit_expenseId_idx" ON "ExpenseSplit"("expenseId");

-- CreateIndex
CREATE INDEX "Settlement_groupId_idx" ON "Settlement"("groupId");

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportSession" ADD CONSTRAINT "ImportSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportAnomaly" ADD CONSTRAINT "ImportAnomaly_importSessionId_fkey" FOREIGN KEY ("importSessionId") REFERENCES "ImportSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
