/**
 * Purpose: HTTP transport for the credit wallet reads: balance summary and
 * transaction history.
 * Why important: read-only surface for the mobile wallet screens; delegates
 * to CreditQueryService, never to the movement engine.
 * Used by: mobile wallet screens via the global auth guard.
 */
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreditBalance,
  CreditTransactionFilters,
  creditTransactionFiltersSchema,
  PaginatedCreditTransactionsResponse,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreditBalanceResponseDto,
  CreditTransactionsResponseDto,
} from './credit.docs';
import { CreditQueryService } from './credit-query.service';

@ApiTags('Credits')
@ApiBearerAuth('bearer')
@Controller('credits')
export class CreditController {
  constructor(private readonly creditQueryService: CreditQueryService) {}

  @ApiOperation({ summary: 'Get the authenticated user credit balance summary' })
  @ApiOkResponse({
    type: CreditBalanceResponseDto,
    description: 'Current credit balance and pending commissions.',
  })
  @Get('balance')
  getBalance(@CurrentUser('id') userId: string): Promise<CreditBalance> {
    return this.creditQueryService.getBalance(userId);
  }

  @ApiOperation({ summary: 'Get credit transaction history for the authenticated user' })
  @ApiQuery({ name: 'type', required: false, enum: ['PURCHASE', 'SPEND', 'REFUND', 'BONUS'] })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: CreditTransactionsResponseDto,
    description: 'Paginated credit transaction history.',
  })
  @Get('transactions')
  getTransactionHistory(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(creditTransactionFiltersSchema))
    filters: CreditTransactionFilters,
  ): Promise<PaginatedCreditTransactionsResponse> {
    return this.creditQueryService.getTransactionHistory(userId, filters);
  }
}
