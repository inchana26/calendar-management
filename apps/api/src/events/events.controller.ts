import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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

import { EventsService } from './events.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  private readonly attachmentDirectory = join(
    process.cwd(),
    'uploads',
    'event-attachments',
  );

  @Get()
  findAll(
    @CurrentUser()
    user: JwtUser,
  ) {
    return this.eventsService.findAll(user);
  }

  /*
   * Real event attachment upload.
   * This stores the actual file on the API server instead of storing only
   * the browser filename.
   */
  @Post('attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_request, file, callback) => {
        const allowedExtensions = new Set([
          '.pdf',
          '.jpg',
          '.jpeg',
          '.png',
        ]);

        const extension = extname(file.originalname || '').toLowerCase();

        if (!allowedExtensions.has(extension)) {
          callback(
            new BadRequestException(
              'Only PDF, JPG, JPEG and PNG attachments are allowed.',
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
      throw new BadRequestException('Attachment file is required.');
    }

    await fs.mkdir(this.attachmentDirectory, {
      recursive: true,
    });

    const extension = extname(file.originalname || '').toLowerCase();
    const safeBaseName =
      basename(file.originalname || 'attachment', extension)
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'attachment';

    const storedName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}-${safeBaseName}${extension}`;

    await fs.writeFile(
      join(this.attachmentDirectory, storedName),
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

  /*
   * Protected download endpoint.
   * The frontend calls this with the same Bearer token used by /events.
   */
  @Get('attachments/:storedName')
  async downloadAttachment(
    @Param('storedName')
    storedName: string,
    @Res()
    response: Response,
  ) {
    const safeStoredName = basename(storedName);

    if (!safeStoredName || safeStoredName !== storedName) {
      throw new BadRequestException('Invalid attachment name.');
    }

    const filePath = join(
      this.attachmentDirectory,
      safeStoredName,
    );

    try {
      await fs.access(filePath);
    } catch {
      throw new BadRequestException('Attachment file was not found.');
    }

    return response.download(filePath);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.eventsService.findOne(id);
  }

  @Post()
  create(
    @Body() data: CreateEventDto,
    @CurrentUser()
    user: JwtUser,
  ) {
    return this.eventsService.create(
      data,
      user,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    data: UpdateEventDto,
  ) {
    return this.eventsService.update(
      id,
      data,
    );
  }

  // Fallback delete when frontend does not have backendId.
  // IMPORTANT: Keep this BEFORE @Delete(':id').
  @Delete('by-details')
  removeByDetails(
    @Body()
    data: {
      title: string;
      startDate?: string;
      startTime?: string;
    },
  ) {
    return this.eventsService.removeByDetails(
      data,
    );
  }

  // Normal delete using exact PostgreSQL Event ID.
  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.eventsService.remove(
      id,
    );
  }
}
