-- DropForeignKey
ALTER TABLE "TestAttempt" DROP CONSTRAINT "TestAttempt_moduleId_fkey";

-- AlterTable
ALTER TABLE "TestAttempt" ADD COLUMN     "customTestId" TEXT,
ALTER COLUMN "moduleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "facultyId" TEXT;

-- CreateTable
CREATE TABLE "CustomTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CustomTestToQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CustomTestToQuestion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CustomTestToQuestion_B_index" ON "_CustomTestToQuestion"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_customTestId_fkey" FOREIGN KEY ("customTestId") REFERENCES "CustomTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTest" ADD CONSTRAINT "CustomTest_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomTestToQuestion" ADD CONSTRAINT "_CustomTestToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "CustomTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomTestToQuestion" ADD CONSTRAINT "_CustomTestToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
