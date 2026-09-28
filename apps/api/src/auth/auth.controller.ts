import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  login(
    @Body()
    body: LoginDto,
  ) {
    return this.authService.login(
      body.email,
      body.password,
    );
  }

  @Post('calendar-login')
  calendarLogin(
    @Body()
    body: {
      role: string;
      tenantType?: string;
    },
  ) {
    return this.authService.calendarLogin(
      body.role,
      body.tenantType,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Req()
    request: {
      user: unknown;
    },
  ) {
    return request.user;
  }
}
