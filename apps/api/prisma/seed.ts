import { PrismaClient, Role, ListingStatus, TransactionStatus, TransactionType } from '@prisma/client';
import {
  encryptField,
  hashLookupValue,
  hashSecretValue,
  normalizePhoneNumber,
} from '../src/common/security/encryption.util';

const prisma = new PrismaClient();

const encryptionKey = process.env.APP_ENCRYPTION_KEY ?? '12345678901234567890123456789012';

type SeedUser = {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role?: Role;
  password: string;
  email?: string;
};

function buildUserData(user: SeedUser) {
  const normalizedPhone = normalizePhoneNumber(user.phoneNumber);

  return {
    phoneNumberHash: hashLookupValue(normalizedPhone),
    phoneNumberEncrypted: encryptField(normalizedPhone, encryptionKey),
    phoneVerified: true,
    email: user.email,
    passwordHash: hashSecretValue(user.password),
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role ?? Role.USER,
    isActive: true,
    isBanned: false,
  };
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.confirmation.deleteMany();
  await prisma.creditTransaction.deleteMany();
  await prisma.unlock.deleteMany();
  await prisma.listingPhoto.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.oTPCode.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: buildUserData({
      phoneNumber: '+254700000001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@pataspace.local',
      role: Role.ADMIN,
      password: 'admin-password',
    }),
  });

  const outgoingTenant = await prisma.user.create({
    data: buildUserData({
      phoneNumber: '+254700000002',
      firstName: 'Amina',
      lastName: 'Njoroge',
      email: 'outgoing@pataspace.local',
      password: 'outgoing-password',
    }),
  });

  const incomingTenant = await prisma.user.create({
    data: buildUserData({
      phoneNumber: '+254700000003',
      firstName: 'Brian',
      lastName: 'Otieno',
      email: 'incoming@pataspace.local',
      password: 'incoming-password',
    }),
  });

  await prisma.credit.createMany({
    data: [
      {
        userId: outgoingTenant.id,
        balance: 2500,
        lifetimeEarned: 2500,
        lifetimeSpent: 0,
      },
      {
        userId: incomingTenant.id,
        balance: 12000,
        lifetimeEarned: 12000,
        lifetimeSpent: 0,
      },
    ],
  });

  const activeListing = await prisma.listing.create({
    data: {
      userId: outgoingTenant.id,
      county: 'Nairobi',
      neighborhood: 'Kilimani',
      addressEncrypted: encryptField('123 Argwings Kodhek Road, Kilimani', encryptionKey),
      latitude: -1.2921,
      longitude: 36.783,
      monthlyRent: 25000,
      bedrooms: 1,
      bathrooms: 1,
      propertyType: 'Apartment',
      furnished: false,
      description: 'A clean one-bedroom apartment ready for move-in.',
      amenities: ['Water 24/7', 'Wifi ready', 'CCTV'],
      propertyNotes: 'First three listings require review history tracking.',
      availableFrom: new Date('2026-04-01T00:00:00.000Z'),
      unlockCostCredits: 2500,
      commission: 750,
      thumbnailUrl: 'https://sandbox-storage.pataspace.local/media/listings/listing-1-thumb.jpg',
      status: ListingStatus.ACTIVE,
      isApproved: true,
      approvedAt: new Date('2026-03-20T09:00:00.000Z'),
      approvedBy: admin.id,
      photos: {
        create: [
          {
            url: 'https://sandbox-storage.pataspace.local/media/listings/listing-1-photo-1.jpg',
            s3Key: 'media/listings/listing-1-photo-1.jpg',
            order: 1,
            width: 1080,
            height: 1440,
            latitude: -1.2921,
            longitude: 36.783,
            takenAt: new Date('2026-03-19T08:00:00.000Z'),
          },
          {
            url: 'https://sandbox-storage.pataspace.local/media/listings/listing-1-photo-2.jpg',
            s3Key: 'media/listings/listing-1-photo-2.jpg',
            order: 2,
            width: 1080,
            height: 1440,
            latitude: -1.29211,
            longitude: 36.78301,
            takenAt: new Date('2026-03-19T08:05:00.000Z'),
          },
        ],
      },
    },
  });

  await prisma.listing.create({
    data: {
      userId: outgoingTenant.id,
      county: 'Nairobi',
      neighborhood: 'South B',
      addressEncrypted: encryptField('456 Plainsview Estate, South B', encryptionKey),
      latitude: -1.3167,
      longitude: 36.8333,
      monthlyRent: 18000,
      bedrooms: 1,
      bathrooms: 1,
      propertyType: 'Studio',
      furnished: true,
      description: 'Pending review studio listing.',
      amenities: ['Water tank', 'Guarded gate'],
      availableFrom: new Date('2026-04-10T00:00:00.000Z'),
      unlockCostCredits: 1800,
      commission: 540,
      status: ListingStatus.PENDING,
      isApproved: false,
      photos: {
        create: [
          {
            url: 'https://sandbox-storage.pataspace.local/media/listings/listing-2-photo-1.jpg',
            s3Key: 'media/listings/listing-2-photo-1.jpg',
            order: 1,
          },
        ],
      },
    },
  });

  const unlock = await prisma.unlock.create({
    data: {
      listingId: activeListing.id,
      buyerId: incomingTenant.id,
      creditsSpent: 2500,
      revealedPhoneEncrypted: encryptField('+254700000002', encryptionKey),
      revealedAddressEncrypted: encryptField(
        '123 Argwings Kodhek Road, Kilimani',
        encryptionKey,
      ),
      revealedGPS: '-1.2921,36.783',
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: incomingTenant.id,
      type: TransactionType.SPEND,
      amount: -2500,
      balanceBefore: 12000,
      balanceAfter: 9500,
      status: TransactionStatus.COMPLETED,
      phoneNumberHash: hashLookupValue(normalizePhoneNumber('+254700000003')),
      unlockId: unlock.id,
      description: 'Seed unlock transaction',
    },
  });

  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'commission_rate',
        value: '0.30',
        description: '30 percent of unlock fee',
      },
      {
        key: 'unlock_cost_percentage',
        value: '0.10',
        description: '10 percent of monthly rent',
      },
      {
        key: 'confirmation_period_days',
        value: '7',
        description: 'Waiting period before commission payout',
      },
    ],
  });

  console.log('Seeded Phase 1 backend data.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
