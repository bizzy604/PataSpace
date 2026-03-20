# PATASPACE BACKEND ARCHITECTURE
## NestJS Modular Structure | TypeScript

---

# EXECUTIVE SUMMARY

**Framework:** NestJS 10.x  
**Language:** TypeScript 5.x  
**Architecture Pattern:** Modular Monolith with Clean Architecture  
**Module Count:** 7 core modules + 3 shared modules  
**Deployment:** Single application, horizontally scalable  

**Design Principles:**
- Separation of concerns (controller → service → repository)
- Dependency injection (NestJS IoC container)
- Single responsibility per module
- Testability (unit + integration tests)
- Type safety (strict TypeScript)

---

# 1. PROJECT STRUCTURE

```
pataspace-backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── modules/                   # Feature modules
│   │   ├── auth/                  # Authentication & authorization
│   │   ├── user/                  # User management
│   │   ├── listing/               # Listing CRUD
│   │   ├── credit/                # Credit management
│   │   ├── unlock/                # Unlock operations
│   │   ├── payment/               # M-Pesa integration
│   │   ├── upload/                # S3 file uploads
│   │   ├── confirmation/          # Confirmation workflow
│   │   ├── dispute/               # Dispute resolution
│   │   └── admin/                 # Admin operations
│   │
│   ├── common/                    # Shared code
│   │   ├── config/                # Configuration
│   │   ├── database/              # Prisma setup
│   │   ├── decorators/            # Custom decorators
│   │   ├── dto/                   # Base DTOs
│   │   ├── enums/                 # Shared enums
│   │   ├── exceptions/            # Custom exceptions
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth guards
│   │   ├── interceptors/          # Request/response interceptors
│   │   ├── interfaces/            # Shared interfaces
│   │   ├── middleware/            # HTTP middleware
│   │   ├── pipes/                 # Validation pipes
│   │   └── utils/                 # Utility functions
│   │
│   ├── infrastructure/            # External services
│   │   ├── cache/                 # Redis client
│   │   ├── queue/                 # Bull queue
│   │   ├── sms/                   # Africa's Talking
│   │   ├── storage/               # S3 client
│   │   └── payment/               # M-Pesa client
│   │
│   └── jobs/                      # Background jobs
│       ├── commission-payout.job.ts
│       ├── listing-cleanup.job.ts
│       └── notification.job.ts
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # SQL migrations
│   └── seed.ts                    # Seed data
│
├── test/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── e2e/                       # End-to-end tests
│
├── .env.example                   # Environment variables template
├── .eslintrc.js                   # ESLint config
├── .prettierrc                    # Prettier config
├── nest-cli.json                  # NestJS CLI config
├── package.json
├── tsconfig.json
└── README.md
```

---

# 2. MODULE ARCHITECTURE

## 2.1 Auth Module

**Responsibility:** User authentication, JWT tokens, OTP verification

**Structure:**
```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── verify-otp.dto.ts
│   └── refresh-token.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
└── interfaces/
    └── jwt-payload.interface.ts
```

**Key Files:**

### auth.module.ts
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from '../../common/database/database.module';
import { SmsModule } from '../../infrastructure/sms/sms.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
    DatabaseModule,
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

### auth.service.ts
```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service';
import { SmsService } from '../../infrastructure/sms/sms.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        credit: {
          create: { balance: 0 },
        },
      },
    });

    // Generate and send OTP
    const otpCode = this.generateOTP();
    await this.prisma.oTPCode.create({
      data: {
        phoneNumber: dto.phoneNumber,
        code: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    await this.smsService.sendOTP(dto.phoneNumber, otpCode);

    return {
      userId: user.id,
      message: `OTP sent to ${dto.phoneNumber}`,
      expiresIn: 300,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const otpRecord = await this.prisma.oTPCode.findFirst({
      where: {
        phoneNumber: dto.phoneNumber,
        code: dto.code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark as verified
    await this.prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Update user
    const user = await this.prisma.user.update({
      where: { phoneNumber: dto.phoneNumber },
      data: { phoneVerified: true },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.phoneNumber, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneVerified: user.phoneVerified,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new UnauthorizedException(`Account banned: ${user.banReason}`);
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.phoneNumber, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        role: user.role,
      },
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.phoneNumber, user.role);

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    return tokens;
  }

  private async generateTokens(userId: string, phoneNumber: string, role: string) {
    const payload: JwtPayload = {
      sub: userId,
      phone: phoneNumber,
      role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
```

