import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    const isRenderExternal =
      databaseUrl.includes('render.com');

    const adapter = new PrismaPg({
      connectionString: databaseUrl,

      // Render external PostgreSQL connection
      ssl: isRenderExternal
        ? {
            rejectUnauthorized: false,
          }
        : undefined,

      // Keep the local connection pool small and stable
      max: 5,

      // Wait up to 15 seconds while opening a DB connection
      connectionTimeoutMillis: 15000,

      // Prevent stale connections from staying open forever
      idleTimeoutMillis: 30000,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();

    console.log('PostgreSQL connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}