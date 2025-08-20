import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { Environment } from './env.schema';

export const getRedisConfig = async (configService: ConfigService<Environment>): Promise<CacheModuleOptions> => {
  return {
    store: await redisStore({
      url: configService.get('REDIS_URL'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    }),
    ttl: 300, // 5 minutes default TTL
    max: 100, // Maximum number of items in cache
  };
};