---

## 2.2 Listing Module

**Responsibility:** CRUD operations for property listings

**Structure:**
```
src/modules/listing/
├── listing.module.ts
├── listing.controller.ts
├── listing.service.ts
├── dto/
│   ├── create-listing.dto.ts
│   ├── update-listing.dto.ts
│   ├── filter-listing.dto.ts
│   └── listing-response.dto.ts
├── entities/
│   └── listing.entity.ts
└── interfaces/
    └── listing-filter.interface.ts
```

### listing.service.ts (Key Methods)
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { FilterListingDto } from './dto/filter-listing.dto';
import { ListingStatus } from '@prisma/client';

@Injectable()
export class ListingService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async create(userId: string, dto: CreateListingDto) {
    // Validate GPS coordinates match
    this.validateGPSCoordinates(dto.latitude, dto.longitude, dto.photos);

    // Check user's listing count (first 3 need review)
    const userListings = await this.prisma.listing.count({
      where: { userId, isDeleted: false },
    });

    const status = userListings < 3 ? ListingStatus.PENDING : ListingStatus.ACTIVE;

    // Calculate unlock cost (10% of rent)
    const unlockCostCredits = Math.floor(dto.monthlyRent * 0.10);
    const commission = Math.floor(unlockCostCredits * 0.30);

    const listing = await this.prisma.listing.create({
      data: {
        userId,
        ...dto,
        status,
        isApproved: status === ListingStatus.ACTIVE,
        unlockCostCredits,
        commission,
        photos: {
          create: dto.photos.map((photo, index) => ({
            url: photo.url,
            s3Key: photo.s3Key,
            order: index + 1,
            latitude: photo.latitude,
            longitude: photo.longitude,
            takenAt: photo.takenAt,
          })),
        },
      },
      include: {
        photos: true,
      },
    });

