import { Controller, Get } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import {
  HealthResponseDto,
  ReadinessResponseDto,
} from './common/swagger/swagger.responses';

@ApiTags('System')
@ApiHeader({
  name: 'x-request-id',
  required: false,
  description: 'Optional request correlation ID supplied by the client.',
})
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Liveness probe for the API service' })
  @ApiOkResponse({
    type: HealthResponseDto,
    description: 'The API process is running and able to serve requests.',
  })
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Readiness probe for critical backend dependencies' })
  @ApiOkResponse({
    type: ReadinessResponseDto,
    description: 'Reports readiness and dependency status for the current environment.',
  })
  @Get('ready')
  getReadiness() {
    return this.appService.getReadiness();
  }
}
