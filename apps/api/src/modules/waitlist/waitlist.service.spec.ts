/**
 * Purpose: Unit tests for WaitlistService.
 * Why important: Validates waitlist join + duplicate detection + count logic.
 * Used by: CI gate tests.
 */
import { ConflictException } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';

function buildMockPrisma() {
  return {
    waitlistEntry: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  } as any;
}

describe('WaitlistService', () => {
  let service: WaitlistService;
  let prisma: ReturnType<typeof buildMockPrisma>;

  beforeEach(() => {
    prisma = buildMockPrisma();
    service = new WaitlistService(prisma);
  });

  describe('join', () => {
    it('creates a new waitlist entry and returns position', async () => {
      const now = new Date();
      prisma.waitlistEntry.findUnique.mockResolvedValue(null);
      prisma.waitlistEntry.create.mockResolvedValue({
        id: 'wl_1',
        email: 'test@example.com',
        name: 'Test User',
        source: null,
        createdAt: now,
      });
      prisma.waitlistEntry.count.mockResolvedValue(42);

      const result = await service.join({
        email: 'Test@Example.com',
        name: 'Test User',
      });

      expect(result.id).toBe('wl_1');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(result.position).toBe(42);
      expect(prisma.waitlistEntry.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          source: null,
        },
      });
    });

    it('throws ConflictException when email already exists', async () => {
      prisma.waitlistEntry.findUnique.mockResolvedValue({
        id: 'wl_existing',
        email: 'test@example.com',
      });

      await expect(
        service.join({ email: 'test@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('normalizes email to lowercase and trims whitespace', async () => {
      const now = new Date();
      prisma.waitlistEntry.findUnique.mockResolvedValue(null);
      prisma.waitlistEntry.create.mockResolvedValue({
        id: 'wl_2',
        email: 'user@test.com',
        name: null,
        source: null,
        createdAt: now,
      });
      prisma.waitlistEntry.count.mockResolvedValue(1);

      await service.join({ email: '  User@Test.com  ' });

      expect(prisma.waitlistEntry.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@test.com' },
      });
    });
  });

  describe('getCount', () => {
    it('returns the total waitlist count', async () => {
      prisma.waitlistEntry.count.mockResolvedValue(128);

      const result = await service.getCount();

      expect(result).toEqual({ count: 128 });
    });
  });
});