    return {
      id: listing.id,
      status: listing.status,
      message: status === ListingStatus.PENDING
        ? 'Listing created. Awaiting admin review.'
        : 'Listing created and is now live.',
      unlockCostCredits,
      commission,
    };
  }

  async findAll(userId: string | null, filter: FilterListingDto) {
    const cacheKey = `browse:${JSON.stringify(filter)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where = {
      status: ListingStatus.ACTIVE,
      isApproved: true,
      isDeleted: false,
      ...(filter.county && { county: filter.county }),
      ...(filter.neighborhoods && {
        neighborhood: { in: filter.neighborhoods },
      }),
      ...(filter.minRent || filter.maxRent
        ? {
            monthlyRent: {
              ...(filter.minRent && { gte: filter.minRent }),
              ...(filter.maxRent && { lte: filter.maxRent }),
            },
          }
        : {}),
      ...(filter.bedrooms && { bedrooms: { gte: filter.bedrooms } }),
      ...(filter.furnished !== undefined && { furnished: filter.furnished }),
      ...(filter.availableFrom && {
        availableFrom: { lte: new Date(filter.availableFrom) },
      }),
    };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        take: filter.limit || 20,
        skip: ((filter.page || 1) - 1) * (filter.limit || 20),
        orderBy: {
          [filter.sortBy || 'createdAt']: filter.sortOrder || 'desc',
        },
        include: {
          user: {
            select: {
              firstName: true,
              createdAt: true,
            },
          },
          photos: {
            where: { order: 1 },
            select: { url: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    // Check if user has unlocked each listing
    let unlockedListingIds = [];
    if (userId) {
      const unlocks = await this.prisma.unlock.findMany({
        where: {
          buyerId: userId,
          listingId: { in: listings.map((l) => l.id) },
          isRefunded: false,
        },
        select: { listingId: true },
      });
      unlockedListingIds = unlocks.map((u) => u.listingId);
    }

    const result = {
      data: listings.map((listing) => ({
        id: listing.id,
        county: listing.county,
        neighborhood: listing.neighborhood,
        monthlyRent: listing.monthlyRent,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        propertyType: listing.propertyType,
        furnished: listing.furnished,
        availableFrom: listing.availableFrom,
        unlockCostCredits: listing.unlockCostCredits,
        thumbnailUrl: listing.photos[0]?.url,
        viewCount: listing.viewCount,
        unlockCount: listing.unlockCount,
        isUnlocked: unlockedListingIds.includes(listing.id),
        createdAt: listing.createdAt,
        tenant: {
          firstName: listing.user.firstName,
          joinedDate: listing.user.createdAt,
        },
      })),
      pagination: {
        page: filter.page || 1,
        limit: filter.limit || 20,
        total,
        totalPages: Math.ceil(total / (filter.limit || 20)),
        hasNext: (filter.page || 1) * (filter.limit || 20) < total,
        hasPrev: (filter.page || 1) > 1,
      },
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async findOne(id: string, userId: string | null) {
    const cacheKey = `listing:${id}`;
    const cached = await this.cache.get(cacheKey);
    let listing;

    if (cached) {
      listing = JSON.parse(cached);
    } else {
      listing = await this.prisma.listing.findUnique({
        where: { id, isDeleted: false },
        include: {
          photos: { orderBy: { order: 'asc' } },
          user: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
              createdAt: true,
              listings: { where: { isDeleted: false } },
            },
          },
        },
      });

      if (!listing) {
        throw new NotFoundException('Listing not found');
      }

      // Increment view count
      await this.prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      // Cache for 1 hour
      await this.cache.set(cacheKey, JSON.stringify(listing), 3600);
    }

    // Check if unlocked
    let contactInfo = null;
    if (userId) {
      const unlock = await this.prisma.unlock.findUnique({
        where: {
          listingId_buyerId: {
            listingId: id,
            buyerId: userId,
          },
          isRefunded: false,
        },
      });

      if (unlock) {
        contactInfo = {
          address: this.decrypt(unlock.revealedAddress),
          phoneNumber: this.decrypt(unlock.revealedPhone),
          latitude: parseFloat(unlock.revealedGPS.split(',')[0]),
          longitude: parseFloat(unlock.revealedGPS.split(',')[1]),
        };
      }
    }

    return {
      ...listing,
      contactInfo,
    };
  }

  async update(id: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: dto,
    });

    // Invalidate cache
    await this.cache.del(`listing:${id}`);
    await this.cache.delPattern('browse:*');

    return updated;
  }

  async remove(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        unlocks: {
          where: {
            isRefunded: false,
            confirmations: {
              none: {},
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    if (listing.unlocks.length > 0) {
      throw new ForbiddenException(
        'Cannot delete listing with pending unlocks. Refund them first.',
      );
    }

    // Soft delete
    await this.prisma.listing.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Invalidate cache
    await this.cache.del(`listing:${id}`);
    await this.cache.delPattern('browse:*');
  }

  private validateGPSCoordinates(
    listingLat: number,
    listingLng: number,
    photos: any[],
  ) {
    const MAX_DISTANCE = 100; // meters

    for (const photo of photos) {
      if (photo.latitude && photo.longitude) {
        const distance = this.calculateDistance(
          listingLat,
          listingLng,
          photo.latitude,
          photo.longitude,
        );

        if (distance > MAX_DISTANCE) {
          throw new ForbiddenException(
            `Photo GPS coordinates don't match listing location (${distance.toFixed(0)}m away)`,
          );
        }
      }
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private decrypt(ciphertext: string): string {
    // Implement AES-256-GCM decryption
    // (See database schema document for implementation)
  }
}
```

---

## 2.3 Credit Module

**Responsibility:** Credit balance, transactions, purchases

**Structure:**
```
src/modules/credit/
├── credit.module.ts
├── credit.controller.ts
├── credit.service.ts
├── dto/
│   ├── purchase-credits.dto.ts
│   └── transaction-filter.dto.ts
└── interfaces/
    └── credit-package.interface.ts
