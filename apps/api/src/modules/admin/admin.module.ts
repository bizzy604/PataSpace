/**
 * Purpose: Wires the admin console's API surface — listing moderation,
 *   listing CRUD, user management, and dashboard metrics.
 * Why important: Everything here is Role.ADMIN-gated; it is the backend of
 *   the /admin section in apps/web.
 * Used by: AppModule.
 */
import { Module } from '@nestjs/common';
import { JobsModule } from '../../jobs/jobs.module';
import { ListingModule } from '../listing/listing.module';
import { UserModule } from '../user/user.module';
import { AdminController } from './admin.controller';
import { AdminDisputesController } from './admin-disputes.controller';
import { AdminFinanceController } from './admin-finance.controller';
import { AdminListingsController } from './admin-listings.controller';
import { AdminMetricsController } from './admin-metrics.controller';
import { AdminSupportController } from './admin-support.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminDisputeService } from './application/admin-dispute.service';
import { AdminFinanceService } from './application/admin-finance.service';
import { AdminListingService } from './application/admin-listing.service';
import { AdminMetricsService } from './application/admin-metrics.service';
import { AdminPayoutRetryService } from './application/admin-payout-retry.service';
import { AdminSupportActionsService } from './application/admin-support-actions.service';
import { AdminSupportService } from './application/admin-support.service';
import { AdminTrustMetricsService } from './application/admin-trust-metrics.service';
import { AdminUserService } from './application/admin-user.service';

@Module({
  imports: [ListingModule, UserModule, JobsModule],
  controllers: [
    AdminController,
    AdminDisputesController,
    AdminFinanceController,
    AdminListingsController,
    AdminMetricsController,
    AdminSupportController,
    AdminUsersController,
  ],
  providers: [
    AdminDisputeService,
    AdminFinanceService,
    AdminListingService,
    AdminMetricsService,
    AdminPayoutRetryService,
    AdminSupportActionsService,
    AdminSupportService,
    AdminTrustMetricsService,
    AdminUserService,
  ],
})
export class AdminModule {}
