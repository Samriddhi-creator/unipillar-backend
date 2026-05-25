-- CreateTable
CREATE TABLE "CollegeFee" (
    "id" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "collegeShortName" TEXT NOT NULL,
    "fees" INTEGER NOT NULL,
    "instType" TEXT NOT NULL,

    CONSTRAINT "CollegeFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollegeFee_collegeShortName_key" ON "CollegeFee"("collegeShortName");