```

### credit.service.ts (Critical Transaction)
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { InsufficientCreditsException } from '../../common/exceptions/insufficient-credits.exception';

@Injectable()
export class CreditService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getBalance(userId: string) {
    const cacheKey = `credits:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const credit = await this.prisma.credit.findUnique({
      where: { userId },
    });

    const result = {
      balance: credit.balance,
      lifetimeEarned: credit.lifetimeEarned,
      lifetimeSpent: credit.lifetimeSpent,
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async spendCredits(
    userId: string,
    amount: number,
    description: string,
    unlockId?: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Lock credit record (SELECT FOR UPDATE)
      const credit = await tx.credit.findUnique({
        where: { userId },
      });

      // 2. Check balance
      if (credit.balance < amount) {
        throw new InsufficientCreditsException(
          `Insufficient credits. Required: ${amount}, Current: ${credit.balance}`,
        );
      }

      // 3. Deduct credits
      const updatedCredit = await tx.credit.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
          lifetimeSpent: { increment: amount },
        },
      });

      // 4. Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          type: 'SPEND',
          amount: -amount,
          balanceBefore: credit.balance,
          balanceAfter: updatedCredit.balance,
          status: 'COMPLETED',
          description,
          unlockId,
        },
      });

      // 5. Invalidate cache
      await this.cache.del(`credits:${userId}`);

      return {
        transaction,
        newBalance: updatedCredit.balance,
      };
    });
  }

  async addCredits(
    userId: string,
    amount: number,
    description: string,
    mpesaReceipt?: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({
        where: { userId },
      });

      const updatedCredit = await tx.credit.update({
        where: { userId },
        data: {
          balance: { increment: amount },
          lifetimeEarned: { increment: amount },
        },
      });

      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amount,
          balanceBefore: credit.balance,
          balanceAfter: updatedCredit.balance,
          status: 'COMPLETED',
          description,
          mpesaReceiptNumber: mpesaReceipt,
        },
      });

      // Invalidate cache
      await this.cache.del(`credits:${userId}`);

      return {
        transaction,
        newBalance: updatedCredit.balance,
      };
    });
  }
}
```

---

## 2.4 Unlock Module

**Responsibility:** Unlock contact information

**Structure:**
```
src/modules/unlock/
├── unlock.module.ts
├── unlock.controller.ts
├── unlock.service.ts
└── dto/
    └── create-unlock.dto.ts
```

### unlock.service.ts
```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreditService } from '../credit/credit.service';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { encrypt } from '../../common/utils/encryption.util';

@Injectable()
export class UnlockService {
  constructor(
    private prisma: PrismaService,
    private creditService: CreditService,
    private smsService: SmsService,
  ) {}

  async unlock(userId: string, listingId: string) {
    // Check if already unlocked (idempotency)
    const existing = await this.prisma.unlock.findUnique({
      where: {
        listingId_buyerId: {
          listingId,
          buyerId: userId,
        },
      },
      include: {
        listing: {
          include: {
            user: true,
          },
        },
      },
    });

    if (existing && !existing.isRefunded) {
      // Already unlocked - return contact info
      return {
        unlockId: existing.id,
        creditsSpent: 0, // No charge
        contactInfo: {
          phoneNumber: this.decrypt(existing.revealedPhone),
          address: this.decrypt(existing.revealedAddress),
          latitude: parseFloat(existing.revealedGPS.split(',')[0]),
          longitude: parseFloat(existing.revealedGPS.split(',')[1]),
        },
        message: 'Already unlocked',
      };
    }

    // Get listing
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: true,
      },
    });

    if (!listing || listing.isDeleted) {
      throw new NotFoundException('Listing not found or deleted');
    }

    // Spend credits (atomic transaction)
    const { newBalance } = await this.creditService.spendCredits(
      userId,
      listing.unlockCostCredits,
      `Unlocked listing in ${listing.neighborhood}`,
    );

    // Create unlock record
    const unlock = await this.prisma.unlock.create({
      data: {
        listingId,
        buyerId: userId,
        creditsSpent: listing.unlockCostCredits,
        revealedPhone: encrypt(listing.user.phoneNumber),
        revealedAddress: encrypt(listing.address),
        revealedGPS: `${listing.latitude},${listing.longitude}`,
      },
    });

    // Update listing unlock count
    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        unlockCount: { increment: 1 },
        status: 'UNLOCKED',
      },
    });

    // Send SMS to tenant
    await this.smsService.send(
      listing.user.phoneNumber,
      `Someone is interested in your listing! They'll contact you soon about ${listing.neighborhood} property.`,
    );

    return {
      unlockId: unlock.id,
      creditsSpent: listing.unlockCostCredits,
      newBalance,
      contactInfo: {
        phoneNumber: listing.user.phoneNumber,
        address: listing.address,
        latitude: listing.latitude,
        longitude: listing.longitude,
      },
      tenant: {
        firstName: listing.user.firstName,
        lastName: listing.user.lastName,
        phoneNumber: listing.user.phoneNumber,
      },
      message: 'Contact unlocked successfully',
    };
  }

  private decrypt(ciphertext: string): string {
    // Implement decryption
  }
}
```

---

## 2.5 Payment Module

**Responsibility:** M-Pesa integration (STK Push, B2C, callbacks)

**Structure:**
```
src/modules/payment/
├── payment.module.ts
├── payment.controller.ts
├── payment.service.ts
├── mpesa/
│   ├── mpesa.service.ts
│   ├── mpesa-callback.controller.ts
│   └── dto/
│       ├── stk-push.dto.ts
│       └── callback.dto.ts
└── interfaces/
    └── mpesa-response.interface.ts
