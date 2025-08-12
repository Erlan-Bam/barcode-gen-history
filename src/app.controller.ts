import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './shared/services/prisma.service';
@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Service is alive' })
  @Get('/healthz')
  async liveness() {
    return { status: 'ok' };
  }

  @ApiOperation({ summary: 'Readiness probe' })
  @Get('/readyz')
  async readiness() {
    let db: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }

    const allOk = [db].every((x) => x === 'ok');
    const status = allOk ? 'ready' : 'error';

    if (!allOk) {
      throw new HttpException(
        { status, database: db },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status, database: db };
  }
}
