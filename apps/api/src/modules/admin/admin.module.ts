/**
 * Purpose: Wires the admin console's API surface — listing moderation,
 *   listing CRUD, user management, and dashboard metrics.
 * Why important: Everything here is Role.ADMIN-gated; it is the backend of
 *   the /admin section in apps/web.
 * Used by: AppModule.
 */
import { Module } from '@nestjs/common';
import { ListingModule } from '../listing/listing.module';
import { UserModule } from '../user/user.module';
import { AdminController } from './admin.controller';
import { AdminDisputesController } from './admin-disputes.controller';
import { AdminListingsController } from './admin-listings.controller';
import { AdminMetricsController } from './admin-metrics.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminDisputeService } from './application/admin-dispute.service';
import { AdminListingService } from './application/admin-listing.service';
import { AdminMetricsService } from './application/admin-metrics.service';
import { AdminTrustMetricsService } from './application/admin-trust-metrics.service';
import { AdminUserService } from './application/admin-user.service';

@Module({
  imports: [ListingModule, UserModule],
  controllers: [
    AdminController,
    AdminDisputesController,
    AdminListingsController,
    AdminMetricsController,
    AdminUsersController,
  ],
  providers: [
    AdminDisputeService,
    AdminListingService,
    AdminMetricsService,
    AdminTrustMetricsService,
    AdminUserService,
  ],
})
export class AdminModule {}