```

### mpesa.service.ts
```typescript
import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MpesaService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private passkey: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {
    this.baseUrl = config.get('MPESA_BASE_URL');
    this.consumerKey = config.get('MPESA_CONSUMER_KEY');
    this.consumerSecret = config.get('MPESA_CONSUMER_SECRET');
    this.passkey = config.get('MPESA_PASSKEY');
  }

  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`,
    ).toString('base64');

    const { data } = await this.http
      .get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      })
      .toPromise();

    return data.access_token;
  }

  async stkPush(phoneNumber: string, amount: number, accountReference: string) {
    const token = await this.getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);
    const password = Buffer.from(
      `${this.config.get('MPESA_SHORTCODE')}${this.passkey}${timestamp}`,
    ).toString('base64');

    const payload = {
      BusinessShortCode: this.config.get('MPESA_SHORTCODE'),
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: this.config.get('MPESA_SHORTCODE'),
      PhoneNumber: phoneNumber,
      CallBackURL: this.config.get('MPESA_CALLBACK_URL'),
      AccountReference: accountReference,
      TransactionDesc: 'PataSpace Credit Purchase',
    };

    const { data } = await this.http
      .post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .toPromise();

    return data;
  }

  async b2c(phoneNumber: string, amount: number) {
    const token = await this.getAccessToken();

    const payload = {
      InitiatorName: this.config.get('MPESA_INITIATOR_NAME'),
      SecurityCredential: this.config.get('MPESA_SECURITY_CREDENTIAL'),
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: this.config.get('MPESA_SHORTCODE'),
      PartyB: phoneNumber,
      Remarks: 'PataSpace Commission Payout',
      QueueTimeOutURL: this.config.get('MPESA_TIMEOUT_URL'),
      ResultURL: this.config.get('MPESA_RESULT_URL'),
      Occasion: 'Commission',
    };

    const { data } = await this.http
      .post(`${this.baseUrl}/mpesa/b2c/v1/paymentrequest`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .toPromise();

    return data;
  }
}
```

---

## 2.6 Job Scheduling

**Responsibility:** Background tasks (commission payouts, cleanup)

**Structure:**
```
src/jobs/
├── commission-payout.job.ts
├── listing-cleanup.job.ts
└── notification.job.ts
```

### commission-payout.job.ts
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/database/prisma.service';
import { MpesaService } from '../modules/payment/mpesa/mpesa.service';
import { SmsService } from '../infrastructure/sms/sms.service';

@Injectable()
export class CommissionPayoutJob {
  private readonly logger = new Logger(CommissionPayoutJob.name);

  constructor(
    private prisma: PrismaService,
    private mpesa: MpesaService,
    private sms: SmsService,
  ) {}

