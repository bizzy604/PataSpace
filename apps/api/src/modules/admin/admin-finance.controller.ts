/**
 * Purpose: HTTP surface for the admin finance console — payout summary tiles,
 *   the commission payout ledger, and the retry-a-failed-payout action.
 * Why important: Makes failed B2C payouts visible and requeuable from the
 *   console; every route requires Role.ADMIN and the retry is audit-logged.
 * Used by: apps/web /admin/finance page via the API.
 */
import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminFinanceSummaryResponse,
  AdminPayoutLedgerResponse,
  AdminRetryPayoutResponse,
  adminFinanceTransactionsQuerySchema,
} from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AdminFinanceService,
  AdminPayoutLedgerQuery,
} from './application/admin-finance.service';
import { AdminPayoutRetryService } from './application/admin-payout-retry.service';
import {
  AdminFinanceSummaryResponseDto,
  AdminPayoutLedgerResponseDto,
  AdminRetryPayoutResponseDto,
} from './docs/admin-finance.docs';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(Role.ADMIN)
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(
    private readonly financeService: AdminFinanceService,
    private readonly retryService: AdminPayoutRetryService,
  ) {}

  @ApiOperation({ summary: 'Payout summary tiles (pending, failed, paid)' })
  @ApiOkResponse({ type: AdminFinanceSummaryResponseDto, description: 'Live payout aggregates.' })
  @Get('summary')
  getSummary(): Promise<AdminFinanceSummaryResponse> {
    return this.financeService.getSummary();
  }

  @ApiOperation({ summary: 'Commission payout ledger with status filter + search' })
  @ApiOkResponse({ type: AdminPayoutLedgerResponseDto, description: 'Paginated payout ledger.' })
  @Get('transactions')
  listTransactions(
    @Query(new ZodValidationPipe(adminFinanceTransactionsQuerySchema))
    query: AdminPayoutLedgerQuery,
  ): Promise<AdminPayoutLedgerResponse> {
    return this.financeService.listPayouts(query);
  }

  @ApiOperation({ summary: 'Requeue a failed payout and drive one send now' })
  @ApiParam({ name: 'id', example: 'cm8commission123' })
  @ApiOkResponse({ type: AdminRetryPayoutResponseDto, description: 'Retry outcome.' })
  @HttpCode(200)
  @Post('commissions/:id/retry')
  retryPayout(
    @CurrentUser('id') adminId: string,
    @Param('id') commissionId: string,
  ): Promise<AdminRetryPayoutResponse> {
    return this.retryService.retry(adminId, commissionId);
  }
}
