/**
 * Purpose: Mover-to-poster supply flywheel (spec v1.2 section 4.6): turns a
 * confirmed move-in into a seeded listing draft with an earnings estimate,
 * so every transaction generates supply instead of consuming it.
 * Why important: the person confirming a move-in is vacating another house
 * right now — the highest-intent posting moment that will ever exist.
 * Used by: ListingController (POST /listings/from-confirmation),
 * MoverPosterReminderJob (estimate for the one reminder SMS).
 */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfirmationSide } from '@prisma/client';
import {
  PosterRole,
  SeedListingFromConfirmationResponse,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import {
  computeSuccessFeeKes,
  posterShareKes,
  PricingConfig,
} from './domain/pricing.policy';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class ListingSeedService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  async seedFromConfirmation(
    userId: string,
    confirmationId: string,
  ): Promise<SeedListingFromConfirmationResponse> {
    const confirmation = await this.prismaService.confirmation.findUnique({
      where: {
        id: confirmationId,
      },
      select: {
        id: true,
        userId: true,
        side: true,
        unlock: {
          select: {
            listing: {
              select: {
                monthlyRent: true,
              },
            },
          },
        },
      },
    });

    if (!confirmation) {
      throw new NotFoundException({
        code: 'CONFIRMATION_NOT_FOUND',
        message: 'Move-in confirmation was not found',
      });
    }

    if (
      confirmation.userId !== userId ||
      confirmation.side !== ConfirmationSide.INCOMING_TENANT
    ) {
      throw new ForbiddenException({
        code: 'INVALID_SEED_CONFIRMATION',
        message: 'Only the mover who confirmed this move-in can post the vacated unit',
      });
    }

    const existingSeededListing = await this.prismaService.listing.findUnique({
      where: {
        seededFromConfirmationId: confirmation.id,
      },
      select: {
        id: true,
      },
    });

    if (existingSeededListing) {
      throw new ConflictException({
        code: 'SEEDED_LISTING_EXISTS',
        message: 'A listing was already created from this move-in confirmation',
        details: {
          listingId: existingSeededListing.id,
        },
      });
    }

    const pricingConfig = await this.systemConfig.resolvePricingConfig();
    const estimate = this.estimateEarnings(
      confirmation.unlock.listing.monthlyRent,
      pricingConfig,
    );

    return {
      seededFromConfirmationId: confirmation.id,
      posterRole: PosterRole.OUTGOING_TENANT,
      estimatedEarningsKes: estimate.earningsKes,
      estimateBasisRentKes: estimate.basisRentKes,
      message: `Leaving a house behind? It's worth ~KES ${estimate.earningsKes} on PataSpace. Post it in 2 minutes.`,
    };
  }

  // Rent-history profiles do not exist yet, so the new home's rent is the
  // estimate basis (people move within similar rent bands); the client
  // collects the real figures before capture.
  estimateEarnings(basisRentKes: number, pricingConfig: PricingConfig) {
    return {
      basisRentKes,
      earningsKes: posterShareKes(
        computeSuccessFeeKes(basisRentKes, pricingConfig),
        pricingConfig,
      ),
    };
  }
}