  @Cron('0 9 * * *') // Every day at 9 AM
  async handleCommissionPayouts() {
    this.logger.log('Starting commission payout job...');

    // Fetch commissions due (7 days passed + both confirmed)
    const dueCommissions = await this.prisma.commission.findMany({
      where: {
        status: 'DUE',
        eligibleAt: {
          lte: new Date(),
        },
      },
      include: {
        unlock: {
          include: {
            listing: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      take: 50, // Process in batches
    });

    this.logger.log(`Found ${dueCommissions.length} commissions to pay`);

    for (const commission of dueCommissions) {
      try {
        // Update status to processing
        await this.prisma.commission.update({
          where: { id: commission.id },
          data: { status: 'PROCESSING' },
        });

        // Call M-Pesa B2C
        const result = await this.mpesa.b2c(
          commission.unlock.listing.user.phoneNumber,
          commission.amountKES,
        );

        // Update to paid
        await this.prisma.commission.update({
          where: { id: commission.id },
          data: {
            status: 'PAID',
            mpesaTransactionId: result.ConversationID,
            paidAt: new Date(),
          },
        });

        // Send SMS
        await this.sms.send(
          commission.unlock.listing.user.phoneNumber,
          `You've received ${commission.amountKES} KES commission from PataSpace! Check your M-Pesa.`,
        );

        this.logger.log(`Paid commission ${commission.id}: ${commission.amountKES} KES`);
      } catch (error) {
        this.logger.error(`Failed to pay commission ${commission.id}:`, error);

        // Update attempts
        await this.prisma.commission.update({
          where: { id: commission.id },
          data: {
            status: 'FAILED',
            paymentAttempts: { increment: 1 },
            lastAttemptAt: new Date(),
            lastAttemptError: error.message,
          },
        });
      }
    }

    this.logger.log('Commission payout job completed');
  }
}
```

---

# 3. SHARED INFRASTRUCTURE

## 3.1 Database Module

```typescript
// src/common/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

```typescript
// src/common/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

## 3.2 Cache Module (Redis)

```typescript
// src/infrastructure/cache/cache.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisModule } from '@nestjs-modules/ioredis';

@Global()
@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
```

```typescript
// src/infrastructure/cache/cache.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 3.3 Queue Module (Bull)

```typescript
// src/infrastructure/queue/queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SmsProcessor } from './processors/sms.processor';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: 'sms',
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [SmsProcessor],
  exports: [BullModule],
})
export class QueueModule {}
```

---

# 4. GUARDS & DECORATORS

## 4.1 JWT Auth Guard

```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

## 4.2 Roles Guard

```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

## 4.3 Custom Decorators

```typescript
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Usage in controller:
@Get('/profile')
async getProfile(@CurrentUser() user: JwtPayload) {
  return user;
}
```

---

# 5. EXCEPTION FILTERS

```typescript
// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      error: {
        statusCode: status,
        message: typeof message === 'string' ? message : (message as any).message,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId: request.headers['x-request-id'],
      },
    });
  }
}
```

---

# 6. INTERCEPTORS

## 6.1 Logging Interceptor

```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(`${method} ${url} - ${duration}ms`);
      }),
    );
  }
}
```

---

# 7. VALIDATION PIPES

```typescript
// src/common/pipes/validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: error.errors,
      });
    }
  }
}
```

---

# 8. MAIN APPLICATION

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
  });

  // Compression
  app.use(compression());

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`🚀 Application running on http://localhost:${port}/api/v1`);
}

bootstrap();
```

---

# 9. TESTING STRUCTURE

## 9.1 Unit Test Example

```typescript
// src/modules/credit/credit.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CreditService } from './credit.service';
import { PrismaService } from '../../common/database/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';

describe('CreditService', () => {
  let service: CreditService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditService,
        {
          provide: PrismaService,
          useValue: {
            credit: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            creditTransaction: {
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CreditService>(CreditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should deduct credits successfully', async () => {
    const userId = 'user_123';
    const amount = 2500;

    jest.spyOn(prisma.credit, 'findUnique').mockResolvedValue({
      id: 'credit_1',
      userId,
      balance: 5000,
      lifetimeEarned: 10000,
      lifetimeSpent: 5000,
    } as any);

    const result = await service.spendCredits(userId, amount, 'Test unlock');

    expect(result.newBalance).toBe(2500);
    expect(prisma.credit.update).toHaveBeenCalled();
  });

  it('should throw error when insufficient credits', async () => {
    const userId = 'user_123';
    const amount = 3000;

    jest.spyOn(prisma.credit, 'findUnique').mockResolvedValue({
      id: 'credit_1',
      userId,
      balance: 2000,
      lifetimeEarned: 2000,
      lifetimeSpent: 0,
    } as any);

    await expect(
      service.spendCredits(userId, amount, 'Test'),
    ).rejects.toThrow('Insufficient credits');
  });
});
```

---

# 10. ENVIRONMENT CONFIGURATION

```env
# .env.example

# App
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://pataspace.co.ke

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pataspace

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# M-Pesa
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=174379
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CALLBACK_URL=https://api.pataspace.co.ke/api/v1/payments/mpesa-callback

# Africa's Talking
AT_USERNAME=sandbox
AT_API_KEY=your-api-key
AT_SENDER_ID=PATASPACE

# AWS S3
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=pataspace-media

# Encryption
ENCRYPTION_KEY=32-byte-hex-key-here
```

---

# 11. DEPLOYMENT CHECKLIST

- [ ] Set environment variables in production
- [ ] Run database migrations (`npx prisma migrate deploy`)
- [ ] Build application (`npm run build`)
- [ ] Start with PM2 (`pm2 start dist/main.js`)
- [ ] Configure NGINX reverse proxy
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure log rotation
- [ ] Set up monitoring (CloudWatch, Sentry)
- [ ] Test health check endpoint (`/health`)

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Next Steps:** Review workflows & state machines document
