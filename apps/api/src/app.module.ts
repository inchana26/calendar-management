import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EventsModule } from './events/events.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DiscussionModule } from './discussion/discussion.module.js';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    AuthModule,
    DiscussionModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}