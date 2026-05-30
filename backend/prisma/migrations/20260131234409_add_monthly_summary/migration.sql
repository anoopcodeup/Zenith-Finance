-- CreateTable
CREATE TABLE "monthly_user_summary" (
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "income" DECIMAL(20,4) NOT NULL,
    "expense" DECIMAL(20,4) NOT NULL,
    "net" DECIMAL(20,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_user_summary_pkey" PRIMARY KEY ("userId","month")
);

-- AddForeignKey
ALTER TABLE "monthly_user_summary" ADD CONSTRAINT "monthly_user_summary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
