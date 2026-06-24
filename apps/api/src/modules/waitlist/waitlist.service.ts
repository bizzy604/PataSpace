/**
 * Purpose: Application service for waitlist — stores and counts pre-launch signups.
 * Why important: Persists waitlist entries so the team can contact early users at launch.
 * Used by: WaitlistController.
 */
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface JoinWaitlistInput {
  email: string;
  name?: string;
  source?: string;
}

export interface WaitlistEntryResponse {
  id: string;
  email: string;
  name: string | null;
  position: number;
  createdAt: string;
}

export interface WaitlistCountResponse {
  count: number;
}

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async join(input: JoinWaitlistInput): Promise<WaitlistEntryResponse> {
    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_ON_WAITLIST',
        message: 'This email is already on the waitlist.',
      });
    }

    const entry = await this.prisma.waitlistEntry.create({
      data: {
        email: input.email.toLowerCase().trim(),
        name: input.name?.trim() || null,
        source: input.source?.trim() || null,
      },
    });

    const position = await this.prisma.waitlistEntry.count({
      where: { createdAt: { lte: entry.createdAt } },
    });

    return {
      id: entry.id,
      email: entry.email,
      name: entry.name,
      position,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  async getCount(): Promise<WaitlistCountResponse> {
    const count = await this.prisma.waitlistEntry.count();
    return { count };
  }
}
