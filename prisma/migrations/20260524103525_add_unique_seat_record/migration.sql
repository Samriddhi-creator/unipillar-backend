/*
  Warnings:

  - A unique constraint covering the columns `[institute,program,quota,seatType,gender,year,round,isPwd]` on the table `SeatRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SeatRecord_institute_program_quota_seatType_gender_year_rou_key" ON "SeatRecord"("institute", "program", "quota", "seatType", "gender", "year", "round", "isPwd");
