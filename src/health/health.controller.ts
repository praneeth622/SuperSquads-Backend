import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  @Get()
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'super-squads-backend',
    };
  }

  @Get('ready')
  async ready() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const dbCheck = checks[0];
    const redisCheck = checks[1];

    const isHealthy =
      dbCheck.status === 'fulfilled' && redisCheck.status === 'fulfilled';

    return {
      status: isHealthy ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck.status === 'fulfilled' ? 'ok' : 'error',
        redis: redisCheck.status === 'fulfilled' ? 'ok' : 'error',
      },
      details: {
        database:
          dbCheck.status === 'fulfilled'
            ? dbCheck.value
            : (dbCheck as any).reason,
        redis:
          redisCheck.status === 'fulfilled'
            ? redisCheck.value
            : (redisCheck as any).reason,
      },
    };
  }

  private async checkDatabase() {
    try {
      const result = await this.dataSource.query('SELECT 1');
      return { status: 'connected', result };
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  private async checkRedis() {
    try {
      await this.cacheManager.set('health-check', 'ok', 5000);
      const result = await this.cacheManager.get('health-check');
      await this.cacheManager.del('health-check');

      if (result !== 'ok') {
        throw new Error('Redis read/write test failed');
      }

      return { status: 'connected' };
    } catch (error) {
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }
}
