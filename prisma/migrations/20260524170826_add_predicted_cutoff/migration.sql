-- CreateTable
CREATE TABLE "PredictedCutoff" (
    "id" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "collegeState" TEXT NOT NULL,
    "branchShortcut" TEXT NOT NULL,
    "degreeType" TEXT NOT NULL,
    "quota" TEXT NOT NULL,
    "seatType" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "predictedClosingRank2026" INTEGER NOT NULL,
    "instituteType" TEXT NOT NULL,
    "globalPrestigeIndex" INTEGER NOT NULL,
    "globalBranchPopularity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictedCutoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PredictedCutoff_quota_idx" ON "PredictedCutoff"("quota");

-- CreateIndex
CREATE INDEX "PredictedCutoff_seatType_idx" ON "PredictedCutoff"("seatType");

-- CreateIndex
CREATE INDEX "PredictedCutoff_gender_idx" ON "PredictedCutoff"("gender");

-- CreateIndex
CREATE INDEX "PredictedCutoff_collegeState_idx" ON "PredictedCutoff"("collegeState");

-- CreateIndex
CREATE INDEX "PredictedCutoff_predictedClosingRank2026_idx" ON "PredictedCutoff"("predictedClosingRank2026");
