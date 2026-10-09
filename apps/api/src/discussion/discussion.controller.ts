import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { promises as fs } from 'fs';
import { basename, extname, join } from 'path';

import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtUser } from '../auth/jwt-user.interface.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

import { DiscussionService } from './discussion.service.js';
import { CreateDiscussionPostDto } from './dto/create-post.dto.js';
import { UpdateDiscussionPostDto } from './dto/update-post.dto.js';
import { CreateDiscussionReplyDto } from './dto/create-reply.dto.js';
import { DiscussionReactionDto } from './dto/reaction.dto.js';
import { DiscussionVoteDto } from './dto/vote.dto.js';
import { DiscussionReportDto } from './dto/report.dto.js';

@Controller('discussion')
@UseGuards(JwtAuthGuard)
export class DiscussionController {
  constructor(
    private readonly discussionService: DiscussionService,
  ) {}

  private readonly attachmentDirectory = join(
    process.cwd(),
    'uploads',
    'discussion-attachments',
  );

  @Get('communities')
  getCommunities(
    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.getCommunities(user);
  }

  @Get('posts')
  findAll(
    @CurrentUser()
    user: JwtUser,

    @Query('search')
    search?: string,

    @Query('communityId')
    communityId?: string,

    @Query('scopeId')
    scopeId?: string,

    @Query('type')
    type?: string,

    @Query('status')
    status?: string,

    @Query('sort')
    sort?: string,
  ) {
    return this.discussionService.findAll(user, {
      search,
      communityId,
      scopeId,
      type,
      status,
      sort,
    });
  }

  @Get('posts/:id')
  findOne(
    @Param('id')
    id: string,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.findOne(id, user);
  }

  @Post('posts')
  create(
    @Body()
    data: CreateDiscussionPostDto,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.create(data, user);
  }

  @Patch('posts/:id')
  update(
    @Param('id')
    id: string,

    @Body()
    data: UpdateDiscussionPostDto,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.update(id, data, user);
  }

  @Delete('posts/:id')
  remove(
    @Param('id')
    id: string,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.remove(id, user);
  }

  @Post('posts/:id/replies')
  addReply(
    @Param('id')
    id: string,

    @Body()
    data: CreateDiscussionReplyDto,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.addReply(id, data, user);
  }

  @Patch('replies/:replyId/accept')
  acceptReply(
    @Param('replyId')
    replyId: string,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.acceptReply(replyId, user);
  }

  @Post('posts/:id/reactions')
  react(
    @Param('id')
    id: string,

    @Body()
    data: DiscussionReactionDto,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.react(id, data, user);
  }

  @Post('posts/:id/bookmark')
  bookmark(
    @Param('id')
    id: string,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.toggleBookmark(id, user);
  }

  @Post('posts/:id/follow')
  follow(
    @Param('id')
    id: string,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.toggleFollow(id, user);
  }

  @Post('posts/:id/vote')
  vote(
    @Param('id')
    id: string,

    @Body()
    data: DiscussionVoteDto,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.vote(id, data, user);
  }

  @Post('posts/:id/report')
  report(
    @Param('id')
    id: string,

    @Body()
    data: DiscussionReportDto,

    @CurrentUser()
    user: JwtUser,
  ) {
    return this.discussionService.report(id, data, user);
  }

  @Post('attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },

      fileFilter: (_request, file, callback) => {
        const allowedExtensions = new Set([
          '.pdf',
          '.doc',
          '.docx',
          '.txt',
          '.jpg',
          '.jpeg',
          '.png',
        ]);

        const extension = extname(
          file.originalname || '',
        ).toLowerCase();

        if (!allowedExtensions.has(extension)) {
          callback(
            new BadRequestException(
              'Only PDF, DOC, DOCX, TXT, JPG, JPEG and PNG attachments are allowed.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadAttachment(
    @UploadedFile()
    file?: {
      originalname: string;
      buffer: Buffer;
    },
  ) {
    if (!file) {
      throw new BadRequestException(
        'Attachment file is required.',
      );
    }

    await fs.mkdir(
      this.attachmentDirectory,
      {
        recursive: true,
      },
    );

    const extension = extname(
      file.originalname || '',
    ).toLowerCase();

    const safeBaseName =
      basename(
        file.originalname || 'attachment',
        extension,
      )
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '') ||
      'attachment';

    const storedName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}-${safeBaseName}${extension}`;

    await fs.writeFile(
      join(
        this.attachmentDirectory,
        storedName,
      ),
      file.buffer,
    );

    return {
      storedName,
      originalName: file.originalname,

      attachment: JSON.stringify({
        storedName,
        originalName: file.originalname,
      }),
    };
  }

  @Get('attachments/:storedName')
  async downloadAttachment(
    @Param('storedName')
    storedName: string,

    @Res()
    response: Response,
  ) {
    const safeStoredName =
      basename(storedName);

    if (
      !safeStoredName ||
      safeStoredName !== storedName
    ) {
      throw new BadRequestException(
        'Invalid attachment name.',
      );
    }

    const filePath = join(
      this.attachmentDirectory,
      safeStoredName,
    );

    try {
      await fs.access(filePath);
    } catch {
      throw new BadRequestException(
        'Attachment file was not found.',
      );
    }

    return response.download(filePath);
  }
}
