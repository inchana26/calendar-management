import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { DiscussionController } from './discussion.controller.js';

import { DiscussionService } from './discussion.service.js';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    DiscussionController,
  ],

  providers: [
    DiscussionService,
  ],

  exports: [
    DiscussionService,
  ],
})
export class DiscussionModule {}