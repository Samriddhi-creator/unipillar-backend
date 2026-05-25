import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CollegeFee {
  collegeName: string;
  collegeShortName: string;
  fees: number;
  instType: string;
}

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<CollegeFee[]> {
    return this.prisma.collegeFee.findMany({
      orderBy: { collegeShortName: 'asc' },
    });
  }

  async getByType(type: string): Promise<CollegeFee[]> {
    return this.prisma.collegeFee.findMany({
      where:   { instType: type.toUpperCase() },
      orderBy: { collegeShortName: 'asc' },
    });
  }

  async getByShortName(shortName: string): Promise<CollegeFee | null> {
    return this.prisma.collegeFee.findUnique({
      where: { collegeShortName: shortName },
    });
  }
}