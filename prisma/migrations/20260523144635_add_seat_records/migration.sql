-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatRecord" (
    "id" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "quota" TEXT NOT NULL,
    "seatType" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "openingRank" INTEGER NOT NULL,
    "closingRank" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "isPwd" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");
