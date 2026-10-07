import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { type HealthReport, HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async check(): Promise<HealthReport> {
    const report = await this.health.check();
    // 503 lets load balancers / docker healthchecks treat a missing dependency as unhealthy.
    if (report.status !== 'ok') throw new ServiceUnavailableException(report);
    return report;
  }
}
