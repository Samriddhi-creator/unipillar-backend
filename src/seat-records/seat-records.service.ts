import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SeatRecordsService {

  constructor(
    private prisma: PrismaService
  ) {}

  async findAll(query: any) {

    const {
      year,
      seatType,
      gender,
      isPwd,
    } = query

    return this.prisma.seatRecord.findMany({

      where: {

        ...(year && {
          year: Number(year),
        }),

        ...(seatType && {
          seatType,
        }),

        ...(gender && {
          gender,
        }),

        ...(isPwd && {
          isPwd,
        }),
      },

      orderBy: [
        {
          institute: 'asc',
        },
        {
          closingRank: 'asc',
        },
      ],
    })
  }
}